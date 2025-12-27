# Ode Documentation

This is the documentation site for **Ode**, built with [Docusaurus](https://docusaurus.io/).

## Overview

The documentation is programmatically linked to the root markdown files of the Ode project. This ensures that the documentation site is always in sync with the main repository without duplicating content.

## Local Development

```bash
npm install
npm start
```

This command starts a local development server. Most changes are reflected live.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory.

## Changes

Some changes are made to the default Docusaurus way of doing things.

- **Live Imports**: Root markdown files are inlined during the build process.
- **GitHub Alerts**: GitHub-style admonitions (`> [!NOTE]`) are automatically converted to Docusaurus callouts.
- **Image Resolution**: Images in `.github/media/` are automatically resolved and made clickable.
- **Search**: Local search is powered by `@easyops-cn/docusaurus-search-local`.
