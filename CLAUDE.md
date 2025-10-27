# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pnpm monorepo named "kitchen-sink" demonstrating modern web application architecture with multiple frontend frameworks, shared packages, and infrastructure automation.

**Key principle from README**: Components that need to be built go in `src`, those that don't can be in the root directory.

## Monorepo Structure

The repository is organized into two main categories:

- **js-apps/**: Application projects (storefront, blog, admin, api)
  - `storefront`: Next.js web application
  - `blog`: Remix-based blog
  - `admin`: Vite-based dashboard
  - `api`: TypeScript backend server

- **js-packages/**: Shared packages and configurations
  - `ui`: Shared React components
  - `logger`: Logging utilities
  - `jest-presets`: Testing configuration
  - `config-typescript`: TypeScript presets for different frameworks
  - `config-eslint`: ESLint configurations

## Development Commands

The project uses both npm scripts and mise tasks. You can use either:

**Build:**
```bash
pnpm build                    # Build all apps in js-apps/*
mise run build               # Alternative using mise
```

**Development:**
```bash
pnpm dev                     # Run all apps in dev mode
mise run dev                 # Alternative using mise
```

**Linting & Formatting:**
```bash
pnpm lint                    # Lint all apps
pnpm format                  # Format with Prettier
mise run lint                # Alternative using mise
mise run format              # Alternative using mise
```

**Testing:**
```bash
pnpm test                    # Run tests in all apps
mise run test                # Alternative using mise
```

**Cleaning:**
```bash
pnpm clean                   # Clean build artifacts
mise run clean               # Alternative using mise
```

**Working with specific apps:**
```bash
pnpm --filter "./js-apps/storefront" dev    # Run only storefront
pnpm --filter "./js-apps/api" test          # Test only API
pnpm --filter "./js-packages/ui" build      # Build only UI package
```

## Environment Setup

- **Node.js**: Requires v22 or higher
- **Package Manager**: pnpm 8.15.6
- **Mise**: Uses mise for tool management (Python, Zig, Bun)
- **AWS**: ECR registry configured at `912951144733.dkr.ecr.us-west-2.amazonaws.com`

## Architecture Notes

### Shared Configuration Pattern

The monorepo uses shared configuration packages to maintain consistency:
- TypeScript configs in `js-packages/config-typescript` provide presets for Next.js, Remix, and Vite
- ESLint configs in `js-packages/config-eslint` provide linting rules for different project types
- Jest presets in `js-packages/jest-presets` standardize testing

When making changes to build/lint/test configurations, prefer updating the shared packages rather than individual app configs.

### Multi-Framework Approach

This repository intentionally uses multiple frontend frameworks (Next.js, Remix, Vite) to demonstrate interoperability. When working across apps, be mindful of framework-specific patterns:
- Next.js uses App Router or Pages Router
- Remix uses loader/action patterns
- Vite apps use standard React patterns

### Infrastructure

- **Docker**: Dockerfiles located in `docker/` directory
- **Ansible**: Server configuration playbooks for infrastructure automation
- **Containers**: Built for deployment to AWS ECR

## Testing Strategy

- Jest is the primary testing framework
- Shared jest-presets ensure consistent test configuration
- Tests are co-located with source code in individual packages/apps
- UI components in `js-packages/ui` include component tests
