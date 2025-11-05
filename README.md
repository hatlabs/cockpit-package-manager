# Cockpit Package Manager

A modern, web-based package manager interface for Cockpit using PackageKit as the backend. Browse, search, install, and manage packages through an intuitive web interface.

## What Packages Does This Manage?

This application manages **system packages** (software installed at the operating system level) using [PackageKit](https://www.freedesktop.org/software/PackageKit/) as the backend abstraction layer.

**Package Types Supported:**

PackageKit supports multiple package management backends. This application is primarily developed and tested with:

- **APT/DEB packages** (Debian, Ubuntu, and derivatives like HaLOS)

However, PackageKit's abstraction layer means it can theoretically work with other backends including:
- DNF/RPM (Fedora, RHEL, CentOS)
- Zypper/RPM (openSUSE)
- ALPM (Arch Linux)
- And [many others](https://github.com/PackageKit/PackageKit/blob/main/backends/MAINTAINERS.md)

**Note:** This project is part of [HaLOS](https://github.com/hatlabs/halos-distro) and primarily tested on Debian Trixie systems. While PackageKit's abstraction should allow it to work with other distributions, testing has focused on APT/DEB-based systems.

## Features

- **Browse by Group**: View packages organized by PackageKit groups (admin, network, development, etc.)
- **Smart Search**:
  - Auto-search with 4+ characters
  - Press Enter to search with 2+ characters
  - Search across package names and descriptions
- **Package Details**: View comprehensive information including:
  - Dependencies and reverse dependencies
  - Installed file lists
  - Package size, version, license
  - Homepage links
- **Install/Remove**: Install and remove packages with real-time progress indication
- **Performance**: Smart caching for fast navigation between groups
- **Accessibility**:
  - Full ARIA labels for screen readers
  - Keyboard navigation (Escape to go back)
  - Live region announcements for status changes
- **Dark Mode**: Automatically follows Cockpit's theme setting

## Requirements

- **Cockpit** >= 276
- **PackageKit**: For package management backend
- **Node.js** >= 18: For building the application
- **npm**: For dependency management

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Watch for changes during development
npm run watch

# Type check
npm run typecheck
```

### Project Structure

```
packagemanager/
├── index.html           # Entry point
├── manifest.json        # Cockpit manifest
├── theme.js             # Dark mode theme detection
├── packagemanager.tsx   # Main app component with routing
├── group-list.tsx       # PackageKit groups list view with search
├── package-list.tsx     # Packages in group view
├── package-details.tsx  # Individual package details view
├── packagekit.ts        # PackageKit D-Bus wrapper
├── groups.ts            # PackageKit group definitions
├── types.ts             # TypeScript interfaces
├── utils.ts             # Shared utilities
└── styles.css           # Custom styles
```

### Technology Stack

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **PatternFly 6**: UI component library
- **esbuild**: Fast JavaScript bundler
- **PackageKit**: System package management

## Installation

### From Source

```bash
# Build the application
npm install
npm run build

# Copy to Cockpit directory
sudo cp -r packagemanager /usr/share/cockpit/
```

### From .deb Package

The recommended way to install is via the Debian package from the [cockpit-package-manager-debian](https://github.com/hatlabs/cockpit-package-manager-debian) repository:

```bash
# Clone the packaging repository
git clone https://github.com/hatlabs/cockpit-package-manager-debian
cd cockpit-package-manager-debian

# Build using Docker (works on macOS and Linux)
./run package:deb:docker

# Install the package
sudo dpkg -i ../cockpit-package-manager_*.deb
```

See the packaging repository for more build options and CI/CD integration.

## Usage

1. Open Cockpit in your web browser (usually http://localhost:9090 or https://localhost:9090)
2. Navigate to "Package Manager" in the left menu
3. **Browse**: Click on a group to view packages in that category
4. **Search**: Type in the search box (auto-searches at 4+ characters, or press Enter for 2+)
5. **Details**: Click any package name to view detailed information
6. **Install/Remove**: Use the action buttons to manage packages
7. **Keyboard**: Press Escape to navigate back to the previous view

## Architecture

### PackageKit Integration

The application uses PackageKit's D-Bus API via cockpit.js for all package operations:

- `SearchGroups`: Browse packages by PackageKit group
- `SearchNames`/`SearchDetails`: Search functionality
- `GetDetails`: Fetch detailed package information
- `InstallPackages`/`RemovePackages`: Package operations with progress
- `DependsOn`/`RequiredBy`: Dependency information
- `GetFiles`: List files in installed packages
- Transaction progress tracking with percentage updates

### PackageKit Groups

Packages are organized by PackageKit standard groups:

**Most Common:**
- **admin-tools**: System administration tools
- **communication**: Communication applications
- **documentation**: Documentation
- **education**: Educational software
- **fonts**: Font packages
- **games**: Games and entertainment
- **graphics**: Graphics applications
- **internet**: Internet applications (web browsers, email)
- **multimedia**: Audio and video applications
- **network**: Networking tools and servers
- **office**: Office applications
- **programming**: Development tools and libraries
- **science**: Scientific software
- **security**: Security tools
- **system**: System utilities

**Complete list includes:** accessibility, addons, collections, desktop-gnome, desktop-kde, desktop-other, desktop-xfce, electronics, legacy, localization, maps, power-management, publishing, repos, servers, unknown, virtualization

See [groups.ts](packagemanager/groups.ts) for the complete group definitions.

## Development Workflow

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the complete implementation roadmap and [CLAUDE.md](CLAUDE.md) for development guide.

## Troubleshooting

### Package Manager doesn't appear in Cockpit menu

- Verify installation: `dpkg -l | grep cockpit-package-manager`
- Check files exist: `ls -la /usr/share/cockpit/packagemanager/`
- Restart Cockpit: `sudo systemctl restart cockpit`

### PackageKit not available error

- Check PackageKit is installed: `dpkg -l | grep packagekit`
- Verify service is running: `systemctl status packagekit`
- Install if missing: `sudo apt install packagekit`

### Dark mode not working

- Ensure you're using Cockpit >= 276
- Check Cockpit's dark mode setting (top-right menu)
- Verify theme.js is loaded: Check browser console for errors

### Search not working or slow

- PackageKit cache may need updating
- Check PackageKit transaction logs: `journalctl -u packagekit -f`
- Some backends have slower search performance

### Install/Remove operations fail

- Verify you have proper permissions (Cockpit superuser mode)
- Check available disk space: `df -h`
- Review package manager logs: Check browser console (F12)
- Check for conflicting package managers (apt/dpkg running)

## License

LGPL-2.1-or-later

## Author

Matti Airas <matti.airas@hatlabs.fi>

## Contributing

This is part of the [HaLOS project](https://github.com/hatlabs/halos-distro) (Hat Labs Operating System).

For development:
- See [CLAUDE.md](CLAUDE.md) for development guide and architecture
- Follow conventional commit format for commit messages
- Test changes on a real system before submitting
- Ensure TypeScript type checking passes: `npm run typecheck`

For issues and contributions, please see the [halos-distro repository](https://github.com/hatlabs/halos-distro).
