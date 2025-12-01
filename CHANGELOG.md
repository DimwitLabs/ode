# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2025-12-01

### Fixed

- Responsive horizontal margins now scale smoothly across existing intermediate breakpoints (xl, lg) to prevent excessively large margins on tablets and narrow desktop windows. ([#3](https://github.com/DeepanshKhurana/ode/issues/3))

## [1.2.1] - 2025-12-01

### Changed

- Updated [README.md](https://github.com/DeepanshKhurana/ode/blob/main/README.md)'s intro text to better answer "what is it?" first.

## [1.2.0] - 2025-12-01

### Added

- Dynamic theme engine with 10 built-in presets (`almanac`, `blueprint`, `comic`, `doodle`, `exploit`, `journal` (default), `manuscript`, `recipe`, `screenplay`, `sketch`).
- Theme configuration via `ui.theme.preset`, `ui.theme.overrides`, and `ui.theme.defaultMode` in `config.yaml` (fully backwards compatible; not having the sections does not break anything).
- Support for local font files with automatic format detection.
- Font scaling system with proportional sizing using `--font-scale` CSS variable.
- Comprehensive theming documentation in [THEMING.md](https://github.com/DeepanshKhurana/ode/blob/main/THEMING.md) with screenshots of all presets.
- Theme presets automatically register from `src/assets/themes/` directory.
- New [ETHOS.md](https://github.com/DeepanshKhurana/ode/blob/main/ETHOS.md) documenting core principles and philosophy.

## [1.1.2] - 2025-11-26

### Added

- Defaults are now initialised if the public directory is empty or has any files missing from the required structure. Helpful links will directly appear on the UI and the app will not break. 
- A build badge is added to the README to ensure Docker image status is always easy to find.
- New `pages.notFound` config option to specify a custom 404 page (defaults to `obscured`).
- Exclusions in `exclude.pages` and `exclude.pieces` now accept slugs without `.md` extension.

## [1.1.1] - 2025-11-26

### Added

- New `config.yaml` parameter to control Body of Work order. If your config does not have the parameter and you update the app, it will default to `descending`.

## [1.1.0] - 2025-11-26

### Added

- Major (breaking) change since the app now moves to a `docker-compose.yaml` setup fundamentally changing how to write content in it. `README.md` will have more context but you can now mount directories for content (`pieces` and `pages`) while using the public image to constantly rebuild the site on push or update. You are free to set this up yourself. `config.yaml`, `intro.md`, and `favicon.ico` can also be mounted.
- Documentation for setting up a content repository and automation is now also available in [WRITING.md](https://github.com/DeepanshKhurana/ode/blob/main/WRITING.md).

## [1.0.3] - 2025-11-26

### Added

- Feature: New `config.yaml` parameter will let you configure number of RSS feed items

## [1.0.2] - 2025-11-25

### Added

- Feature: Gestures! The Reader mode now supports trackpad swipe and mobile swipe gestures.

## [1.0.1] - 2025-11-24

### Added

- Feature: Added sitemap generation script at the build process.

### Changed

- Fix: Fixed an issue where URLs with / in the end would not strip to valid URLs.

## [1.0.0] - 2025-11-23

### Added

- Initial public release of Ode.
- Markdown-based content system for pieces and pages.
- Reader mode with keyboard navigation.
- Dark/Light mode with automatic theme switching.
- RSS feed generation for all pieces.
- Chronological "Body of Work" archive.
- Random piece discovery feature.
- Fully configurable site metadata and UI labels via `config.yaml`.
- Build-time generation for optimal performance.
- MIT License.