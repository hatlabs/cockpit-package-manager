/*
 * GroupList component - Browse packages by PackageKit group
 */

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardTitle,
    Gallery,
    SearchInput,
    Spinner,
    EmptyState,
    EmptyStateBody,
    Badge,
    Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import * as PK from './packagekit';
import { GroupInfo, PackageDetails } from './types';
import { countPackagesByGroup } from './utils';
import { getAllGroups, sortGroupsByPriority, isGroupHidden } from './groups';

interface GroupListProps {
    onGroupSelect: (groupId: string) => void;
}

export const GroupList: React.FC<GroupListProps> = ({ onGroupSelect }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showHidden, setShowHidden] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    async function loadGroups() {
        setLoading(true);
        setError(null);

        try {
            // Detect PackageKit availability
            const available = await PK.detect();
            if (!available) {
                throw new Error('PackageKit is not available on this system');
            }

            // Get all packages with details to determine groups
            const packages = await PK.getPackages();

            // We need details to get group info
            const packageIds = packages.map(p => p.id);
            const details = await PK.getDetails(packageIds);

            // Count packages by group
            const groupCounts = countPackagesByGroup(details);

            // Convert to array and filter out empty groups
            const groupArray = Array.from(groupCounts.values())
                .filter(g => g.packageCount > 0);

            // Sort by priority
            const sorted = sortGroupsByPriority(groupArray);

            setGroups(sorted);
        } catch (err) {
            console.error('Failed to load groups:', err);
            setError(err instanceof Error ? err.message : 'Failed to load package groups');
        } finally {
            setLoading(false);
        }
    }

    const filteredGroups = groups.filter(group => {
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!group.name.toLowerCase().includes(query) &&
                !group.description.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Filter hidden groups
        if (!showHidden && isGroupHidden(group.id)) {
            return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                <Spinner size="xl" />
                <p className="pf-v6-u-mt-md">Loading package groups...</p>
            </div>
        );
    }

    if (error) {
        return (
            <EmptyState>
                <ExclamationCircleIcon />
                <Title headingLevel="h1" size="lg">Error loading groups</Title>
                <EmptyStateBody>{error}</EmptyStateBody>
            </EmptyState>
        );
    }

    return (
        <div className="group-list">
            <div className="pf-v6-u-mb-md">
                <SearchInput
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(_, value) => setSearchQuery(value)}
                    onClear={() => setSearchQuery('')}
                />
            </div>

            {filteredGroups.length === 0 ? (
                <EmptyState>
                    <Title headingLevel="h2" size="lg">No groups found</Title>
                    <EmptyStateBody>
                        {searchQuery
                            ? `No groups match "${searchQuery}"`
                            : 'No package groups available'}
                    </EmptyStateBody>
                </EmptyState>
            ) : (
                <Gallery hasGutter minWidths={{ default: '250px' }}>
                    {filteredGroups.map(group => (
                        <Card
                            key={group.id}
                            isClickable
                            isSelectable
                            onClick={() => onGroupSelect(group.id)}
                            className="group-card"
                        >
                            <CardTitle>{group.name}</CardTitle>
                            <CardBody>
                                <p className="pf-v6-u-mb-sm">{group.description}</p>
                                <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between">
                                    <Badge isRead>
                                        {group.packageCount} {group.packageCount === 1 ? 'package' : 'packages'}
                                    </Badge>
                                    {group.installedCount > 0 && (
                                        <Badge>
                                            {group.installedCount} installed
                                        </Badge>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </Gallery>
            )}
        </div>
    );
};
