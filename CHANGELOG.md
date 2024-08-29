# Change Log

## [1.0.19] - 2024-08-29

### Added

- Added the following data to Prisma Cloid analytics

    - Extension version
    - VS Code version
    - Operating system
    - Checkov version

### Fixed

- Fixed installation issues with pip when using externally managed python installation
- Fixed various crashes

## [1.0.16] - 2024-07-11

### Added

- Add support for proxy configuration on VScode

### Fixed

- Resolving a problem where missing an opening slash on Windows on Docker scan.

## [1.0.15] - 2024-06-20

### Added

- Show SAST Weaknesses only in case the customer is supporting this module, and it's running on Mac.
- Split authentication into it's own service

### Fixed

- Resolving a problem where clicking on some of the found issues doesn't open the detail sections
- Resolving a problem where scanning a single file through Windows does not initiate a scan.


## [1.0.14] - 2024-05-27

### Added

- Implement new extension configurations.
- Enhance error logging.
- Enhance management of extension configurations.

### Fixed

- Suppressing SCA vulnerabilities on Windows was not functioning.
