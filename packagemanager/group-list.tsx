/*
 * GroupList component - Browse packages by PackageKit group
 */

import {
    Badge,
    Button,
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
import {
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from '@patternfly/react-table';
import React, { useEffect, useState, useRef } from 'react';

import { getGroupInfo, isGroupHidden, PACKAGEKIT_GROUPS } from './groups';
import * as PK from './packagekit';
import { GroupInfo, PackageDetails, ProgressData } from './types';
import { getErrorMessage } from './utils';

interface GroupListProps {
    onGroupSelect: (groupId: string) => void;
    onPackageSelect?: (packageId: string, groupId?: string) => void;
}

export const GroupList: React.FC<GroupListProps> = ({ onGroupSelect, onPackageSelect }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showHidden, setShowHidden] = useState(false);

    // Package search state
    const [searchResults, setSearchResults] = useState<PackageDetails[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [operatingOn, setOperatingOn] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);

    // Debounce timer
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        loadGroups();
    }, []);

    // Debounced package search effect
    useEffect(() => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const trimmedQuery = searchQuery.trim();

        // If search query is empty or too short, clear everything
        if (trimmedQuery.length === 0) {
            setSearchResults([]);
            setSearchError(null);
            setSearching(false);
            setManualSearchTriggered(false);
            return;
        }

        // Reset manual trigger if query becomes too short (< 2 chars)
        if (trimmedQuery.length < 2 && manualSearchTriggered) {
            setManualSearchTriggered(false);
        }

        // Determine if we should search
        const shouldAutoSearch = trimmedQuery.length >= 4;
        const shouldManualSearch = trimmedQuery.length >= 2 && manualSearchTriggered;

        // If query is too short and not manually triggered, clear results
        if (!shouldAutoSearch && !shouldManualSearch) {
            if (!manualSearchTriggered) {
                setSearchResults([]);
                setSearchError(null);
            }
            setSearching(false);
            return;
        }

        // Set searching state immediately (don't clear results - keep old ones visible)
        setSearching(true);
        setSearchError(null);

        // Debounce: wait 300ms after user stops typing
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                // First, search by name to get package IDs
                const basicResults = await PK.searchNames(trimmedQuery);

                // Then get full details including group information
                if (basicResults.length > 0) {
                    const packageIds = basicResults.map(pkg => pkg.id);
                    const detailedResults = await PK.getDetails(packageIds);
                    setSearchResults(detailedResults);
                } else {
                    setSearchResults([]);
                }

                setSearchError(null);
            } catch (err) {
                setSearchError(getErrorMessage(err));
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        // Cleanup function
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, manualSearchTriggered]);

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

    async function handleInstall(pkg: PackageDetails) {
        setOperatingOn(pkg.id);
        setProgress(0);
        setSearchError(null);

        try {
            await PK.installPackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData.percentage);
            });

            // Refresh search results with full details
            if (searchQuery.trim()) {
                const basicResults = await PK.searchNames(searchQuery.trim());
                if (basicResults.length > 0) {
                    const packageIds = basicResults.map(p => p.id);
                    const detailedResults = await PK.getDetails(packageIds);
                    setSearchResults(detailedResults);
                } else {
                    setSearchResults([]);
                }
            }
        } catch (err) {
            setSearchError(getErrorMessage(err));
        } finally {
            setOperatingOn(null);
            setProgress(0);
        }
    }

    async function handleRemove(pkg: PackageDetails) {
        setOperatingOn(pkg.id);
        setProgress(0);
        setSearchError(null);

        try {
            await PK.removePackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData.percentage);
            });

            // Refresh search results with full details
            if (searchQuery.trim()) {
                const basicResults = await PK.searchNames(searchQuery.trim());
                if (basicResults.length > 0) {
                    const packageIds = basicResults.map(p => p.id);
                    const detailedResults = await PK.getDetails(packageIds);
                    setSearchResults(detailedResults);
                } else {
                    setSearchResults([]);
                }
            }
        } catch (err) {
            setSearchError(getErrorMessage(err));
        } finally {
            setOperatingOn(null);
            setProgress(0);
        }
    }

    function handlePackageClick(pkg: PackageDetails) {
        if (onPackageSelect) {
            onPackageSelect(pkg.id, pkg.group);
        }
    }

    function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            const trimmedQuery = searchQuery.trim();
            if (trimmedQuery.length >= 2) {
                setManualSearchTriggered(true);
            }
        }
    }

    const filteredGroups = groups.filter(group => {
        // Filter hidden groups (don't filter by search query anymore)
        if (!showHidden && isGroupHidden(group.id)) {
            return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                <Spinner size="xl" aria-label="Loading package groups" />
                <p className="pf-v6-u-mt-md" aria-live="polite">Loading package groups...</p>
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

    // Determine if we're in search mode
    const trimmedQuery = searchQuery.trim();
    const hasResults = searchResults.length > 0;
    const isSearchMode = (trimmedQuery.length >= 4) || (trimmedQuery.length >= 2 && manualSearchTriggered);
    const isPartialSearch = trimmedQuery.length > 0 && !isSearchMode;

    return (
        <div className="group-list">
            <div className="pf-v6-u-mb-lg">
                <SearchInput
                    placeholder="Search packages..."
                    value={searchQuery}
                    onChange={(_, value) => setSearchQuery(value)}
                    onClear={() => setSearchQuery('')}
                    onKeyDown={handleSearchKeyDown}
                    aria-label="Search for packages"
                />
            </div>

            {/* Show search error if any */}
            {searchError && (
                <div className="pf-v6-c-alert pf-m-danger pf-v6-u-mb-md" role="alert" aria-live="assertive">
                    <div className="pf-v6-c-alert__icon">
                        <ExclamationCircleIcon />
                    </div>
                    <p className="pf-v6-c-alert__title">{searchError}</p>
                </div>
            )}

            {/* Partial search: show hint to type more characters */}
            {isPartialSearch ? (
                <EmptyState>
                    <Title headingLevel="h2" size="lg">Type more or press Enter</Title>
                    <EmptyStateBody>
                        Type at least 4 characters to search automatically, or press Enter to search with 2+ characters
                    </EmptyStateBody>
                </EmptyState>
            ) : isSearchMode ? (
                /* Search mode: show package search results */
                searching && !hasResults ? (
                    // First search - show big spinner
                    <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                        <Spinner size="lg" aria-label="Searching packages" />
                        <p className="pf-v6-u-mt-md" aria-live="polite">Searching packages...</p>
                    </div>
                ) : searchResults.length === 0 && !searching ? (
                    <EmptyState>
                        <Title headingLevel="h2" size="lg">No packages found</Title>
                        <EmptyStateBody>
                            No packages match "{searchQuery}"
                        </EmptyStateBody>
                    </EmptyState>
                ) : (
                    <div>
                        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Badge>{searchResults.length} packages found</Badge>
                            {searching && <Spinner size="md" aria-label="Updating search results" />}
                        </div>
                        <Table aria-label="Package search results" variant="compact">
                            <Thead>
                                <Tr>
                                    <Th width={20}>Name</Th>
                                    <Th width={35}>Summary</Th>
                                    <Th width={10}>Version</Th>
                                    <Th width={15}>Group</Th>
                                    <Th width={10} modifier="fitContent"></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {searchResults.map((pkg) => {
                                    const isOperating = operatingOn === pkg.id;
                                    const groupInfo = getGroupInfo(pkg.group || 'unknown');
                                    return (
                                        <Tr key={pkg.id}>
                                            <Td>
                                                <Button
                                                    variant="link"
                                                    isInline
                                                    onClick={() => handlePackageClick(pkg)}
                                                >
                                                    {pkg.name}
                                                </Button>
                                            </Td>
                                            <Td modifier="truncate">
                                                {pkg.summary}
                                            </Td>
                                            <Td modifier="truncate">
                                                {pkg.version}
                                            </Td>
                                            <Td>
                                                <Badge isRead>{groupInfo.name}</Badge>
                                            </Td>
                                            <Td modifier="fitContent">
                                                {isOperating ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Spinner size="sm" aria-label={`Processing ${pkg.name}`} /> {progress}%
                                                    </div>
                                                ) : pkg.installed ? (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleRemove(pkg)}
                                                        isDisabled={operatingOn !== null}
                                                        aria-label={`Remove ${pkg.name}`}
                                                    >
                                                        Remove
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleInstall(pkg)}
                                                        isDisabled={operatingOn !== null}
                                                        aria-label={`Install ${pkg.name}`}
                                                    >
                                                        Install
                                                    </Button>
                                                )}
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                    </div>
                )
            ) : (
                /* Group browsing mode: show group cards */
                filteredGroups.length === 0 ? (
                    <EmptyState>
                        <Title headingLevel="h2" size="lg">No groups found</Title>
                        <EmptyStateBody>
                            No package groups available
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
                )
            )}
        </div>
    );
};
