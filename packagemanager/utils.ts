/*
 * Utility functions for Cockpit Package Manager
 */

import { PackageInfo, PackageDetails, GroupInfo, TransactionError } from './types';
import { getGroupInfo, PACKAGEKIT_GROUPS } from './groups';

/**
 * Group packages by their PackageKit group
 */
export function groupPackagesByGroup(packages: PackageDetails[]): Map<string, PackageDetails[]> {
    const grouped = new Map<string, PackageDetails[]>();

    packages.forEach(pkg => {
        const group = pkg.group || 'unknown';
        if (!grouped.has(group)) {
            grouped.set(group, []);
        }
        grouped.get(group)!.push(pkg);
    });

    return grouped;
}

/**
 * Count packages in each group
 */
export function countPackagesByGroup(packages: PackageDetails[]): Map<string, GroupInfo> {
    const counts = new Map<string, GroupInfo>();

    // Initialize all known groups
    Object.keys(PACKAGEKIT_GROUPS).forEach(groupId => {
        const groupDef = PACKAGEKIT_GROUPS[groupId];
        counts.set(groupId, {
            id: groupId,
            name: groupDef.name,
            description: groupDef.description,
            packageCount: 0,
            installedCount: 0,
        });
    });

    // Count packages
    packages.forEach(pkg => {
        const group = pkg.group || 'unknown';
        const info = counts.get(group);
        if (info) {
            info.packageCount++;
            if (pkg.installed) {
                info.installedCount++;
            }
        } else {
            // Unknown group, create entry
            counts.set(group, {
                id: group,
                name: group,
                description: 'Packages without a defined category',
                packageCount: 1,
                installedCount: pkg.installed ? 1 : 0,
            });
        }
    });

    return counts;
}

/**
 * Format bytes to human-readable size
 */
export function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format progress percentage
 */
export function formatProgress(percentage: number): string {
    return `${Math.round(percentage)}%`;
}

/**
 * Get user-friendly error message from TransactionError
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof TransactionError) {
        // Map common error codes to friendly messages
        const errorMessages: Record<string, string> = {
            'cancelled': 'Operation was cancelled',
            'not-found': 'Package not found',
            'already-installed': 'Package is already installed',
            'dep-resolution-failed': 'Could not resolve dependencies',
            'cannot-remove-system-package': 'Cannot remove system package',
            'no-network': 'No network connection',
            'package-download-failed': 'Failed to download package',
            'transaction-error': 'Transaction failed',
        };

        return errorMessages[error.code as string] || error.detail || 'An error occurred';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}

/**
 * Filter packages by search query
 */
export function filterPackages<T extends PackageInfo>(packages: T[], query: string): T[] {
    if (!query) return packages;

    const lowerQuery = query.toLowerCase();
    return packages.filter(pkg =>
        pkg.name.toLowerCase().includes(lowerQuery) ||
        pkg.summary.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Sort packages by name
 */
export function sortPackagesByName<T extends PackageInfo>(packages: T[], ascending = true): T[] {
    return [...packages].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name);
        return ascending ? cmp : -cmp;
    });
}

/**
 * Sort packages by installation status
 */
export function sortPackagesByStatus<T extends PackageInfo>(packages: T[], installedFirst = true): T[] {
    return [...packages].sort((a, b) => {
        if (a.installed === b.installed) {
            return a.name.localeCompare(b.name);
        }
        return installedFirst ? (a.installed ? -1 : 1) : (a.installed ? 1 : -1);
    });
}

/**
 * Sort packages by size (requires PackageDetails with size field)
 * Packages without size info are sorted to the end
 */
export function sortPackagesBySize(packages: PackageDetails[], ascending = true): PackageDetails[] {
    return [...packages].sort((a, b) => {
        const aSize = a.size ?? Number.MAX_SAFE_INTEGER;
        const bSize = b.size ?? Number.MAX_SAFE_INTEGER;
        const cmp = aSize - bSize;
        return ascending ? cmp : -cmp;
    });
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function (this: any, ...args: Parameters<T>) {
        const context = this;

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Check if running with superuser privileges
 */
export function hasSuperuserPrivilege(): boolean {
    // Check cockpit superuser state
    // This is a placeholder - actual implementation depends on cockpit.js API
    return true; // Default to true for now
}

/**
 * Get package status badge variant
 */
export function getStatusVariant(installed: boolean): 'success' | 'info' {
    return installed ? 'success' : 'info';
}

/**
 * Get package status label
 */
export function getStatusLabel(installed: boolean): string {
    return installed ? 'Installed' : 'Available';
}

/**
 * Extract package name from package ID
 * Package ID format: name;version;arch;repo
 */
export function getPackageName(packageId: string): string {
    return packageId.split(';')[0];
}

/**
 * Extract package version from package ID
 */
export function getPackageVersion(packageId: string): string {
    return packageId.split(';')[1] || '';
}

/**
 * Check if two package IDs refer to the same package (same name)
 */
export function isSamePackage(id1: string, id2: string): boolean {
    return getPackageName(id1) === getPackageName(id2);
}
