/*
 * TypeScript type definitions for Cockpit Package Manager
 */

// PackageKit enums (from pk-enum.h)
export const PkEnum = {
    EXIT_SUCCESS: 1,
    EXIT_FAILED: 2,
    EXIT_CANCELLED: 3,

    INFO_UNKNOWN: -1,
    INFO_INSTALLED: 1,
    INFO_AVAILABLE: 2,
    INFO_LOW: 3,
    INFO_ENHANCEMENT: 4,
    INFO_NORMAL: 5,
    INFO_BUGFIX: 6,
    INFO_IMPORTANT: 7,
    INFO_SECURITY: 8,
    INFO_DOWNLOADING: 10,
    INFO_UPDATING: 11,
    INFO_INSTALLING: 12,
    INFO_REMOVING: 13,
    INFO_REINSTALLING: 19,
    INFO_DOWNGRADING: 20,

    STATUS_WAIT: 1,
    STATUS_DOWNLOAD: 8,
    STATUS_INSTALL: 9,
    STATUS_UPDATE: 10,
    STATUS_CLEANUP: 11,
    STATUS_SIGCHECK: 14,
    STATUS_WAITING_FOR_LOCK: 30,

    FILTER_INSTALLED: (1 << 2),
    FILTER_NOT_INSTALLED: (1 << 3),
    FILTER_NEWEST: (1 << 16),
    FILTER_ARCH: (1 << 18),
    FILTER_NOT_SOURCE: (1 << 21),

    ERROR_ALREADY_INSTALLED: 9,
    TRANSACTION_FLAG_SIMULATE: (1 << 2),
} as const;

// Package information
export interface PackageInfo {
    id: string;              // Full package ID (name;version;arch;repo)
    name: string;            // Package name
    version: string;         // Package version
    arch: string;            // Architecture
    repo: string;            // Repository
    summary: string;         // Short description
    section?: string;        // Debian section
    installed: boolean;      // Installation status
}

// Detailed package information
export interface PackageDetails extends PackageInfo {
    description: string;     // Full description
    size: number;            // Package size in bytes
    license?: string;        // Package license
    group?: string;          // Package group
    url?: string;            // Homepage URL
}

// Debian section information
export interface DebianSection {
    name: string;            // Section name (e.g., "net", "admin")
    displayName: string;     // Human-readable name
    description: string;     // Section description
    packageCount: number;    // Number of packages in section
    installedCount: number;  // Number of installed packages
}

// Package dependency information
export interface PackageDependency {
    name: string;
    version?: string;
    relation?: string;       // >=, <=, =, etc.
}

// Progress data for operations
export interface ProgressData {
    waiting: boolean;        // Waiting for lock
    percentage: number;      // 0-100
    cancel: (() => void) | null;  // Cancel function or null
    absolute_percentage?: number;
    info?: number;           // PkEnum.INFO_*
    package?: string;        // Current package name
    status?: number;         // PkEnum.STATUS_*
}

// PackageKit transaction error
export class TransactionError extends Error {
    code: string | number;
    detail: string;

    constructor(code: string | number, detail: string) {
        super(detail);
        this.code = code;
        this.detail = detail;
        this.name = 'TransactionError';
    }
}

// View state for navigation
export type ViewState =
    | { view: 'sections' }
    | { view: 'packages'; section: string }
    | { view: 'details'; packageId: string }
    | { view: 'search'; query: string };

// Filter options for package lists
export interface PackageFilter {
    installed?: boolean;     // Show only installed/not installed
    section?: string;        // Filter by section
    searchQuery?: string;    // Search query
}

// Sort options for package lists
export type SortOption = 'name' | 'status' | 'size';
export type SortDirection = 'asc' | 'desc';

// Operation result
export interface OperationResult {
    success: boolean;
    message?: string;
    error?: TransactionError;
}

// Cockpit types (minimal definitions for what we need)
declare global {
    const cockpit: {
        gettext: (text: string) => string;
        dbus: (service: string | null, options?: any) => any;
        location: any;
        file: (path: string) => any;
    };
}

export {};
