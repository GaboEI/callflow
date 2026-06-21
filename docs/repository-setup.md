# Repository setup notes

This page records GitHub-side setup that cannot be guaranteed purely from the source tree.

## Recommended manual checks

- Confirm GitHub Actions are enabled for the repository.
- Confirm the `main` branch can run the CI workflow on push and pull request events.
- Confirm Dependabot updates are allowed to open npm update pull requests.
- Add branch protection so `npm run validate` is required before merges if you want merge gating.
- Enable Code scanning / CodeQL in GitHub Security after the workflow runs.
- Publish releases only after the Windows installer has actually been generated and tested.

## Current state

- Repository description updated for the portfolio use case.
- Apache 2.0 is the root license.
- CI, Dependabot, security, QA, and release documentation are now committed in the tree.
- Manual GitHub-side settings are still pending confirmation in the web UI.
