/*
 * PackageKit Group definitions
 * Maps PackageKit group enums to user-friendly names and descriptions
 */

import { PkEnum } from './types';

export interface PackageGroup {
    id: string;              // PackageKit group ID
    name: string;            // Display name
    description: string;     // Description
    icon?: string;          // Optional icon name
}

/**
 * PackageKit group mappings
 * Based on PkGroupEnum from packagekit-glib2/pk-enum.h
 */
export const PACKAGEKIT_GROUPS: Record<string, PackageGroup> = {
    'accessibility': {
        id: 'accessibility',
        name: 'Accessibility',
        description: 'Accessibility software and assistive technologies',
    },
    'accessories': {
        id: 'accessories',
        name: 'Accessories',
        description: 'Utility applications and tools',
    },
    'admin-tools': {
        id: 'admin-tools',
        name: 'Administration',
        description: 'System administration and configuration tools',
    },
    'communication': {
        id: 'communication',
        name: 'Communication',
        description: 'Communication and messaging applications',
    },
    'desktop-gnome': {
        id: 'desktop-gnome',
        name: 'GNOME Desktop',
        description: 'GNOME desktop environment components',
    },
    'desktop-kde': {
        id: 'desktop-kde',
        name: 'KDE Desktop',
        description: 'KDE desktop environment components',
    },
    'desktop-xfce': {
        id: 'desktop-xfce',
        name: 'XFCE Desktop',
        description: 'XFCE desktop environment components',
    },
    'desktop-other': {
        id: 'desktop-other',
        name: 'Other Desktops',
        description: 'Other desktop environment components',
    },
    'education': {
        id: 'education',
        name: 'Education',
        description: 'Educational software and learning tools',
    },
    'fonts': {
        id: 'fonts',
        name: 'Fonts',
        description: 'Font packages and typography tools',
    },
    'games': {
        id: 'games',
        name: 'Games',
        description: 'Games and entertainment software',
    },
    'graphics': {
        id: 'graphics',
        name: 'Graphics',
        description: 'Graphics editing and viewing applications',
    },
    'internet': {
        id: 'internet',
        name: 'Internet',
        description: 'Web browsers and internet applications',
    },
    'legacy': {
        id: 'legacy',
        name: 'Legacy',
        description: 'Legacy and deprecated packages',
    },
    'localization': {
        id: 'localization',
        name: 'Localization',
        description: 'Language packs and localization files',
    },
    'maps': {
        id: 'maps',
        name: 'Maps',
        description: 'Mapping and navigation software',
    },
    'multimedia': {
        id: 'multimedia',
        name: 'Multimedia',
        description: 'Audio and video players and editors',
    },
    'network': {
        id: 'network',
        name: 'Network',
        description: 'Network utilities and monitoring tools',
    },
    'office': {
        id: 'office',
        name: 'Office',
        description: 'Office productivity applications',
    },
    'other': {
        id: 'other',
        name: 'Other',
        description: 'Miscellaneous packages',
    },
    'power-management': {
        id: 'power-management',
        name: 'Power Management',
        description: 'Power management and battery tools',
    },
    'programming': {
        id: 'programming',
        name: 'Programming',
        description: 'Development tools and programming languages',
    },
    'publishing': {
        id: 'publishing',
        name: 'Publishing',
        description: 'Desktop publishing and document preparation',
    },
    'repos': {
        id: 'repos',
        name: 'Repositories',
        description: 'Package repository configurations',
    },
    'security': {
        id: 'security',
        name: 'Security',
        description: 'Security tools and cryptography software',
    },
    'servers': {
        id: 'servers',
        name: 'Servers',
        description: 'Server applications and daemons',
    },
    'system': {
        id: 'system',
        name: 'System',
        description: 'System utilities and core components',
    },
    'virtualization': {
        id: 'virtualization',
        name: 'Virtualization',
        description: 'Virtualization and containerization tools',
    },
    'science': {
        id: 'science',
        name: 'Science',
        description: 'Scientific and research software',
    },
    'documentation': {
        id: 'documentation',
        name: 'Documentation',
        description: 'Documentation and manual pages',
    },
    'electronics': {
        id: 'electronics',
        name: 'Electronics',
        description: 'Electronics and embedded development',
    },
    'collections': {
        id: 'collections',
        name: 'Collections',
        description: 'Package collections and meta-packages',
    },
    'vendor': {
        id: 'vendor',
        name: 'Vendor',
        description: 'Vendor-specific packages',
    },
    'newest': {
        id: 'newest',
        name: 'Recently Updated',
        description: 'Recently added or updated packages',
    },
    'unknown': {
        id: 'unknown',
        name: 'Uncategorized',
        description: 'Packages without a defined category',
    },
};

