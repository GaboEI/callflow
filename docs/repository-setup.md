# Repository setup notes

This page records GitHub-side setup that cannot be guaranteed purely from the source tree.

## Recommended manual checks

- Confirm GitHub Actions are enabled for the repository.
- Confirm the `main` branch can run the CI workflow on push and pull request events.
- Confirm Dependabot updates are allowed to open npm update pull requests.
- Add branch protection so `npm run validate` is required before merges if you want merge gating.
- Enable Code scanning / CodeQL in GitHub Security after the workflow runs.
- Publish releases only after the Windows installer has actually been generated and tested.
- If you want x86/ia32 release coverage, validate the additional Windows build scripts before advertising 32-bit support.

## Current state

- Repository description updated for the portfolio use case.
- Apache 2.0 is the root license.
- CI, Dependabot, security, QA, and release documentation are now committed in the tree.
- Windows packaging scripts exist for x64 production builds, plus experimental ia32 targets for validation.
- NSIS installer license text is provided by `docs/legal/WINDOWS_INSTALLER_EULA.txt` with beta-appropriate legal copy.
- GitHub-side settings confirmed via API:
  - Actions workflows are present and running successfully.
  - `main` branch protection is enabled with required checks.
  - Dependabot security updates are enabled.
  - Secret scanning and push protection are enabled.
  - Repository topics are set for product discovery.
- Remaining GitHub UI checks, if any, are only for visual confirmation of badges, Security/Quality panels, and repository presentation.
