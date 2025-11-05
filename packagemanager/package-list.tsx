/*
 * PackageList component - Display packages in a group
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
    ProgressVariant,
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
import React, { useEffect, useState } from 'react';

import { getGroupInfo } from './groups';
import * as PK from './packagekit';
import { usePackageCache } from './packagemanager';
import { PackageDetails, ProgressData } from './types';
import { filterPackages, getErrorMessage, sortPackagesByName } from './utils';

interface PackageListProps {
    groupId: string;
    onBack: () => void;
    onPackageSelect: (packageId: string) => void;
}

export const PackageList: React.FC<PackageListProps> = ({ groupId, onBack, onPackageSelect }) => {
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [packages, setPackages] = useState<PackageDetails[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [operatingOn, setOperatingOn] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);

    const groupInfo = getGroupInfo(groupId);
    const { cache: packageCache, setCache } = usePackageCache();

    useEffect(() => {
        loadPackages();
    }, [groupId]);

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

    async function loadPackages() {
        setLoading(true);
        setLoadingProgress(0);
        setError(null);

        try {
            // Check cache first
            if (packageCache.has(groupId)) {
                const cached = packageCache.get(groupId)!;
                const sorted = sortPackagesByName(cached);
                setPackages(sorted);
                setLoading(false);
                return;
            }

            // Use SearchGroups to query only packages in this group
            // This returns basic info (name, version, summary, installed) - enough for the list!
            setLoadingProgress(50);
            const groupPackages = await PK.searchGroups([groupId], undefined, (progressData) => {
                const searchProgress = 50 + (progressData.percentage * 0.5); // 50% to 100%
                setLoadingProgress(Math.min(searchProgress, 100));
            });

            // Cast to PackageDetails (detail fields are optional and loaded on-demand)
            const packagesWithGroup: PackageDetails[] = groupPackages.map(pkg => ({
                ...pkg,
                group: groupId, // We know the group from context
            }));

            // Sort by name
            const sorted = sortPackagesByName(packagesWithGroup);

            // Cache for next time
            setCache(groupId, sorted);

            setPackages(sorted);
            setLoadingProgress(100);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleInstall(pkg: PackageDetails) {
        setOperatingOn(pkg.id);
        setProgress(0);

        try {
            await PK.installPackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData.percentage);
            });

            // Reload to update status
            await loadPackages();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setOperatingOn(null);
            setProgress(0);
        }
    }

    async function handleRemove(pkg: PackageDetails) {
        setOperatingOn(pkg.id);
        setProgress(0);

        try {
            await PK.removePackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData.percentage);
            });

            // Reload to update status
            await loadPackages();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setOperatingOn(null);
            setProgress(0);
        }
    }

    const filteredPackages = filterPackages(packages, searchQuery);

    if (loading) {
        return (
            <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                <Spinner size="xl" aria-label={`Loading packages for ${groupInfo.name}`} />
                <p className="pf-v6-u-mt-md" aria-live="polite">Loading packages for {groupInfo.name}...</p>
                {loadingProgress > 0 && (
                    <div style={{ maxWidth: '400px', margin: '1rem auto' }}>
                        <Progress
                            value={loadingProgress}
                            title="Loading package details"
                            variant={ProgressVariant.success}
                            aria-label={`Loading progress: ${loadingProgress}%`}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="package-list">
            <Flex className="package-list-header" direction={{ default: 'column' }} >
                <Breadcrumb className="pf-v6-u-mb-md">
                    <BreadcrumbItem to="#/">
                        Groups
                    </BreadcrumbItem>
                    <BreadcrumbItem isActive>{groupInfo.name}</BreadcrumbItem>
                </Breadcrumb>
                {error && (
                    <div className="pf-v6-c-alert pf-m-danger pf-v6-u-mb-md" role="alert" aria-live="assertive">
                        <div className="pf-v6-c-alert__icon">
                            <ExclamationCircleIcon />
                        </div>
                        <p className="pf-v6-c-alert__title">{error}</p>
                    </div>
                )}
                <Flex>
                    <Flex flex={{ default: 'flex_1' }} >
                    <FlexItem>
                        <Title headingLevel="h1" size="2xl" className="pf-v6-u-mb-sm">{groupInfo.name}</Title>
                        <p>{groupInfo.description}</p>
                    </FlexItem>
                    </Flex>
                    <Flex>
                        <FlexItem>
                            <SearchInput
                                placeholder="Search packages..."
                                value={searchQuery}
                                onChange={(_, value) => setSearchQuery(value)}
                                onClear={() => setSearchQuery('')}
                                aria-label={`Search packages in ${groupInfo.name}`}
                            />
                        </FlexItem>
                    </Flex>
                </Flex>
            </Flex>

            <Flex className="package-list-content" direction={{ default: 'column' }} flex={{ default: 'flex_1' }}>
                <FlexItem>
                    {filteredPackages.length === 0 ? (
                        <EmptyState>
                            <Title headingLevel="h2" size="lg">No packages found</Title>
                            <EmptyStateBody>
                                {searchQuery
                                    ? `No packages match "${searchQuery}"`
                                    : `No packages in ${groupInfo.name}`}
                            </EmptyStateBody>
                        </EmptyState>
                    ) : (
                        <div>
                            {/* Package count badge */}
                            <div style={{ marginBottom: '0.5rem' }}>
                                <Badge>{filteredPackages.length} packages</Badge>
                            </div>
                            {/* PatternFly Table */}
                            <Table aria-label="Package list" variant="compact">
                                <Thead>
                                    <Tr>
                                        <Th width={25}>Name</Th>
                                        <Th width={40}>Summary</Th>
                                        <Th width={10}>Version</Th>
                                        <Th width={10} modifier="fitContent"></Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {filteredPackages.map((pkg, index) => {
                                        const isOperating = operatingOn === pkg.id;
                                        return (
                                            <Tr key={pkg.id}>
                                                <Td>
                                                    <Button
                                                        variant="link"
                                                        isInline
                                                        onClick={() => onPackageSelect(pkg.id)}
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
                    )}
                </FlexItem>
            </Flex>
        </div>
    );
};