/**
 * Get group info by ID
 */
export function getGroupInfo(groupId: string): PackageGroup {
    return PACKAGEKIT_GROUPS[groupId] || PACKAGEKIT_GROUPS['unknown'];
}

/**
 * Get all groups as array
 */
export function getAllGroups(): PackageGroup[] {
    return Object.values(PACKAGEKIT_GROUPS);
}

/**
 * Priority groups to show first (server/admin focused)
 */
export const PRIORITY_GROUPS = [
    'admin-tools',
    'servers',
    'network',
    'system',
    'security',
    'programming',
    'virtualization',
];

/**
 * Groups to hide by default (desktop-focused)
 */
export const HIDDEN_GROUPS = [
    'desktop-gnome',
    'desktop-kde',
    'desktop-xfce',
    'desktop-other',
    'games',
    'education',
];

/**
 * Check if group should be hidden by default
 */
export function isGroupHidden(groupId: string): boolean {
    return HIDDEN_GROUPS.includes(groupId);
}

/**
 * Map PackageKit group enum number to group ID string
 * Based on PkGroupEnum from pk-enum.h
 */
export function mapGroupEnumToId(groupEnum: number): string {
    const groupMap: Record<number, string> = {
        [PkEnum.GROUP_UNKNOWN]: 'unknown',
        [PkEnum.GROUP_ACCESSIBILITY]: 'accessibility',
        [PkEnum.GROUP_ACCESSORIES]: 'accessories',
        [PkEnum.GROUP_ADMIN_TOOLS]: 'admin-tools',
        [PkEnum.GROUP_COMMUNICATION]: 'communication',
        [PkEnum.GROUP_DESKTOP_GNOME]: 'desktop-gnome',
        [PkEnum.GROUP_DESKTOP_KDE]: 'desktop-kde',
        [PkEnum.GROUP_DESKTOP_XFCE]: 'desktop-xfce',
        [PkEnum.GROUP_DESKTOP_OTHER]: 'desktop-other',
        [PkEnum.GROUP_EDUCATION]: 'education',
        [PkEnum.GROUP_FONTS]: 'fonts',
        [PkEnum.GROUP_GAMES]: 'games',
        [PkEnum.GROUP_GRAPHICS]: 'graphics',
        [PkEnum.GROUP_INTERNET]: 'internet',
        [PkEnum.GROUP_LEGACY]: 'legacy',
        [PkEnum.GROUP_LOCALIZATION]: 'localization',
        [PkEnum.GROUP_MAPS]: 'maps',
        [PkEnum.GROUP_MULTIMEDIA]: 'multimedia',
        [PkEnum.GROUP_NETWORK]: 'network',
        [PkEnum.GROUP_OFFICE]: 'office',
        [PkEnum.GROUP_OTHER]: 'other',
        [PkEnum.GROUP_POWER_MANAGEMENT]: 'power-management',
        [PkEnum.GROUP_PROGRAMMING]: 'programming',
        [PkEnum.GROUP_PUBLISHING]: 'publishing',
        [PkEnum.GROUP_REPOS]: 'repos',
        [PkEnum.GROUP_SECURITY]: 'security',
        [PkEnum.GROUP_SERVERS]: 'servers',
        [PkEnum.GROUP_SYSTEM]: 'system',
        [PkEnum.GROUP_VIRTUALIZATION]: 'virtualization',
        [PkEnum.GROUP_SCIENCE]: 'science',
        [PkEnum.GROUP_DOCUMENTATION]: 'documentation',
        [PkEnum.GROUP_ELECTRONICS]: 'electronics',
        [PkEnum.GROUP_COLLECTIONS]: 'collections',
        [PkEnum.GROUP_VENDOR]: 'vendor',
        [PkEnum.GROUP_NEWEST]: 'newest',
    };

    return groupMap[groupEnum] || 'unknown';
}

