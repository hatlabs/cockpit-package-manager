/*
 * Main Cockpit Package Manager component
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface AppState {
    loading: boolean;
    error: string | null;
}

const PackageManager: React.FC = () => {
    const [state, setState] = useState<AppState>({
        loading: true,
        error: null
    });

    useEffect(() => {
        // Initialize PackageKit detection
        async function init() {
            try {
                // TODO: Detect PackageKit availability
                console.log('Initializing Package Manager...');
                setState({ loading: false, error: null });
            } catch (error) {
                setState({
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to initialize'
                });
            }
        }

        init();
    }, []);

    if (state.loading) {
        return (
            <div className="package-manager">
                <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
                    <div className="pf-v6-c-spinner" role="progressbar">
                        <span className="pf-v6-c-spinner__clipper" />
                        <span className="pf-v6-c-spinner__lead-ball" />
                        <span className="pf-v6-c-spinner__tail-ball" />
                    </div>
                    <p>Loading Package Manager...</p>
                </div>
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="package-manager">
                <div className="pf-v6-c-empty-state">
                    <div className="pf-v6-c-empty-state__content">
                        <i className="fas fa-exclamation-circle pf-v6-c-empty-state__icon" aria-hidden="true"></i>
                        <h1 className="pf-v6-c-title pf-m-lg">Error</h1>
                        <div className="pf-v6-c-empty-state__body">{state.error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="package-manager">
            <div className="pf-v6-c-page">
                <main className="pf-v6-c-page__main">
                    <section className="pf-v6-c-page__main-section">
                        <div className="pf-v6-c-content">
                            <h1>Package Manager</h1>
                            <p>Cockpit Package Manager - Basic UI Skeleton</p>
                            <p>TODO: Implement group browsing, package listing, and package details</p>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const root = createRoot(document.getElementById('app')!);
    root.render(<PackageManager />);
});
