import { describe, it, expect } from 'vitest';
import {
    formatSize,
    formatProgress,
    filterPackages,
    sortPackagesByName,
    sortPackagesByStatus,
    sortPackagesBySize,
    getPackageName,
    getPackageVersion,
    isSamePackage,
    getErrorMessage,
    groupPackagesByGroup,
    countPackagesByGroup,
    getStatusLabel,
    getStatusVariant,
} from './utils';
import { PackageInfo, PackageDetails, TransactionError } from './types';

describe('formatSize', () => {
    it('formats 0 bytes', () => {
        expect(formatSize(0)).toBe('0 B');
    });

    it('formats bytes', () => {
        expect(formatSize(512)).toBe('512.0 B');
    });

    it('formats kilobytes', () => {
        expect(formatSize(1024)).toBe('1.0 KB');
        expect(formatSize(2048)).toBe('2.0 KB');
    });

    it('formats megabytes', () => {
        expect(formatSize(1048576)).toBe('1.0 MB');
        expect(formatSize(5242880)).toBe('5.0 MB');
    });

    it('formats gigabytes', () => {
        expect(formatSize(1073741824)).toBe('1.0 GB');
        expect(formatSize(2147483648)).toBe('2.0 GB');
    });

    it('formats terabytes', () => {
        expect(formatSize(1099511627776)).toBe('1.0 TB');
    });
});

describe('formatProgress', () => {
    it('rounds percentage to integer', () => {
        expect(formatProgress(0)).toBe('0%');
        expect(formatProgress(25.4)).toBe('25%');
        expect(formatProgress(50.5)).toBe('51%');
        expect(formatProgress(75.9)).toBe('76%');
        expect(formatProgress(100)).toBe('100%');
    });
});

describe('getPackageName', () => {
    it('extracts package name from package ID', () => {
        expect(getPackageName('nginx;1.18.0;arm64;debian')).toBe('nginx');
        expect(getPackageName('apache2;2.4.41;amd64;ubuntu')).toBe('apache2');
    });

    it('handles package ID without semicolons', () => {
        expect(getPackageName('simple-package')).toBe('simple-package');
    });
});

describe('getPackageVersion', () => {
    it('extracts version from package ID', () => {
        expect(getPackageVersion('nginx;1.18.0;arm64;debian')).toBe('1.18.0');
        expect(getPackageVersion('apache2;2.4.41;amd64;ubuntu')).toBe('2.4.41');
    });

    it('returns empty string for package ID without version', () => {
        expect(getPackageVersion('simple-package')).toBe('');
    });
});

describe('isSamePackage', () => {
    it('returns true for same package with different versions', () => {
        expect(isSamePackage('nginx;1.18.0;arm64;debian', 'nginx;1.20.0;arm64;debian')).toBe(true);
    });

    it('returns false for different packages', () => {
        expect(isSamePackage('nginx;1.18.0;arm64;debian', 'apache2;2.4.41;amd64;ubuntu')).toBe(false);
    });

    it('returns true for identical package IDs', () => {
        expect(isSamePackage('nginx;1.18.0;arm64;debian', 'nginx;1.18.0;arm64;debian')).toBe(true);
    });
});

describe('getStatusLabel', () => {
    it('returns "Installed" for installed packages', () => {
        expect(getStatusLabel(true)).toBe('Installed');
    });

    it('returns "Available" for non-installed packages', () => {
        expect(getStatusLabel(false)).toBe('Available');
    });
});

describe('getStatusVariant', () => {
    it('returns "success" for installed packages', () => {
        expect(getStatusVariant(true)).toBe('success');
    });

    it('returns "info" for non-installed packages', () => {
        expect(getStatusVariant(false)).toBe('info');
    });
});

