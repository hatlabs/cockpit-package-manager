import { describe, it, expect } from 'vitest';
import {
    PACKAGEKIT_GROUPS,
    PRIORITY_GROUPS,
    HIDDEN_GROUPS,
    getGroupInfo,
    getAllGroups,
    isGroupHidden,
    sortGroupsByPriority,
} from './groups';
import { GroupInfo } from './types';

describe('PACKAGEKIT_GROUPS', () => {
    it('contains all expected group definitions', () => {
        expect(PACKAGEKIT_GROUPS).toBeDefined();
        expect(Object.keys(PACKAGEKIT_GROUPS).length).toBeGreaterThan(0);
    });

    it('has admin-tools group', () => {
        expect(PACKAGEKIT_GROUPS['admin-tools']).toBeDefined();
        expect(PACKAGEKIT_GROUPS['admin-tools'].name).toBe('Administration');
    });

    it('has servers group', () => {
        expect(PACKAGEKIT_GROUPS['servers']).toBeDefined();
        expect(PACKAGEKIT_GROUPS['servers'].name).toBe('Servers');
    });

    it('has network group', () => {
        expect(PACKAGEKIT_GROUPS['network']).toBeDefined();
        expect(PACKAGEKIT_GROUPS['network'].name).toBe('Network');
    });

    it('has programming group', () => {
        expect(PACKAGEKIT_GROUPS['programming']).toBeDefined();
        expect(PACKAGEKIT_GROUPS['programming'].name).toBe('Programming');
    });

    it('has unknown group as fallback', () => {
        expect(PACKAGEKIT_GROUPS['unknown']).toBeDefined();
        expect(PACKAGEKIT_GROUPS['unknown'].name).toBe('Uncategorized');
    });

    it('all groups have required fields', () => {
        Object.values(PACKAGEKIT_GROUPS).forEach(group => {
            expect(group.id).toBeDefined();
            expect(group.name).toBeDefined();
            expect(group.description).toBeDefined();
            expect(typeof group.id).toBe('string');
            expect(typeof group.name).toBe('string');
            expect(typeof group.description).toBe('string');
        });
    });
});

describe('PRIORITY_GROUPS', () => {
    it('is an array of group IDs', () => {
        expect(Array.isArray(PRIORITY_GROUPS)).toBe(true);
        expect(PRIORITY_GROUPS.length).toBeGreaterThan(0);
    });

    it('contains admin-tools as priority group', () => {
        expect(PRIORITY_GROUPS).toContain('admin-tools');
    });

    it('contains servers as priority group', () => {
        expect(PRIORITY_GROUPS).toContain('servers');
    });

    it('contains network as priority group', () => {
        expect(PRIORITY_GROUPS).toContain('network');
    });

    it('all priority groups exist in PACKAGEKIT_GROUPS', () => {
        PRIORITY_GROUPS.forEach(groupId => {
            expect(PACKAGEKIT_GROUPS[groupId]).toBeDefined();
        });
    });
});

describe('HIDDEN_GROUPS', () => {
    it('is an array of group IDs', () => {
        expect(Array.isArray(HIDDEN_GROUPS)).toBe(true);
    });

    it('contains desktop-related groups', () => {
        expect(HIDDEN_GROUPS).toContain('desktop-gnome');
        expect(HIDDEN_GROUPS).toContain('desktop-kde');
        expect(HIDDEN_GROUPS).toContain('desktop-xfce');
    });

    it('contains games group', () => {
        expect(HIDDEN_GROUPS).toContain('games');
    });

    it('all hidden groups exist in PACKAGEKIT_GROUPS', () => {
        HIDDEN_GROUPS.forEach(groupId => {
            expect(PACKAGEKIT_GROUPS[groupId]).toBeDefined();
        });
    });
});

describe('getGroupInfo', () => {
    it('returns group info for known group', () => {
        const group = getGroupInfo('admin-tools');
        expect(group.id).toBe('admin-tools');
        expect(group.name).toBe('Administration');
        expect(group.description).toBeDefined();
    });

    it('returns group info for servers', () => {
        const group = getGroupInfo('servers');
        expect(group.id).toBe('servers');
        expect(group.name).toBe('Servers');
    });

    it('returns unknown group for non-existent group', () => {
        const group = getGroupInfo('nonexistent-group');
        expect(group.id).toBe('unknown');
        expect(group.name).toBe('Uncategorized');
    });

    it('handles empty string', () => {
        const group = getGroupInfo('');
        expect(group.id).toBe('unknown');
    });
});

