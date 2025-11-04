/*
 * PackageList component - Display packages in a group
 */

import React, { useState, useEffect } from 'react';
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
} from '@patternfly/react-core';
import {
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
} from '@patternfly/react-table';
import { ExclamationCircleIcon, ArrowLeftIcon } from '@patternfly/react-icons';

import * as PK from './packagekit';
import { PackageDetails, ProgressData } from './types';
import { filterPackages, sortPackagesByName, getStatusLabel, getStatusVariant, getErrorMessage } from './utils';
import { getGroupInfo } from './groups';

interface PackageListProps {
    groupId: string;
    onBack: () => void;
    onPackageSelect: (packageId: string) => void;
}

export const PackageList: React.FC<PackageListProps> = ({ groupId, onBack, onPackageSelect }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [packages, setPackages] = useState<PackageDetails[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [operatingOn, setOperatingOn] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);

    const groupInfo = getGroupInfo(groupId);

    useEffect(() => {
        loadPackages();
    }, [groupId]);

    async function loadPackages() {
        setLoading(true);
        setError(null);

        try {
            // Get all packages
            const allPackages = await PK.getPackages();
            const packageIds = allPackages.map(p => p.id);

            // Get details to filter by group
            const details = await PK.getDetails(packageIds);

            // Filter by group
            const groupPackages = details.filter(p => p.group === groupId);

            // Sort by name
            const sorted = sortPackagesByName(groupPackages);

            setPackages(sorted);
        } catch (err) {
            console.error('Failed to load packages:', err);
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
                <Spinner size="xl" />
                <p className="pf-v6-u-mt-md">Loading packages...</p>
            </div>
        );
    }

    return (
        <div className="package-list">
            <Breadcrumb className="pf-v6-u-mb-md">
                <BreadcrumbItem>
                    <Button variant="link" icon={<ArrowLeftIcon />} onClick={onBack}>
                        Groups
                    </Button>
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
                <Table variant="compact">
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Summary</Th>
                            <Th>Version</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredPackages.map(pkg => (
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
                                <Td>{pkg.summary}</Td>
                                <Td>{pkg.version}</Td>
                                <Td>
                                    <Badge>
                                        {getStatusLabel(pkg.installed)}
                                    </Badge>
                                </Td>
                                <Td>
                                    {operatingOn === pkg.id ? (
                                        <div>
                                            <Spinner size="sm" /> {progress}%
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
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}
        </div>
    );
};