describe('getErrorMessage', () => {
    it('maps TransactionError codes to friendly messages', () => {
        const error = new TransactionError('cancelled', 'Transaction was cancelled');
        expect(getErrorMessage(error)).toBe('Operation was cancelled');
    });

    it('returns detail for unmapped TransactionError codes', () => {
        const error = new TransactionError('unknown-code', 'Some detail message');
        expect(getErrorMessage(error)).toBe('Some detail message');
    });

    it('handles standard Error objects', () => {
        const error = new Error('Standard error message');
        expect(getErrorMessage(error)).toBe('Standard error message');
    });

    it('handles string errors', () => {
        expect(getErrorMessage('String error')).toBe('String error');
    });

    it('handles non-error objects', () => {
        expect(getErrorMessage({ foo: 'bar' })).toBe('[object Object]');
    });
});

describe('filterPackages', () => {
    const packages: PackageInfo[] = [
        { id: '1', name: 'nginx', summary: 'Web server', version: '1.18.0', arch: 'arm64', repo: 'debian', installed: true },
        { id: '2', name: 'apache2', summary: 'HTTP server', version: '2.4.41', arch: 'arm64', repo: 'debian', installed: false },
        { id: '3', name: 'mysql-server', summary: 'Database server', version: '8.0.25', arch: 'arm64', repo: 'debian', installed: false },
    ];

    it('returns all packages when query is empty', () => {
        expect(filterPackages(packages, '')).toEqual(packages);
    });

    it('filters by package name', () => {
        const result = filterPackages(packages, 'nginx');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('nginx');
    });

    it('filters by summary', () => {
        const result = filterPackages(packages, 'server');
        expect(result).toHaveLength(3);
    });

    it('is case-insensitive', () => {
        const result = filterPackages(packages, 'NGINX');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('nginx');
    });

    it('returns empty array when no matches', () => {
        const result = filterPackages(packages, 'nonexistent');
        expect(result).toHaveLength(0);
    });
});

describe('sortPackagesByName', () => {
    const packages: PackageInfo[] = [
        { id: '1', name: 'zsh', summary: 'Shell', version: '5.8', arch: 'arm64', repo: 'debian', installed: false },
        { id: '2', name: 'bash', summary: 'Shell', version: '5.1', arch: 'arm64', repo: 'debian', installed: false },
        { id: '3', name: 'fish', summary: 'Shell', version: '3.3', arch: 'arm64', repo: 'debian', installed: false },
    ];

    it('sorts packages by name in ascending order', () => {
        const result = sortPackagesByName(packages);
        expect(result[0].name).toBe('bash');
        expect(result[1].name).toBe('fish');
        expect(result[2].name).toBe('zsh');
    });

    it('sorts packages by name in descending order', () => {
        const result = sortPackagesByName(packages, false);
        expect(result[0].name).toBe('zsh');
        expect(result[1].name).toBe('fish');
        expect(result[2].name).toBe('bash');
    });

    it('does not modify original array', () => {
        const original = [...packages];
        sortPackagesByName(packages);
        expect(packages).toEqual(original);
    });
});

describe('sortPackagesByStatus', () => {
    const packages: PackageInfo[] = [
        { id: '1', name: 'nginx', summary: 'Web server', version: '1.18.0', arch: 'arm64', repo: 'debian', installed: false },
        { id: '2', name: 'apache2', summary: 'HTTP server', version: '2.4.41', arch: 'arm64', repo: 'debian', installed: true },
        { id: '3', name: 'mysql-server', summary: 'Database', version: '8.0.25', arch: 'arm64', repo: 'debian', installed: false },
        { id: '4', name: 'postgres', summary: 'Database', version: '13.4', arch: 'arm64', repo: 'debian', installed: true },
    ];

    it('sorts installed packages first', () => {
        const result = sortPackagesByStatus(packages, true);
        expect(result[0].installed).toBe(true);
        expect(result[1].installed).toBe(true);
        expect(result[2].installed).toBe(false);
        expect(result[3].installed).toBe(false);
    });

    it('sorts available packages first', () => {
        const result = sortPackagesByStatus(packages, false);
        expect(result[0].installed).toBe(false);
        expect(result[1].installed).toBe(false);
        expect(result[2].installed).toBe(true);
        expect(result[3].installed).toBe(true);
    });

    it('sorts alphabetically within same status', () => {
        const result = sortPackagesByStatus(packages, true);
        expect(result[0].name).toBe('apache2'); // installed
        expect(result[1].name).toBe('postgres'); // installed
        expect(result[2].name).toBe('mysql-server'); // available
        expect(result[3].name).toBe('nginx'); // available
    });
});

