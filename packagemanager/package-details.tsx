/*
 * PackageDetails component - Detailed package information
 */

import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    EmptyState,
    EmptyStateBody,
    Flex,
    FlexItem,
    Progress,
    ProgressSize,
    Spinner,
    Title
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React, { useEffect, useState } from 'react';

// Cockpit is loaded as a global via script tag
declare const cockpit: any;

// Custom hook to sync with cockpit.location
function usePageLocation() {
    const [location, setLocation] = useState(cockpit.location);

    useEffect(() => {
        function update() {
            setLocation({ ...cockpit.location });
        }
        cockpit.addEventListener("locationchanged", update);
        return () => cockpit.removeEventListener("locationchanged", update);
    }, []);

    return location;
}

import { getGroupInfo } from './groups';
import * as PK from './packagekit';
import { PackageDetails as PackageDetailsType, ProgressData } from './types';
import { formatSize, getErrorMessage, getPackageName, getStatusLabel } from './utils';

interface PackageDetailsProps {
    packageId: string;
    onBack: () => void;
}

export const PackageDetails: React.FC<PackageDetailsProps> = ({ packageId, onBack }) => {
    const { options } = usePageLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pkg, setPkg] = useState<PackageDetailsType | null>(null);
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [reverseDeps, setReverseDeps] = useState<string[]>([]);
    const [files, setFiles] = useState<string[]>([]);
    const [operating, setOperating] = useState(false);
    const [progress, setProgress] = useState<ProgressData | null>(null);

    // Get group context from URL options
    const groupId = typeof options.group === 'string' ? options.group : undefined;

    useEffect(() => {
        loadPackageDetails();
    }, [packageId]);

    // Keyboard navigation: Escape key goes back
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onBack();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);

    async function loadPackageDetails() {
        setLoading(true);
        setError(null);

        try {
            // Get package details
            const details = await PK.getDetails([packageId]);
            if (details.length === 0) {
                throw new Error('Package not found');
            }

            setPkg(details[0]);

            // Load dependencies
            try {
                const deps = await PK.getDependencies(packageId);
                setDependencies(deps);
            } catch (err) {
                console.warn('Failed to load dependencies:', err);
            }

            // Load reverse dependencies
            try {
                const rdeps = await PK.getReverseDependencies(packageId);
                setReverseDeps(rdeps);
            } catch (err) {
                console.warn('Failed to load reverse dependencies:', err);
            }

            // Load files (only if installed)
            if (details[0].installed) {
                try {
                    const fileList = await PK.getFiles(packageId);
                    setFiles(fileList);
                } catch (err) {
                    console.warn('Failed to load file list:', err);
                }
            }
        } catch (err) {
            console.error('Failed to load package details:', err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleInstall() {
        if (!pkg) return;

        setOperating(true);
        setError(null);

        try {
            await PK.installPackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData);
            });

            // Reload details
            await loadPackageDetails();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setOperating(false);
            setProgress(null);
        }
    }

    async function handleRemove() {
        if (!pkg) return;

        setOperating(true);
        setError(null);

        try {
            await PK.removePackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData);
            });

            // Reload details
            await loadPackageDetails();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setOperating(false);
            setProgress(null);
        }
    }

    if (loading) {
        return (
            <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                <Spinner size="xl" aria-label="Loading package details" />
                <p className="pf-v6-u-mt-md" aria-live="polite">Loading package details...</p>
            </div>
        );
    }

    if (error || !pkg) {
        return (
            <div>
                <Breadcrumb className="pf-v6-u-mb-md">
                    <BreadcrumbItem to="#/">
                        Groups
                    </BreadcrumbItem>
                    {groupId && (
                        <BreadcrumbItem to={`#/group/${groupId}`}>
                            {getGroupInfo(groupId).name}
                        </BreadcrumbItem>
                    )}
                    <BreadcrumbItem isActive>Package</BreadcrumbItem>
                </Breadcrumb>
                <EmptyState>
                    <ExclamationCircleIcon />
                    <Title headingLevel="h1" size="lg">Error loading package</Title>
                    <EmptyStateBody>{error || 'Package not found'}</EmptyStateBody>
                </EmptyState>
            </div>
        );
    }

    const groupInfo = getGroupInfo(pkg.group || 'unknown');

    return (
        <Flex className="package-details" direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem>
                <Breadcrumb className="pf-v6-u-mb-md">
                    <BreadcrumbItem to="#/">
                        Groups
                    </BreadcrumbItem>
                    {groupId && (
                        <BreadcrumbItem to={`#/group/${groupId}`}>
                            {getGroupInfo(groupId).name}
                        </BreadcrumbItem>
                    )}
                    <BreadcrumbItem isActive>{pkg.name}</BreadcrumbItem>
                </Breadcrumb>
            </FlexItem>

            <FlexItem>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                        <Title headingLevel="h1" size="2xl">{pkg.name}</Title>
                        <p className="pf-v6-u-color-200">{pkg.summary}</p>
                    </FlexItem>
                    <FlexItem>
                        <Badge>
                            {getStatusLabel(pkg.installed)}
                        </Badge>
                    </FlexItem>
                </Flex>
            </FlexItem>

            {error && (
                <FlexItem>
                    <div className="pf-v6-c-alert pf-m-danger" role="alert" aria-live="assertive">
                        <div className="pf-v6-c-alert__icon">
                            <ExclamationCircleIcon />
                        </div>
                        <p className="pf-v6-c-alert__title">{error}</p>
                    </div>
                </FlexItem>
            )}

            {operating && progress && (
                <FlexItem>
                    <Progress
                        value={progress.percentage}
                        title={progress.waiting ? 'Waiting for package manager...' : 'Processing...'}
                        size={ProgressSize.lg}
                    />
                </FlexItem>
            )}

            <FlexItem>
                {pkg.installed ? (
                    <Button
                        variant="danger"
                        onClick={handleRemove}
                        isDisabled={operating}
                        isLoading={operating}
                        aria-label={`Remove ${pkg.name} package`}
                    >
                        Remove Package
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleInstall}
                        isDisabled={operating}
                        isLoading={operating}
                        aria-label={`Install ${pkg.name} package`}
                    >
                        Install Package
                    </Button>
                )}
            </FlexItem>

            <FlexItem>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <strong>Version:</strong>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_2' }}>
                                {pkg.version}
                            </FlexItem>
                        </Flex>
                    </FlexItem>

                    <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <strong>Architecture:</strong>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_2' }}>
                                {pkg.arch}
                            </FlexItem>
                        </Flex>
                    </FlexItem>

                    <FlexItem>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem flex={{ default: 'flex_1' }}>
                                <strong>Group:</strong>
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_2' }}>
                                {groupInfo.name}
                            </FlexItem>
                        </Flex>
                    </FlexItem>

                    {pkg.size !== undefined && (
                        <FlexItem>
                            <Flex alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                    <strong>Size:</strong>
                                </FlexItem>
                                <FlexItem flex={{ default: 'flex_2' }}>
                                    {formatSize(pkg.size)}
                                </FlexItem>
                            </Flex>
                        </FlexItem>
                    )}

                    {pkg.license && (
                        <FlexItem>
                            <Flex alignItems={{ default: 'alignItemsCenter' }}>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                    <strong>License:</strong>
                                </FlexItem>
                                <FlexItem flex={{ default: 'flex_2' }}>
                                    {pkg.license}
                                </FlexItem>
                            </Flex>
                        </FlexItem>
                    )}
                </Flex>
            </FlexItem>

            {pkg.url && (
                <FlexItem>
                    <Flex alignItems={{ default: 'alignItemsCenter' }}>
                        <FlexItem flex={{ default: 'flex_1' }}>
                            <strong>Homepage:</strong>
                        </FlexItem>
                        <FlexItem flex={{ default: 'flex_2' }}>
                            <a href={pkg.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${pkg.name} homepage (opens in new tab)`}>{pkg.url}</a>
                        </FlexItem>
                    </Flex>
                </FlexItem>
            )}

            <FlexItem>
                <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                        <strong>Description:</strong>
                    </FlexItem>
                    <FlexItem>
                        <p>{pkg.description || pkg.summary}</p>
                    </FlexItem>
                </Flex>
            </FlexItem>

            {dependencies.length > 0 && (
                <FlexItem>
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem>
                            <strong>Dependencies ({dependencies.length}):</strong>
                        </FlexItem>
                        <FlexItem>
                            <ul className="pf-v6-c-list">
                                {dependencies.slice(0, 10).map(dep => (
                                    <li key={dep}>{getPackageName(dep)}</li>
                                ))}
                                {dependencies.length > 10 && (
                                    <li>... and {dependencies.length - 10} more</li>
                                )}
                            </ul>
                        </FlexItem>
                    </Flex>
                </FlexItem>
            )}

            {reverseDeps.length > 0 && (
                <FlexItem>
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem>
                            <strong>Required by ({reverseDeps.length}):</strong>
                        </FlexItem>
                        <FlexItem>
                            <ul className="pf-v6-c-list">
                                {reverseDeps.slice(0, 10).map(dep => (
                                    <li key={dep}>{getPackageName(dep)}</li>
                                ))}
                                {reverseDeps.length > 10 && (
                                    <li>... and {reverseDeps.length - 10} more</li>
                                )}
                            </ul>
                        </FlexItem>
                    </Flex>
                </FlexItem>
            )}

            {files.length > 0 && (
                <FlexItem>
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem>
                            <strong>Installed Files ({files.length}):</strong>
                        </FlexItem>
                        <FlexItem>
                            <details>
                                <summary>Show file list</summary>
                                <ul className="pf-v6-c-list pf-v6-u-font-size-sm">
                                    {files.map(file => (
                                        <li key={file}><code>{file}</code></li>
                                    ))}
                                </ul>
                            </details>
                        </FlexItem>
                    </Flex>
                </FlexItem>
            )}
        </Flex>
    );
};
