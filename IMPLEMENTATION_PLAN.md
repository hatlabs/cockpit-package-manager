# Cockpit Package Manager Implementation Plan

## Project Overview

Create a Cockpit-based package manager using PackageKit as the backend, inspired by Raspberry Pi's Add/Remove Software but focused on Debian sections for server/marine use cases.

## Architecture Decisions

- **Framework**: React + PatternFly + TypeScript
- **Backend**: PackageKit D-Bus API via cockpit.js
- **Build**: esbuild + tsc (following cockpit's build pattern)
- **Location**: Two repos in workspace: `cockpit-package-manager/` and `cockpit-package-manager-debian/`
- **Categories**: Debian sections (admin, devel, net, utils, etc.)

## Phase 1: Project Setup & Infrastructure

### 1.1 Create Repository Structure

```
cockpit-package-manager/
├── packagemanager/
│   ├── index.html           # Entry point
│   ├── manifest.json        # Cockpit manifest
│   ├── packagemanager.tsx   # Main app component
│   ├── section-list.tsx     # Debian sections list view
│   ├── package-list.tsx     # Packages in section view
│   ├── package-details.tsx  # Individual package view
│   ├── packagekit.ts        # PackageKit D-Bus wrapper
│   ├── types.ts             # TypeScript interfaces
│   ├── utils.tsx            # Shared utilities
│   └── packagemanager.scss  # Styles
├── tsconfig.json
├── package.json
├── .gitignore
├── README.md
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
└── LICENSE
```

### 1.2 Create Debian Packaging Repository

```
cockpit-package-manager-debian/
├── debian/
│   ├── control              # Package metadata
│   ├── rules                # Build rules
│   ├── changelog            # Version history
│   ├── copyright            # License
│   ├── install              # File mappings
│   ├── compat               # Debhelper level
│   └── source/format
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
└── README.md
```

### 1.3 Setup Build System

- Configure esbuild for bundling TypeScript/React
- Setup tsc for type checking
- Add npm scripts for development and production builds
- Include PatternFly dependencies

## Phase 2: PackageKit Integration

### 2.1 Create PackageKit TypeScript Wrapper

Extend cockpit's `lib/packagekit.js` patterns with TypeScript:
- Type-safe D-Bus transaction handling
- Methods: `SearchNames`, `SearchDetails`, `SearchFiles`, `GetDetails`, `GetPackages`, `Resolve`
- Install/Remove operations with progress callbacks
- Section/group enumeration via `GetPackages` + filtering

### 2.2 Debian Section Mapping

Create mapping for Debian sections:
- Parse package section field from PackageKit metadata
- Standard sections: admin, comm, database, devel, doc, editors, electronics, embedded, fonts, games, gnome, gnu-r, gnustep, graphics, hamradio, haskell, httpd, interpreters, java, javascript, kde, kernel, libdevel, libs, lisp, localization, mail, math, metapackages, misc, net, news, ocaml, oldlibs, otherosfs, perl, php, python, ruby, rust, science, shells, sound, tasks, tex, text, utils, vcs, video, web, x11, xfce, zope

## Phase 3: UI Components

### 3.1 Main App Component (packagemanager.tsx)

- Root component with routing logic
- State management for current view (sections list / package list / details)
- Progress tracking for async operations
- Error boundary handling

### 3.2 Section List View (section-list.tsx)

Using PatternFly components:
- **Card** or **DataList** for section display
- Show section name, description, package count
- Search/filter functionality
- Click handler to navigate to package list

### 3.3 Package List View (package-list.tsx)

- Display packages in selected section
- **Table** or **DataList** with columns: Name, Summary, Version, Status (Installed/Available)
- Search/filter within section
- Sort options (name, status)
- Action buttons (Install/Remove) with progress indicators
- Click handler to navigate to details

### 3.4 Package Details View (package-details.tsx)

Display comprehensive package information:
- Name, summary, description
- Version, size, section
- Dependencies (DependsOn)
- Reverse dependencies (RequiredBy)
- File list (GetFiles)
- Install/Remove action with progress
- Back navigation

### 3.5 Shared Components

- **ProgressBar**: Progress indicator for installs/removals
- **CancelButton**: Cancel ongoing operations
- **ErrorAlert**: Display operation errors
- **SearchBar**: Reusable search component
- **StatusBadge**: Show package status (installed/available)

## Phase 4: Core Features

### 4.1 List Package Sections

- Fetch all packages via `GetPackages` with filters
- Extract section field from package metadata
- Group by section with counts
- Cache results for performance

### 4.2 List Packages in Section

- Filter packages by section field
- Support both installed and available filters
- Paginate for performance (large sections)
- Real-time status updates

### 4.3 Search & Filter

- **Global search**: `SearchNames` across all packages
- **Detailed search**: `SearchDetails` for descriptions
- **File search**: `SearchFiles` for file paths
- Filter by status (installed/available/all)

### 4.4 Package Details

- `GetDetails` for full metadata
- `DependsOn` for dependency tree
- `RequiredBy` for reverse dependencies
- `GetFiles` for installed file list
- Link to dependencies (clickable)

### 4.5 Install/Remove Operations

- `Resolve` package name to ID
- `InstallPackages` with progress reporting
- `RemovePackages` with confirmation dialog
- Privilege escalation via cockpit superuser
- Handle errors gracefully
- Show what will be installed/removed (simulate first)

## Phase 5: Polish & Testing

### 5.1 UI Polish

- Responsive design for different screen sizes
- Dark mode support (cockpit-dark-theme)
- Keyboard navigation
- Accessibility (ARIA labels, focus management)
- Loading states and skeletons

### 5.2 Error Handling

- PackageKit transaction errors
- D-Bus connection failures
- Permission issues
- Network problems (repository unavailable)
- Concurrent operations

### 5.3 Performance Optimization

- Lazy loading for large package lists
- Virtual scrolling for tables
- Debounced search
- Cached section/package data
- Efficient re-renders

### 5.4 Testing

- Manual testing on Debian/Raspberry Pi OS
- Test all PackageKit operations
- Test with various package states
- Test error scenarios
- Browser compatibility

## Phase 6: Documentation & Packaging

### 6.1 Documentation

- README: Installation, usage, features
- CLAUDE.md: Architecture, development guide
- Code comments for complex logic
- API documentation for PackageKit wrapper

### 6.2 Debian Package

- Build .deb package
- Test installation on HaLOS
- Verify dependencies (cockpit, packagekit)
- Integration with Cockpit menu

### 6.3 Integration

- Add to HaLOS image builds
- Update halos-distro README
- Create announcement

## Technical Notes

### PackageKit Considerations

- Apt backend on Debian may have quirks (percentage reporting)
- Section field available in package metadata
- Handle long-running operations gracefully
- Support cancellation for better UX

### Cockpit Integration

- Follow cockpit's PatternFly 6 patterns
- Use cockpit.js for D-Bus communication
- Integrate with cockpit superuser for privileges
- Follow cockpit's security best practices (CSP)

### TypeScript Usage

- Strict mode enabled
- Proper typing for all PackageKit operations
- Interfaces for package metadata
- Type-safe event handlers

## Estimated Complexity

- Phase 1-2: ~2-3 days (setup + PackageKit wrapper)
- Phase 3: ~3-4 days (UI components)
- Phase 4: ~2-3 days (core features)
- Phase 5: ~2-3 days (polish + testing)
- Phase 6: ~1 day (docs + packaging)
- **Total: ~10-16 days** of focused development

## Success Criteria

- ✓ List all Debian sections with package counts
- ✓ Browse packages within a section
- ✓ Search across all packages
- ✓ View detailed package information
- ✓ Install packages with progress indication
- ✓ Remove packages with dependency checking
- ✓ Handle errors gracefully
- ✓ Responsive and accessible UI
- ✓ Installable as .deb package
- ✓ Integrated into HaLOS

## References

### Inspiration & Code Patterns

- **Raspberry Pi Add/Remove Software**: UX patterns for package management
- **cockpit-dockermanager**: UI inspiration for listing, searching, filtering
- **cockpit/pkg/apps**: React + PatternFly patterns, AppStream integration
- **cockpit/pkg/packagekit**: PackageKit integration patterns, updates UI
- **cockpit/pkg/lib/packagekit.js**: Core PackageKit D-Bus wrapper

### PackageKit API

- [Transaction Methods](https://www.freedesktop.org/software/PackageKit/gtk-doc/Transaction.html)
- Key methods: `SearchNames`, `SearchDetails`, `SearchGroups`, `GetDetails`, `GetPackages`, `Resolve`, `InstallPackages`, `RemovePackages`, `DependsOn`, `RequiredBy`, `GetFiles`

### Cockpit Development

- [Cockpit Guide](https://cockpit-project.org/guide/latest/)
- Uses esbuild for bundling, TypeScript for type safety
- PatternFly 6 for UI components
- cockpit.js for system integration