describe('sortPackagesBySize', () => {
    const packages: PackageDetails[] = [
        { id: '1', name: 'small', summary: 'Small package', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1024, group: 'other' },
        { id: '2', name: 'large', summary: 'Large package', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1048576, group: 'other' },
        { id: '3', name: 'medium', summary: 'Medium package', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 10240, group: 'other' },
    ];

    it('sorts packages by size in ascending order', () => {
        const result = sortPackagesBySize(packages);
        expect(result[0].name).toBe('small');
        expect(result[1].name).toBe('medium');
        expect(result[2].name).toBe('large');
    });

    it('sorts packages by size in descending order', () => {
        const result = sortPackagesBySize(packages, false);
        expect(result[0].name).toBe('large');
        expect(result[1].name).toBe('medium');
        expect(result[2].name).toBe('small');
    });
});

describe('groupPackagesByGroup', () => {
    const packages: PackageDetails[] = [
        { id: '1', name: 'nginx', summary: 'Web', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1024, group: 'network' },
        { id: '2', name: 'gcc', summary: 'Compiler', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1024, group: 'programming' },
        { id: '3', name: 'apache2', summary: 'Web', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1024, group: 'network' },
    ];

    it('groups packages by their group field', () => {
        const result = groupPackagesByGroup(packages);
        expect(result.has('network')).toBe(true);
        expect(result.has('programming')).toBe(true);
        expect(result.get('network')).toHaveLength(2);
        expect(result.get('programming')).toHaveLength(1);
    });

    it('handles packages without group', () => {
        const pkgsNoGroup: PackageDetails[] = [
            { id: '1', name: 'test', summary: 'Test', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1024, group: undefined as any },
        ];
        const result = groupPackagesByGroup(pkgsNoGroup);
        expect(result.has('unknown')).toBe(true);
    });
});

describe('countPackagesByGroup', () => {
    const packages: PackageDetails[] = [
        { id: '1', name: 'nginx', summary: 'Web', version: '1.0', arch: 'arm64', repo: 'debian', installed: true, description: '', size: 1024, group: 'network' },
        { id: '2', name: 'apache2', summary: 'Web', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1024, group: 'network' },
        { id: '3', name: 'gcc', summary: 'Compiler', version: '1.0', arch: 'arm64', repo: 'debian', installed: true, description: '', size: 1024, group: 'programming' },
    ];

    it('counts total packages in each group', () => {
        const result = countPackagesByGroup(packages);
        const network = result.get('network');
        const programming = result.get('programming');

        expect(network?.packageCount).toBe(2);
        expect(programming?.packageCount).toBe(1);
    });

    it('counts installed packages in each group', () => {
        const result = countPackagesByGroup(packages);
        const network = result.get('network');
        const programming = result.get('programming');

        expect(network?.installedCount).toBe(1);
        expect(programming?.installedCount).toBe(1);
    });

    it('initializes all known groups with zero counts', () => {
        const result = countPackagesByGroup([]);
        const adminTools = result.get('admin-tools');

        expect(adminTools).toBeDefined();
        expect(adminTools?.packageCount).toBe(0);
        expect(adminTools?.installedCount).toBe(0);
    });

    it('handles unknown groups', () => {
        const pkgsUnknownGroup: PackageDetails[] = [
            { id: '1', name: 'test', summary: 'Test', version: '1.0', arch: 'arm64', repo: 'debian', installed: false, description: '', size: 1024, group: 'unknown-group' },
        ];
        const result = countPackagesByGroup(pkgsUnknownGroup);
        const unknownGroup = result.get('unknown-group');

        expect(unknownGroup).toBeDefined();
        expect(unknownGroup?.packageCount).toBe(1);
    });
});
