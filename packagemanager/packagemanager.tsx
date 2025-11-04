/*
 * Main Cockpit Package Manager component
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Page, PageSection } from '@patternfly/react-core';

import { ViewState } from './types';
import { GroupList } from './group-list';
import { PackageList } from './package-list';
import { PackageDetails } from './package-details';

const PackageManager: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>({ view: 'groups' });

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

    return (
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
    );
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const root = createRoot(document.getElementById('app')!);
    root.render(<PackageManager />);
});
