/*
 * PackageKit D-Bus wrapper for Cockpit
 * Based on cockpit's lib/packagekit.js with TypeScript types
 */

import {
    PkEnum,
    PackageInfo,
    PackageDetails,
    ProgressData,
    TransactionError,
    PackageDependency
} from './types';

const PACKAGEKIT_SERVICE = 'org.freedesktop.PackageKit';
const PACKAGEKIT_OBJECT = '/org/freedesktop/PackageKit';
const PACKAGEKIT_INTERFACE = 'org.freedesktop.PackageKit';
const TRANSACTION_INTERFACE = 'org.freedesktop.PackageKit.Transaction';

let dbusClient: any = null;

/**
 * Get PackageKit D-Bus client
 */
function getDbusClient(): any {
    if (dbusClient === null) {
        dbusClient = cockpit.dbus(PACKAGEKIT_SERVICE, { superuser: 'try', track: true });
        dbusClient.addEventListener('close', () => {
            console.log('PackageKit went away from D-Bus');
            dbusClient = null;
        });
    }
    return dbusClient;
}

/**
 * Call a PackageKit D-Bus method
 */
function call(objectPath: string, iface: string, method: string, args: any[]): Promise<any> {
    return getDbusClient().call(objectPath, iface, method, args);
}

/**
 * Parse a PackageKit package ID into components
 * Format: name;version;arch;repo
 */
export function parsePackageId(packageId: string): PackageInfo {
    const parts = packageId.split(';');
    return {
        id: packageId,
        name: parts[0] || '',
        version: parts[1] || '',
        arch: parts[2] || '',
        repo: parts[3] || '',
        summary: '',
        installed: parts[3]?.includes('installed') || false,
    };
}

/**
 * Watch a running PackageKit transaction
 */
function watchTransaction(
    transactionPath: string,
    signalHandlers: Record<string, (...args: any[]) => void>,
    notifyHandler?: (props: any, path: string) => void
): Promise<void> | null {
    const subscriptions: any[] = [];
    let notifyReturn: Promise<void> | null = null;
    const client = getDbusClient();

    // Listen for PackageKit crashes
    function onClose(event: any, ex: any) {
        console.warn('PackageKit went away during transaction', transactionPath, ':', JSON.stringify(ex));
        if (signalHandlers.ErrorCode) {
            signalHandlers.ErrorCode('close', 'PackageKit crashed');
        }
        if (signalHandlers.Finished) {
            signalHandlers.Finished(PkEnum.EXIT_FAILED);
        }
    }
    client.addEventListener('close', onClose);

    // Subscribe to signals
    if (signalHandlers) {
        Object.keys(signalHandlers).forEach(handler => {
            subscriptions.push(
                client.subscribe(
                    { interface: TRANSACTION_INTERFACE, path: transactionPath, member: handler },
                    (path: string, iface: string, signal: string, args: any[]) =>
                        signalHandlers[handler](...args)
                )
            );
        });
    }

    // Watch for property changes
    if (notifyHandler) {
        notifyReturn = client.watch(transactionPath);
        subscriptions.push(notifyReturn);
        client.addEventListener('notify', (reply: any) => {
            const iface = reply?.detail?.[transactionPath]?.[TRANSACTION_INTERFACE];
            if (iface) {
                notifyHandler(iface, transactionPath);
            }
        });
    }

    // Unsubscribe when transaction finishes
    subscriptions.push(
        client.subscribe(
            { interface: TRANSACTION_INTERFACE, path: transactionPath, member: 'Finished' },
            () => {
                subscriptions.forEach(s => s.remove());
                client.removeEventListener('close', onClose);
            }
        )
    );

    return notifyReturn;
}

/**
 * Create and run a PackageKit transaction
 */
function transaction(
    method: string | undefined,
    arglist: any[],
    signalHandlers?: Record<string, (...args: any[]) => void>,
    notifyHandler?: (props: any, path: string) => void
): Promise<string> {
    return call(PACKAGEKIT_OBJECT, PACKAGEKIT_INTERFACE, 'CreateTransaction', [])
        .then(([transactionPath]: [string]) => {
            if (!signalHandlers && !notifyHandler) {
                return transactionPath;
            }

            const watchPromise = watchTransaction(transactionPath, signalHandlers || {}, notifyHandler) || Promise.resolve();
            return watchPromise.then(() => {
                if (method) {
                    return call(transactionPath, TRANSACTION_INTERFACE, method, arglist)
                        .then(() => transactionPath);
                } else {
                    return transactionPath;
                }
            });
        });
}

