⚠️ **THESE RULES ONLY APPLY TO FILES IN /cockpit-package-manager/** ⚠️

# Cockpit Package Manager - Development Guide

Cockpit-based package manager using PackageKit, inspired by Raspberry Pi's Add/Remove Software.

**Local Instructions**: For environment-specific instructions and configurations, see @CLAUDE.local.md (not committed to version control).

## Project Context

This is a web-based package manager interface for Cockpit.

## Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Library**: PatternFly 6
- **Build Tool**: esbuild
- **Backend**: PackageKit D-Bus API via cockpit.js
- **Type Checking**: TypeScript strict mode

### Key Components

1. **packagekit.ts**: TypeScript wrapper around PackageKit D-Bus API
   - Type-safe transaction handling
   - Progress reporting
   - Error handling
   - All PackageKit methods (search, install, remove, dependencies, etc.)

2. **types.ts**: TypeScript type definitions
   - PackageInfo, PackageDetails interfaces
   - DebianSection structure
   - ProgressData for operations
   - ViewState for navigation

3. **Main UI Components** (to be implemented):
   - `packagemanager.tsx`: Root component with routing
   - `section-list.tsx`: Browse by Debian section
   - `package-list.tsx`: List packages in section
   - `package-details.tsx`: Detailed package view

### PackageKit Integration

The wrapper provides these operations:

```typescript
// Search
searchNames(query): Promise<PackageInfo[]>
searchDetails(query): Promise<PackageInfo[]>

// Package information
getPackages(filter): Promise<PackageInfo[]>
getDetails(packageIds): Promise<PackageDetails[]>

// Operations
installPackage(name, progressCb): Promise<void>
removePackage(name, progressCb): Promise<void>

// Dependencies
getDependencies(packageId): Promise<string[]>
getReverseDependencies(packageId): Promise<string[]>
getFiles(packageId): Promise<string[]>

// Utilities
resolve(name): Promise<string>
refreshCache(progressCb): Promise<void>
detect(): Promise<boolean>
```

## Development

### Build System

```bash
# Development build with watch
npm run watch

# Production build
NODE_ENV=production npm run build

# Type checking
npm run typecheck
```

The esbuild configuration:
- Bundles TypeScript/React to single JS file
- Externalizes cockpit.js (provided by Cockpit)
- Generates sourcemaps in development
- Minifies in production

### Code Structure

Follow these patterns from cockpit codebase:

1. **Component Structure**: Functional components with hooks
2. **Type Safety**: Strict TypeScript, no any types
3. **Error Handling**: Try-catch with user-friendly messages
4. **Progress Reporting**: Show progress for long operations
5. **Accessibility**: ARIA labels, keyboard navigation

### Testing

Manual testing workflow:

1. Build: `npm run build`
2. Copy to Cockpit: `sudo cp -r packagemanager /usr/share/cockpit/`
3. Test in Cockpit: http://localhost:9090
4. Check browser console for errors
5. Test with different package states

### Common Issues

**PackageKit not available**: Check `systemctl status packagekit`

**Permission errors**: Ensure cockpit superuser mode is enabled

**Build errors**: Check Node.js version (needs >= 18)

**Type errors**: Run `npm run typecheck` to see all type issues

## Next Steps

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the full implementation roadmap.

Current status: **Phase 1 complete** (Project setup & infrastructure)

Next phases:
- Phase 2: Complete PackageKit integration (Debian section mapping)
- Phase 3: Implement UI components
- Phase 4: Implement core features
- Phase 5: Polish & testing
- Phase 6: Documentation & packaging

## Code Patterns

### PackageKit Transaction

```typescript
import * as PK from './packagekit';

// Search packages
const packages = await PK.searchNames('nginx', (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
    if (progress.cancel) {
        // User can cancel
    }
});

// Install package
await PK.installPackage('nginx', (progress) => {
    setProgress(progress.percentage);
});
```

### Error Handling

```typescript
try {
    await PK.installPackage(name, setProgress);
} catch (error) {
    if (error instanceof TransactionError) {
        showError(`Failed to install: ${error.detail}`);
    }
}
```

## Git Workflow

**IMPORTANT**: Always ask before pushing, creating/pushing tags, or running destructive git operations that affect remote repositories. Local commits and branch operations are fine.

When performing `git add`, always list specific files instead of using `git add .` to avoid accidentally including unwanted changes.

Follow conventional commit format:
- `feat(section): add section browsing`
- `fix(install): handle permission errors`
- `docs: update README`

## References

- [Cockpit Guide](https://cockpit-project.org/guide/latest/)
- [PackageKit Documentation](https://www.freedesktop.org/software/PackageKit/gtk-doc/)
- [PatternFly React](https://www.patternfly.org/get-started/develop/)
- Inspiration: cockpit/pkg/apps, cockpit/pkg/packagekit