describe('getAllGroups', () => {
    it('returns an array', () => {
        const groups = getAllGroups();
        expect(Array.isArray(groups)).toBe(true);
    });

    it('returns all groups', () => {
        const groups = getAllGroups();
        expect(groups.length).toBe(Object.keys(PACKAGEKIT_GROUPS).length);
    });

    it('each group has required properties', () => {
        const groups = getAllGroups();
        groups.forEach(group => {
            expect(group.id).toBeDefined();
            expect(group.name).toBeDefined();
            expect(group.description).toBeDefined();
        });
    });

    it('contains admin-tools group', () => {
        const groups = getAllGroups();
        const adminTools = groups.find(g => g.id === 'admin-tools');
        expect(adminTools).toBeDefined();
        expect(adminTools?.name).toBe('Administration');
    });
});

describe('isGroupHidden', () => {
    it('returns true for desktop-gnome', () => {
        expect(isGroupHidden('desktop-gnome')).toBe(true);
    });

    it('returns true for desktop-kde', () => {
        expect(isGroupHidden('desktop-kde')).toBe(true);
    });

    it('returns true for games', () => {
        expect(isGroupHidden('games')).toBe(true);
    });

    it('returns false for admin-tools', () => {
        expect(isGroupHidden('admin-tools')).toBe(false);
    });

    it('returns false for servers', () => {
        expect(isGroupHidden('servers')).toBe(false);
    });

    it('returns false for network', () => {
        expect(isGroupHidden('network')).toBe(false);
    });

    it('returns false for unknown groups', () => {
        expect(isGroupHidden('nonexistent-group')).toBe(false);
    });
});

describe('sortGroupsByPriority', () => {
    it('sorts priority groups before non-priority groups', () => {
        const groups: GroupInfo[] = [
            { id: 'games', name: 'Games', description: '', packageCount: 5, installedCount: 0 },
            { id: 'admin-tools', name: 'Administration', description: '', packageCount: 10, installedCount: 2 },
            { id: 'accessories', name: 'Accessories', description: '', packageCount: 3, installedCount: 1 },
            { id: 'servers', name: 'Servers', description: '', packageCount: 8, installedCount: 4 },
        ];

        const sorted = sortGroupsByPriority(groups);

        // admin-tools and servers should come before games and accessories
        const adminIndex = sorted.findIndex(g => g.id === 'admin-tools');
        const serversIndex = sorted.findIndex(g => g.id === 'servers');
        const gamesIndex = sorted.findIndex(g => g.id === 'games');
        const accessoriesIndex = sorted.findIndex(g => g.id === 'accessories');

        expect(adminIndex).toBeLessThan(gamesIndex);
        expect(adminIndex).toBeLessThan(accessoriesIndex);
        expect(serversIndex).toBeLessThan(gamesIndex);
        expect(serversIndex).toBeLessThan(accessoriesIndex);
    });

    it('maintains priority order within priority groups', () => {
        const groups: GroupInfo[] = [
            { id: 'network', name: 'Network', description: '', packageCount: 5, installedCount: 0 },
            { id: 'admin-tools', name: 'Administration', description: '', packageCount: 10, installedCount: 2 },
            { id: 'servers', name: 'Servers', description: '', packageCount: 8, installedCount: 4 },
        ];

        const sorted = sortGroupsByPriority(groups);

        // admin-tools should come before servers, which should come before network
        // (based on PRIORITY_GROUPS order)
        expect(sorted[0].id).toBe('admin-tools');
        expect(sorted[1].id).toBe('servers');
        expect(sorted[2].id).toBe('network');
    });

    it('sorts non-priority groups alphabetically', () => {
        const groups: GroupInfo[] = [
            { id: 'multimedia', name: 'Multimedia', description: '', packageCount: 5, installedCount: 0 },
            { id: 'games', name: 'Games', description: '', packageCount: 10, installedCount: 2 },
            { id: 'accessories', name: 'Accessories', description: '', packageCount: 8, installedCount: 4 },
        ];

        const sorted = sortGroupsByPriority(groups);

        // All are non-priority, so should be alphabetical by name
        expect(sorted[0].name).toBe('Accessories');
        expect(sorted[1].name).toBe('Games');
        expect(sorted[2].name).toBe('Multimedia');
    });

    it('handles empty array', () => {
        const sorted = sortGroupsByPriority([]);
        expect(sorted).toEqual([]);
    });

    it('handles single group', () => {
        const groups: GroupInfo[] = [
            { id: 'admin-tools', name: 'Administration', description: '', packageCount: 10, installedCount: 2 },
        ];

        const sorted = sortGroupsByPriority(groups);
        expect(sorted).toEqual(groups);
    });

    it('preserves all groups', () => {
        const groups: GroupInfo[] = [
            { id: 'games', name: 'Games', description: '', packageCount: 5, installedCount: 0 },
            { id: 'admin-tools', name: 'Administration', description: '', packageCount: 10, installedCount: 2 },
            { id: 'servers', name: 'Servers', description: '', packageCount: 8, installedCount: 4 },
        ];

        const sorted = sortGroupsByPriority(groups);
        expect(sorted.length).toBe(groups.length);
        expect(sorted.map(g => g.id).sort()).toEqual(groups.map(g => g.id).sort());
    });
});
