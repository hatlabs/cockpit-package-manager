/*
 * Main Cockpit Package Manager component
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { Page, PageSection } from '@patternfly/react-core';

import { PackageDetails as PackageDetailsType } from './types';
import { GroupList } from './group-list';
import { PackageList } from './package-list';
import { PackageDetails } from './package-details';

// Cockpit is loaded as a global via script tag
declare const cockpit: any;

// Custom hook to sync with cockpit.location
function usePageLocation() {
    const [location, setLocation] = useState(cockpit.location);

    useEffect(() => {
        function update() {
            setLocation({ ...cockpit.location });
        }
        cockpit.addEventListener("locationchanged", update);
        return () => cockpit.removeEventListener("locationchanged", update);
    }, []);

    return location;
}

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
    const { path, options } = usePageLocation();
    const [packageCache, setPackageCache] = useState<Map<string, PackageDetailsType[]>>(new Map());

    // Handle invalid paths
    useEffect(() => {
        const isInvalidPath = path.length > 2 ||
                              (path.length === 2 && path[0] !== 'group' && path[0] !== 'package') ||
                              path.length === 1;
        if (isInvalidPath) {
            console.warn('[PackageManager] Invalid path:', path);
            cockpit.location.go([]);
        }
    }, [path]);

    function handleGroupSelect(groupId: string) {
        cockpit.location.go(['group', groupId]);
    }

    function handlePackageSelect(packageId: string, groupId?: string) {
        // Preserve group context in URL options for better back navigation
        if (groupId) {
            cockpit.location.go(['package', packageId], { group: groupId });
        } else {
            cockpit.location.go(['package', packageId]);
        }
    }

    function handleBackToGroups() {
        cockpit.location.go([]);
    }

    function handleBackFromDetails() {
        // Try to navigate back to the group if context is available
        const groupId = options.group;
        if (groupId && typeof groupId === 'string') {
            cockpit.location.go(['group', groupId]);
        } else {
            cockpit.location.go([]);
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
                    {/* Groups view: #/ */}
                    {path.length === 0 && (
                        <GroupList
                            onGroupSelect={handleGroupSelect}
                            onPackageSelect={handlePackageSelect}
                        />
                    )}

                    {/* Package list view: #/group/<groupId> */}
                    {path.length === 2 && path[0] === 'group' && (
                        <PackageList
                            groupId={path[1]}
                            onBack={handleBackToGroups}
                            onPackageSelect={(packageId) => handlePackageSelect(packageId, path[1])}
                        />
                    )}

                    {/* Package details view: #/package/<packageId> */}
                    {path.length === 2 && path[0] === 'package' && (
                        <PackageDetails
                            packageId={path[1]}
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
