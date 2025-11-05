/*
 * GroupList component - Browse packages by PackageKit group
 */

import {
    Card,
    CardBody,
    CardHeader,
    CardTitle,
    EmptyState,
    EmptyStateBody,
    SearchInput,
    Spinner,
    Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React, { useEffect, useState } from 'react';

import { isGroupHidden, PACKAGEKIT_GROUPS } from './groups';
import * as PK from './packagekit';
import { GroupInfo } from './types';

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

            // Initialize all known groups
            const initialGroups: GroupInfo[] = Object.keys(PACKAGEKIT_GROUPS).map(groupId => ({
                id: groupId,
                name: PACKAGEKIT_GROUPS[groupId].name,
                description: PACKAGEKIT_GROUPS[groupId].description,
                packageCount: 0,
                installedCount: 0,
            }));

            // Sort alphabetically by name
            const sorted = initialGroups.sort((a, b) => a.name.localeCompare(b.name));
            setGroups(sorted);
        } catch (err) {
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
            <div className="pf-v6-u-mb-lg">
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
                <div className="group-gallery-vertical">
                    {filteredGroups.map(group => (
                        <Card
                            key={group.id}
                            isClickable
                            variant="secondary"
                            className="group-card"
                        >
                            <CardHeader
                                selectableActions={{
                                    onClickAction: () => onGroupSelect(group.id),
                                    selectableActionAriaLabelledby: `group-card-title-${group.id}`
                                }}
                            >
                                <CardTitle id={`group-card-title-${group.id}`}><strong>{group.name}</strong></CardTitle>
                            </CardHeader>
                            <CardBody>{group.description}</CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
