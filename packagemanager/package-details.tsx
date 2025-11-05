/*
 * PackageDetails component - Detailed package information
 */

import React, { useState, useEffect } from 'react';
import {
    Button,
    Spinner,
    Breadcrumb,
    BreadcrumbItem,
    Badge,
    DescriptionList,
    DescriptionListGroup,
    DescriptionListTerm,
    DescriptionListDescription,
    Progress,
    ProgressSize,
    EmptyState,
    EmptyStateBody,
    Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, ArrowLeftIcon } from '@patternfly/react-icons';

import * as PK from './packagekit';
import { PackageDetails as PackageDetailsType, ProgressData } from './types';
import { formatSize, getStatusLabel, getStatusVariant, getPackageName, getErrorMessage } from './utils';
import { getGroupInfo } from './groups';

interface PackageDetailsProps {
    packageId: string;
    onBack: () => void;
}

export const PackageDetails: React.FC<PackageDetailsProps> = ({ packageId, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pkg, setPkg] = useState<PackageDetailsType | null>(null);
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [reverseDeps, setReverseDeps] = useState<string[]>([]);
    const [files, setFiles] = useState<string[]>([]);
    const [operating, setOperating] = useState(false);
    const [progress, setProgress] = useState<ProgressData | null>(null);

    useEffect(() => {
        loadPackageDetails();
    }, [packageId]);

    async function loadPackageDetails() {
        setLoading(true);
        setError(null);

        try {
            // Get package details
            const details = await PK.getDetails([packageId]);
            if (details.length === 0) {
                throw new Error('Package not found');
            }

            setPkg(details[0]);

            // Load dependencies
            try {
                const deps = await PK.getDependencies(packageId);
                setDependencies(deps);
            } catch (err) {
                console.warn('Failed to load dependencies:', err);
            }

            // Load reverse dependencies
            try {
                const rdeps = await PK.getReverseDependencies(packageId);
                setReverseDeps(rdeps);
            } catch (err) {
                console.warn('Failed to load reverse dependencies:', err);
            }

            // Load files (only if installed)
            if (details[0].installed) {
                try {
                    const fileList = await PK.getFiles(packageId);
                    setFiles(fileList);
                } catch (err) {
                    console.warn('Failed to load file list:', err);
                }
            }
        } catch (err) {
            console.error('Failed to load package details:', err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleInstall() {
        if (!pkg) return;

        setOperating(true);
        setError(null);

        try {
            await PK.installPackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData);
            });

            // Reload details
            await loadPackageDetails();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setOperating(false);
            setProgress(null);
        }
    }

    async function handleRemove() {
        if (!pkg) return;

        setOperating(true);
        setError(null);

        try {
            await PK.removePackage(pkg.name, (progressData: ProgressData) => {
                setProgress(progressData);
            });

            // Reload details
            await loadPackageDetails();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setOperating(false);
            setProgress(null);
        }
    }

    if (loading) {
        return (
            <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                <Spinner size="xl" />
                <p className="pf-v6-u-mt-md">Loading package details...</p>
            </div>
        );
    }

    if (error || !pkg) {
        return (
            <div>
                <Breadcrumb className="pf-v6-u-mb-md">
                    <BreadcrumbItem>
                        <Button variant="link" icon={<ArrowLeftIcon />} onClick={onBack}>
                            Back
                        </Button>
                    </BreadcrumbItem>
                </Breadcrumb>
                <EmptyState>
                    <ExclamationCircleIcon />
                    <Title headingLevel="h1" size="lg">Error loading package</Title>
                    <EmptyStateBody>{error || 'Package not found'}</EmptyStateBody>
                </EmptyState>
            </div>
        );
    }

    const groupInfo = getGroupInfo(pkg.group || 'unknown');

    return (
        <div className="package-details">
            <Breadcrumb className="pf-v6-u-mb-md">
                <BreadcrumbItem>
                    <Button variant="link" icon={<ArrowLeftIcon />} onClick={onBack}>
                        Back
                    </Button>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{pkg.name}</BreadcrumbItem>
            </Breadcrumb>

            <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between pf-v6-u-align-items-center pf-v6-u-mb-md">
                <div>
                    <h1>{pkg.name}</h1>
                    <p className="pf-v6-u-color-200">{pkg.summary}</p>
                </div>
                <div>
                    <Badge>
                        {getStatusLabel(pkg.installed)}
                    </Badge>
                </div>
            </div>

            {error && (
                <div className="pf-v6-c-alert pf-m-danger pf-v6-u-mb-md">
                    <div className="pf-v6-c-alert__icon">
                        <ExclamationCircleIcon />
                    </div>
                    <p className="pf-v6-c-alert__title">{error}</p>
                </div>
            )}

            {operating && progress && (
                <Progress
                    value={progress.percentage}
                    title={progress.waiting ? 'Waiting for package manager...' : 'Processing...'}
                    size={ProgressSize.lg}
                    className="pf-v6-u-mb-md"
                />
            )}

            <div className="pf-v6-u-mb-lg">
                {pkg.installed ? (
                    <Button
                        variant="danger"
                        onClick={handleRemove}
                        isDisabled={operating}
                        isLoading={operating}
                    >
                        Remove Package
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleInstall}
                        isDisabled={operating}
                        isLoading={operating}
                    >
                        Install Package
                    </Button>
                )}
            </div>

            <DescriptionList>
                <DescriptionListGroup>
                    <DescriptionListTerm>Version</DescriptionListTerm>
                    <DescriptionListDescription>{pkg.version}</DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                    <DescriptionListTerm>Architecture</DescriptionListTerm>
                    <DescriptionListDescription>{pkg.arch}</DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                    <DescriptionListTerm>Group</DescriptionListTerm>
                    <DescriptionListDescription>{groupInfo.name}</DescriptionListDescription>
                </DescriptionListGroup>

                {pkg.size !== undefined && (
                    <DescriptionListGroup>
                        <DescriptionListTerm>Size</DescriptionListTerm>
                        <DescriptionListDescription>{formatSize(pkg.size)}</DescriptionListDescription>
                    </DescriptionListGroup>
                )}

                {pkg.license && (
                    <DescriptionListGroup>
                        <DescriptionListTerm>License</DescriptionListTerm>
                        <DescriptionListDescription>{pkg.license}</DescriptionListDescription>
                    </DescriptionListGroup>
                )}

                {pkg.url && (
                    <DescriptionListGroup>
                        <DescriptionListTerm>Homepage</DescriptionListTerm>
                        <DescriptionListDescription>
                            <a href={pkg.url} target="_blank" rel="noopener noreferrer">{pkg.url}</a>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                )}

                <DescriptionListGroup>
                    <DescriptionListTerm>Description</DescriptionListTerm>
                    <DescriptionListDescription>
                        <p>{pkg.description || pkg.summary}</p>
                    </DescriptionListDescription>
                </DescriptionListGroup>

                {dependencies.length > 0 && (
                    <DescriptionListGroup>
                        <DescriptionListTerm>Dependencies ({dependencies.length})</DescriptionListTerm>
                        <DescriptionListDescription>
                            <ul className="pf-v6-c-list">
                                {dependencies.slice(0, 10).map(dep => (
                                    <li key={dep}>{getPackageName(dep)}</li>
                                ))}
                                {dependencies.length > 10 && (
                                    <li>... and {dependencies.length - 10} more</li>
                                )}
                            </ul>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                )}

                {reverseDeps.length > 0 && (
                    <DescriptionListGroup>
                        <DescriptionListTerm>Required by ({reverseDeps.length})</DescriptionListTerm>
                        <DescriptionListDescription>
                            <ul className="pf-v6-c-list">
                                {reverseDeps.slice(0, 10).map(dep => (
                                    <li key={dep}>{getPackageName(dep)}</li>
                                ))}
                                {reverseDeps.length > 10 && (
                                    <li>... and {reverseDeps.length - 10} more</li>
                                )}
                            </ul>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                )}

                {files.length > 0 && (
                    <DescriptionListGroup>
                        <DescriptionListTerm>Installed Files ({files.length})</DescriptionListTerm>
                        <DescriptionListDescription>
                            <details>
                                <summary>Show file list</summary>
                                <ul className="pf-v6-c-list pf-v6-u-font-size-sm">
                                    {files.map(file => (
                                        <li key={file}><code>{file}</code></li>
                                    ))}
                                </ul>
                            </details>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                )}
            </DescriptionList>
        </div>
    );
};