/**
 * Run a long cancellable PackageKit transaction
 */
export function cancellableTransaction(
    method: string,
    arglist: any[],
    progressCb?: (progress: ProgressData) => void,
    signalHandlers?: Record<string, (...args: any[]) => void>
): Promise<number> {
    if (signalHandlers?.ErrorCode || signalHandlers?.Finished) {
        throw new Error('cancellableTransaction handles ErrorCode and Finished signals internally');
    }

    return new Promise((resolve, reject) => {
        let cancelled = false;
        let status: number;
        let allowWaitStatus = false;
        const progressData: ProgressData = {
            waiting: false,
            percentage: 0,
            cancel: null
        };

        function changed(props: any, transactionPath: string) {
            function cancel() {
                call(transactionPath, TRANSACTION_INTERFACE, 'Cancel', []);
                cancelled = true;
            }

            if (progressCb) {
                if ('Status' in props) {
                    status = props.Status;
                }
                progressData.waiting = allowWaitStatus && (
                    status === PkEnum.STATUS_WAIT || status === PkEnum.STATUS_WAITING_FOR_LOCK
                );
                if ('AllowCancel' in props) {
                    progressData.cancel = props.AllowCancel ? cancel : null;
                }
                if ('Percentage' in props && props.Percentage <= 100) {
                    progressData.percentage = props.Percentage;
                }

                progressCb(progressData);
            }
        }

        // Ignore STATUS_WAIT during first second (brief transient state)
        setTimeout(() => {
            allowWaitStatus = true;
            changed({}, '');
        }, 1000);

        transaction(
            method,
            arglist,
            Object.assign({
                ErrorCode: (code: string, detail: string) => {
                    progressCb = undefined;
                    reject(new TransactionError(cancelled ? 'cancelled' : code, detail));
                },
                Finished: (exit: number) => {
                    progressCb = undefined;
                    resolve(exit);
                },
            }, signalHandlers || {}),
            changed
        ).catch(ex => {
            progressCb = undefined;
            reject(ex);
        });
    });
}

/**
 * Search for packages by name
 */
export function searchNames(
    query: string,
    progressCb?: (progress: ProgressData) => void
): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];

    return cancellableTransaction(
        'SearchNames',
        [PkEnum.FILTER_ARCH | PkEnum.FILTER_NOT_SOURCE | PkEnum.FILTER_NEWEST, [query]],
        progressCb,
        {
            Package: (info: number, packageId: string, summary: string) => {
                const pkg = parsePackageId(packageId);
                pkg.summary = summary;
                pkg.installed = info === PkEnum.INFO_INSTALLED;
                packages.push(pkg);
            }
        }
    ).then(() => packages);
}

/**
 * Search for packages by details (description, etc.)
 */
export function searchDetails(
    query: string,
    progressCb?: (progress: ProgressData) => void
): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];

    return cancellableTransaction(
        'SearchDetails',
        [PkEnum.FILTER_ARCH | PkEnum.FILTER_NOT_SOURCE | PkEnum.FILTER_NEWEST, [query]],
        progressCb,
        {
            Package: (info: number, packageId: string, summary: string) => {
                const pkg = parsePackageId(packageId);
                pkg.summary = summary;
                pkg.installed = info === PkEnum.INFO_INSTALLED;
                packages.push(pkg);
            }
        }
    ).then(() => packages);
}

/**
 * Get all packages (with optional filter)
 */
export function getPackages(
    filter: number = PkEnum.FILTER_ARCH | PkEnum.FILTER_NOT_SOURCE,
    progressCb?: (progress: ProgressData) => void
): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];

    return cancellableTransaction(
        'GetPackages',
        [filter],
        progressCb,
        {
            Package: (info: number, packageId: string, summary: string) => {
                const pkg = parsePackageId(packageId);
                pkg.summary = summary;
                pkg.installed = info === PkEnum.INFO_INSTALLED;
                packages.push(pkg);
            }
        }
    ).then(() => packages);
}

/**
 * Get detailed information about specific packages
 */
