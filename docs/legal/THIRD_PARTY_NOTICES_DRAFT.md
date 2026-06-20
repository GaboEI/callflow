# CallFlow third-party notices draft

Status: editable draft.

CallFlow currently packages Electron and selected frontend libraries. Third-party license notices should be reviewed before a public Windows installer is released.

Known direct dependencies from `package.json`:

- Electron
- electron-builder
- DOMPurify
- EasyMDE

Packaging currently includes:

- `node_modules/easymde/LICENSE`
- `node_modules/dompurify/LICENSE`

Before release:

1. Generate or review a complete dependency license report.
2. Confirm that all required license files are included in the packaged app or installer.
3. Add this notice to the About/Legal area or installer resources if needed.
4. Confirm final repository license compatibility with dependencies.