/**
 * Map group ID string to PackageKit group enum number
 * Reverse of mapGroupEnumToId()
 */
export function mapGroupIdToEnum(groupId: string): number {
    const idToEnumMap: Record<string, number> = {
        'unknown': PkEnum.GROUP_UNKNOWN,
        'accessibility': PkEnum.GROUP_ACCESSIBILITY,
        'accessories': PkEnum.GROUP_ACCESSORIES,
        'admin-tools': PkEnum.GROUP_ADMIN_TOOLS,
        'communication': PkEnum.GROUP_COMMUNICATION,
        'desktop-gnome': PkEnum.GROUP_DESKTOP_GNOME,
        'desktop-kde': PkEnum.GROUP_DESKTOP_KDE,
        'desktop-xfce': PkEnum.GROUP_DESKTOP_XFCE,
        'desktop-other': PkEnum.GROUP_DESKTOP_OTHER,
        'education': PkEnum.GROUP_EDUCATION,
        'fonts': PkEnum.GROUP_FONTS,
        'games': PkEnum.GROUP_GAMES,
        'graphics': PkEnum.GROUP_GRAPHICS,
        'internet': PkEnum.GROUP_INTERNET,
        'legacy': PkEnum.GROUP_LEGACY,
        'localization': PkEnum.GROUP_LOCALIZATION,
        'maps': PkEnum.GROUP_MAPS,
        'multimedia': PkEnum.GROUP_MULTIMEDIA,
        'network': PkEnum.GROUP_NETWORK,
        'office': PkEnum.GROUP_OFFICE,
        'other': PkEnum.GROUP_OTHER,
        'power-management': PkEnum.GROUP_POWER_MANAGEMENT,
        'programming': PkEnum.GROUP_PROGRAMMING,
        'publishing': PkEnum.GROUP_PUBLISHING,
        'repos': PkEnum.GROUP_REPOS,
        'security': PkEnum.GROUP_SECURITY,
        'servers': PkEnum.GROUP_SERVERS,
        'system': PkEnum.GROUP_SYSTEM,
        'virtualization': PkEnum.GROUP_VIRTUALIZATION,
        'science': PkEnum.GROUP_SCIENCE,
        'documentation': PkEnum.GROUP_DOCUMENTATION,
        'electronics': PkEnum.GROUP_ELECTRONICS,
        'collections': PkEnum.GROUP_COLLECTIONS,
        'vendor': PkEnum.GROUP_VENDOR,
        'newest': PkEnum.GROUP_NEWEST,
    };

    return idToEnumMap[groupId] || PkEnum.GROUP_UNKNOWN;
}

/**
 * Sort groups by priority
 * Accepts any group-like object with id and name
 */
export function sortGroupsByPriority<T extends { id: string; name: string }>(groups: T[]): T[] {
    return groups.sort((a, b) => {
        const aPriority = PRIORITY_GROUPS.indexOf(a.id);
        const bPriority = PRIORITY_GROUPS.indexOf(b.id);

        // Priority groups come first
        if (aPriority !== -1 && bPriority === -1) return -1;
        if (aPriority === -1 && bPriority !== -1) return 1;
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;

        // Then alphabetically
        return a.name.localeCompare(b.name);
    });
}