export function getDetails(
    packageIds: string[],
    progressCb?: (progress: ProgressData) => void
): Promise<PackageDetails[]> {
    const details: PackageDetails[] = [];

    return cancellableTransaction(
        'GetDetails',
        [packageIds],
        progressCb,
        {
            Details: (packageId: string, license: string, group: string, detail: string, url: string, size: number) => {
                const pkg = parsePackageId(packageId) as PackageDetails;
                pkg.description = detail;
                pkg.license = license;
                pkg.group = group;
                pkg.url = url;
                pkg.size = size;
                details.push(pkg);
            }
        }
    ).then(() => details);
}

/**
 * Resolve package name to package ID
 */
export function resolve(
    name: string,
    progressCb?: (progress: ProgressData) => void
): Promise<string> {
    const ids: string[] = [];

    return cancellableTransaction(
        'Resolve',
        [PkEnum.FILTER_ARCH | PkEnum.FILTER_NOT_SOURCE | PkEnum.FILTER_NEWEST, [name]],
        progressCb,
        {
            Package: (info: number, packageId: string) => {
                ids.push(packageId);
            }
        }
    ).then(() => {
        if (ids.length === 0) {
            throw new TransactionError('not-found', `Package ${name} not found`);
        }
        return ids[0];
    });
}

/**
 * Install a package
 */
export function installPackage(
    name: string,
    progressCb?: (progress: ProgressData) => void
): Promise<void> {
    return resolve(name, progressCb)
        .then(packageId => {
            return cancellableTransaction(
                'InstallPackages',
                [0, [packageId]],
                progressCb
            );
        })
        .then(() => undefined);
}

/**
 * Remove a package
 */
export function removePackage(
    name: string,
    progressCb?: (progress: ProgressData) => void
): Promise<void> {
    return resolve(name, progressCb)
        .then(packageId => {
            return cancellableTransaction(
                'RemovePackages',
                [0, [packageId], true, false],
                progressCb
            );
        })
        .then(() => undefined);
}

/**
 * Get package dependencies
 */
export function getDependencies(
    packageId: string,
    progressCb?: (progress: ProgressData) => void
): Promise<string[]> {
    const deps: string[] = [];

    return cancellableTransaction(
        'DependsOn',
        [[packageId], PkEnum.FILTER_INSTALLED | PkEnum.FILTER_NOT_SOURCE, false],
        progressCb,
        {
            Package: (info: number, depPackageId: string) => {
                deps.push(depPackageId);
            }
        }
    ).then(() => deps);
}

/**
 * Get packages that depend on this package (reverse dependencies)
 */
export function getReverseDependencies(
    packageId: string,
    progressCb?: (progress: ProgressData) => void
): Promise<string[]> {
    const deps: string[] = [];

    return cancellableTransaction(
        'RequiredBy',
        [[packageId], PkEnum.FILTER_INSTALLED | PkEnum.FILTER_NOT_SOURCE, false],
        progressCb,
        {
            Package: (info: number, depPackageId: string) => {
                deps.push(depPackageId);
            }
        }
    ).then(() => deps);
}

/**
 * Get files installed by a package
 */
export function getFiles(
    packageId: string,
    progressCb?: (progress: ProgressData) => void
): Promise<string[]> {
    const files: string[] = [];

    return cancellableTransaction(
        'GetFiles',
        [[packageId]],
        progressCb,
        {
            Files: (pkgId: string, fileList: string[]) => {
                files.push(...fileList);
            }
        }
    ).then(() => files);
}

/**
 * Refresh package cache
 */
export function refreshCache(
    progressCb?: (progress: ProgressData) => void
): Promise<void> {
    return cancellableTransaction(
        'RefreshCache',
        [false],
        progressCb
    ).then(() => undefined);
}

/**
 * Detect if PackageKit is available
 */
export function detect(): Promise<boolean> {
    function dbusDetect() {
        return call(PACKAGEKIT_OBJECT, 'org.freedesktop.DBus.Properties', 'Get', [PACKAGEKIT_INTERFACE, 'VersionMajor'])
            .then(() => true)
            .catch(() => false);
    }

    return cockpit.spawn(['findmnt', '-T', '/usr', '-n', '-o', 'VFS-OPTIONS'])
        .then((options: string) => {
            if (options.split(',').indexOf('ro') >= 0) {
                return false;
            }
            return dbusDetect();
        })
        .catch(dbusDetect);
}
