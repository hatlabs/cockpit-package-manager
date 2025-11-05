# Cockpit Package Manager

A modern, web-based package manager interface for Cockpit using PackageKit as the backend.

## Features

- **Browse by Section**: View packages organized by Debian sections (admin, net, devel, etc.)
- **Search**: Fast search across package names and descriptions
- **Package Details**: View comprehensive information including dependencies and file lists
- **Install/Remove**: Install and remove packages with progress indication
- **Dependency Tracking**: View package dependencies and reverse dependencies

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
├── packagemanager.tsx   # Main app component
├── section-list.tsx     # Debian sections list view
├── package-list.tsx     # Packages in section view
├── package-details.tsx  # Individual package view
├── packagekit.ts        # PackageKit D-Bus wrapper
├── types.ts             # TypeScript interfaces
├── utils.tsx            # Shared utilities
└── packagemanager.scss  # Styles
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

```bash
# Build the Debian package (from cockpit-package-manager-debian directory)
dpkg-buildpackage -us -uc -b

# Install
sudo dpkg -i ../cockpit-package-manager_*.deb
```

## Usage

1. Open Cockpit in your web browser (usually http://localhost:9090)
2. Navigate to "Package Manager" in the left menu
3. Browse packages by section or use the search function
4. Click on a package to view details
5. Install or remove packages as needed

## Architecture

### PackageKit Integration

The application uses PackageKit's D-Bus API for all package operations:

- `GetPackages`: Fetch all available/installed packages
- `SearchNames`/`SearchDetails`: Search functionality
- `GetDetails`: Fetch detailed package information
- `InstallPackages`/`RemovePackages`: Package operations
- `DependsOn`/`RequiredBy`: Dependency information
- `GetFiles`: List files in package

### Debian Sections

Packages are organized by standard Debian sections:
- **admin**: System administration utilities
- **comm**: Communication programs
- **database**: Database tools
- **devel**: Development tools
- **editors**: Text editors
- **games**: Games and entertainment
- **graphics**: Graphics tools
- **mail**: Email clients and servers
- **net**: Network tools
- **utils**: Utilities
- And many more...

## Development Workflow

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the complete implementation roadmap.

## License

LGPL-2.1-or-later

## Author

Matti Airas <matti.airas@hatlabs.fi>

## Contributing

This is part of the HaLOS project. For issues and contributions, please see the main HaLOS repository.
