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

    // PackageKit group enums (PkGroupEnum from pk-enum.h)
    GROUP_UNKNOWN: 0,
    GROUP_ACCESSIBILITY: 1,
    GROUP_ACCESSORIES: 2,
    GROUP_ADMIN_TOOLS: 3,
    GROUP_COMMUNICATION: 4,
    GROUP_DESKTOP_GNOME: 5,
    GROUP_DESKTOP_KDE: 6,
    GROUP_DESKTOP_XFCE: 7,
    GROUP_DESKTOP_OTHER: 8,
    GROUP_EDUCATION: 9,
    GROUP_FONTS: 10,
    GROUP_GAMES: 11,
    GROUP_GRAPHICS: 12,
    GROUP_INTERNET: 13,
    GROUP_LEGACY: 14,
    GROUP_LOCALIZATION: 15,
    GROUP_MAPS: 16,
    GROUP_MULTIMEDIA: 17,
    GROUP_NETWORK: 18,
    GROUP_OFFICE: 19,
    GROUP_OTHER: 20,
    GROUP_POWER_MANAGEMENT: 21,
    GROUP_PROGRAMMING: 22,
    GROUP_PUBLISHING: 23,
    GROUP_REPOS: 24,
    GROUP_SECURITY: 25,
    GROUP_SERVERS: 26,
    GROUP_SYSTEM: 27,
    GROUP_VIRTUALIZATION: 28,
    GROUP_SCIENCE: 29,
    GROUP_DOCUMENTATION: 30,
    GROUP_ELECTRONICS: 31,
    GROUP_COLLECTIONS: 32,
    GROUP_VENDOR: 33,
    GROUP_NEWEST: 34,
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
// Note: description, size, group are optional because they're only fetched on-demand
// SearchGroups provides the base PackageInfo, full details loaded when needed
export interface PackageDetails extends PackageInfo {
    description?: string;    // Full description (from GetDetails)
    size?: number;           // Package size in bytes (from GetDetails)
    license?: string;        // Package license (from GetDetails)
    group?: string;          // PackageKit group (from GetDetails or context)
    url?: string;            // Homepage URL (from GetDetails)
}

// PackageKit group information with counts
export interface GroupInfo {
    id: string;              // Group ID (e.g., "network", "admin-tools")
    name: string;            // Display name
    description: string;     // Group description
    packageCount: number;    // Number of packages in group (-1 = loading)
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
    | { view: 'groups' }
    | { view: 'packages'; group: string }
    | { view: 'details'; packageId: string }
    | { view: 'search'; query: string };

// Filter options for package lists
export interface PackageFilter {
    installed?: boolean;     // Show only installed/not installed
    group?: string;          // Filter by PackageKit group
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
        spawn: (args: string[], options?: any) => Promise<string>;
    };
}

export {};
