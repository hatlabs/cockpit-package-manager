// Apply PatternFly dark theme class by inheriting from parent window (Cockpit shell)
// This must run before any content renders to avoid flash of wrong theme
(function() {
    function updateTheme() {
        // Try to inherit theme from parent frame (Cockpit shell)
        try {
            if (window.parent && window.parent !== window &&
                window.parent.document && window.parent.document.documentElement) {

                const parentHasDark = window.parent.document.documentElement.classList.contains('pf-v6-theme-dark');

                if (parentHasDark) {
                    document.documentElement.classList.add('pf-v6-theme-dark');
                } else {
                    document.documentElement.classList.remove('pf-v6-theme-dark');
                }
                return; // Successfully inherited from parent
            }
        } catch (e) {
            // Cross-origin restrictions - fallback to system preference
        }

        // Fallback: Use system preference if we can't access parent
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.classList.add('pf-v6-theme-dark');
        } else {
            document.documentElement.classList.remove('pf-v6-theme-dark');
        }
    }

    // Apply theme immediately
    updateTheme();

    // Watch for theme changes in parent frame
    try {
        if (window.parent && window.parent !== window &&
            window.parent.document && window.parent.document.documentElement) {

            // Use MutationObserver to detect when parent's class changes
            const observer = new MutationObserver(updateTheme);
            observer.observe(window.parent.document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    } catch (e) {
        // If we can't observe parent, fall back to media query listener
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
    }
})();
