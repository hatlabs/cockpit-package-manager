/*
 * Main Cockpit Package Manager component
 */

import React, { useState, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { Page, PageSection } from '@patternfly/react-core';

import { ViewState, PackageDetails as PackageDetailsType } from './types';
import { GroupList } from './group-list';
import { PackageList } from './package-list';
import { PackageDetails } from './package-details';

// Package cache context for sharing data between components
interface PackageCacheContextType {
    cache: Map<string, PackageDetailsType[]>;
    setCache: (groupId: string, packages: PackageDetailsType[]) => void;
    clearCache: () => void;
}

const PackageCacheContext = createContext<PackageCacheContextType | undefined>(undefined);

export function usePackageCache() {
    const context = useContext(PackageCacheContext);
    if (!context) {
        throw new Error('usePackageCache must be used within PackageCacheProvider');
    }
    return context;
}

const PackageManager: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>({ view: 'groups' });
    const [packageCache, setPackageCache] = useState<Map<string, PackageDetailsType[]>>(new Map());

    function handleGroupSelect(groupId: string) {
        setViewState({ view: 'packages', group: groupId });
    }

    function handlePackageSelect(packageId: string) {
        setViewState({ view: 'details', packageId });
    }

    function handleBackToGroups() {
        setViewState({ view: 'groups' });
    }

    function handleBackFromDetails() {
        // Go back to package list if we have the group context
        if (viewState.view === 'details') {
            // For now, just go back to groups
            // TODO: Preserve group context for better navigation
            setViewState({ view: 'groups' });
        }
    }

    // Cache management functions
    function setCachedPackages(groupId: string, packages: PackageDetailsType[]) {
        setPackageCache(prev => {
            const newCache = new Map(prev);
            newCache.set(groupId, packages);
            return newCache;
        });
    }

    function clearPackageCache() {
        setPackageCache(new Map());
    }

    const cacheContextValue: PackageCacheContextType = {
        cache: packageCache,
        setCache: setCachedPackages,
        clearCache: clearPackageCache,
    };

    return (
        <PackageCacheContext.Provider value={cacheContextValue}>
            <Page>
                <PageSection>
                    {viewState.view === 'groups' && (
                        <GroupList onGroupSelect={handleGroupSelect} />
                    )}

                    {viewState.view === 'packages' && (
                        <PackageList
                            groupId={viewState.group}
                            onBack={handleBackToGroups}
                            onPackageSelect={handlePackageSelect}
                        />
                    )}

                    {viewState.view === 'details' && (
                        <PackageDetails
                            packageId={viewState.packageId}
                            onBack={handleBackFromDetails}
                        />
                    )}
                </PageSection>
            </Page>
        </PackageCacheContext.Provider>
    );
};

// Initialize the application
// Note: Since this is loaded as a module (type="module"), it's deferred and runs
// after DOMContentLoaded. No need to wait for the event.
try {
    const appElement = document.getElementById('app');
    if (!appElement) {
        throw new Error('App element not found');
    }

    const root = createRoot(appElement);
    root.render(<PackageManager />);
} catch (err) {
    console.error('[PackageManager] Failed to initialize:', err);
    console.error('[PackageManager] Error stack:', err instanceof Error ? err.stack : 'no stack');
    // Display error in the app div
    const appElement = document.getElementById('app');
    if (appElement) {
        appElement.innerHTML = `
            <div style="padding: 20px; color: red;">
                <h2>Initialization Error</h2>
                <pre>${err instanceof Error ? err.message : String(err)}</pre>
                <pre>${err instanceof Error ? err.stack : ''}</pre>
            </div>
        `;
    }
}
