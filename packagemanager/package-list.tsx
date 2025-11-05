/*
 * PackageList component - Display packages in a group
 */

import React, { useState, useEffect, useRef } from 'react';
import { List, ListImperativeAPI } from 'react-window';
import {
    Button,
    SearchInput,
    Spinner,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    EmptyState,
    EmptyStateBody,
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Title,
    Progress,
    ProgressVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import * as PK from './packagekit';
import { PackageDetails, ProgressData } from './types';
import { filterPackages, sortPackagesByName, getStatusLabel, getStatusVariant, getErrorMessage } from './utils';
import { getGroupInfo } from './groups';
import { usePackageCache } from './packagemanager';

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
    const listRef = useRef<ListImperativeAPI>(null);

    const groupInfo = getGroupInfo(groupId);
    const { cache: packageCache, setCache } = usePackageCache();

    useEffect(() => {
        loadPackages();
    }, [groupId]);

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

    // Define row props type (only the custom props)
    type RowPropsType = {
        packages: PackageDetails[];
        operatingPackage: string | null;
        packageProgress: number;
    };

    // Row renderer for virtual list (receives index, style, ariaAttributes from List + our custom props)
    const Row = (props: {
        index: number;
        style: React.CSSProperties;
        ariaAttributes: { "aria-posinset": number; "aria-setsize": number; role: "listitem" };
    } & RowPropsType) => {
        const { index, ariaAttributes, packages, operatingPackage, packageProgress } = props;
        const pkg = packages[index];
        const isOperating = operatingPackage === pkg.id;

        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 3fr 1fr 1.5fr',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
                    alignItems: 'center',
                    backgroundColor: index % 2 === 0 ? 'var(--pf-v6-global--BackgroundColor--100)' : 'transparent',
                    height: '50px',
                }}
                {...props.ariaAttributes}
            >
                <div>
                    <Button
                        variant="link"
                        isInline
                        onClick={() => onPackageSelect(pkg.id)}
                        style={{ padding: 0, fontSize: 'inherit' }}
                    >
                        {pkg.name}
                    </Button>
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pkg.summary}
                </div>
                <div>{pkg.version}</div>
                <div>
                    {isOperating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Spinner size="sm" /> {packageProgress}%
                        </div>
                    ) : pkg.installed ? (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemove(pkg)}
                            isDisabled={operatingOn !== null}
                        >
                            Remove
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleInstall(pkg)}
                            isDisabled={operatingOn !== null}
                        >
                            Install
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                <Spinner size="xl" />
                <p className="pf-v6-u-mt-md">Loading packages for {groupInfo.name}...</p>
                {loadingProgress > 0 && (
                    <div style={{ maxWidth: '400px', margin: '1rem auto' }}>
                        <Progress
                            value={loadingProgress}
                            title="Loading package details"
                            variant={ProgressVariant.success}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="package-list">
            <Breadcrumb className="pf-v6-u-mb-md">
                <BreadcrumbItem to="#/">
                    Groups
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{groupInfo.name}</BreadcrumbItem>
            </Breadcrumb>

            <h1>{groupInfo.name}</h1>
            <p className="pf-v6-u-mb-md">{groupInfo.description}</p>

            {error && (
                <div className="pf-v6-c-alert pf-m-danger pf-v6-u-mb-md">
                    <div className="pf-v6-c-alert__icon">
                        <ExclamationCircleIcon />
                    </div>
                    <p className="pf-v6-c-alert__title">{error}</p>
                </div>
            )}

            <Toolbar>
                <ToolbarContent>
                    <ToolbarItem>
                        <SearchInput
                            placeholder="Search packages..."
                            value={searchQuery}
                            onChange={(_, value) => setSearchQuery(value)}
                            onClear={() => setSearchQuery('')}
                        />
                    </ToolbarItem>
                    <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                        <Badge>{filteredPackages.length} packages</Badge>
                    </ToolbarItem>
                </ToolbarContent>
            </Toolbar>

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
                    {/* Table header */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 3fr 1fr 1.5fr',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            fontWeight: 'bold',
                            borderBottom: '2px solid var(--pf-v6-global--BorderColor--100)',
                            backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                        }}
                    >
                        <div>Name</div>
                        <div>Summary</div>
                        <div>Version</div>
                        <div>Actions</div>
                    </div>

                    {/* Virtual scrolling list */}
                    <List<RowPropsType>
                        listRef={listRef}
                        defaultHeight={600}
                        rowCount={filteredPackages.length}
                        rowHeight={50}
                        rowComponent={Row}
                        rowProps={{
                            packages: filteredPackages,
                            operatingPackage: operatingOn,
                            packageProgress: progress,
                        }}
                    />
                </div>
            )}
        </div>
    );
};
