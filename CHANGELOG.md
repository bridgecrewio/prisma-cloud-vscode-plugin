# Change Log

All notable changes to the "checkov-vscode-v2" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.14] - 2024-05-27

### Added

- Implement new extension configurations.
- Enhance error logging.
- Enhance management of extension configurations.

### Fixed

- Suppressing SCA vulnerabilities on Windows was not functioning.

## [1.0.15] - 2024-06-20

### Added

- Show SAST Weaknesses only in case the customer is supporting this module, and it's running on Mac.
- Split authentication into it's own service

### Fixed

- Fixing a bug where clicking on some of the found issues doesn't open the detail sections