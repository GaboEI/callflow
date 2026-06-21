# Changelog

This file summarizes the public-facing state of the project. The full historical changelog remains in `docs/04_changelog.md`.

## v0.2.0-beta.1

### Added

- Beta-stage public repository status and README wording.
- Windows validation note and beta release notes for recruiter-facing review.
- Controlled local-data reset action in Settings > Maintenance & diagnostics.

### Changed

- Version bumped to `0.2.0-beta.1` across the repo.
- README, badges, and project status now describe CallFlow as a beta-stage Windows desktop app.
- Documentation now distinguishes current beta status from the earlier alpha validation history.
- Legal acceptance is now explicit in the onboarding flow, with persisted acceptance metadata visible in About.
- Onboarding statistics timezone options now follow the active timezone set used in Settings.

### Fixed

- Formalized the public status so the repo no longer reads like an early prototype.
- The onboarding legal gate now shows clear feedback before acceptance.
- The local data reset path clears the app's userData store and restarts CallFlow cleanly.

### Known limitations

- AI Chat remains a placeholder.
- Legal drafts still need final review before public distribution.
- Some UX and release polish continue to be refined during beta testing.

## v0.1.16-alpha

### Added

- GitHub Actions CI workflow.
- Dependabot npm update configuration.
- Security policy.
- Recruiter-facing case study.
- Windows QA results template.
- Alpha release notes draft.
- README badges and portfolio links.

### Changed

- README presentation improved for recruiter and portfolio review.
- Legal references aligned with Apache 2.0.
- Documentation structure improved for product, QA, release, and repository setup.

### Fixed

- Removed license-selection ambiguity from the legal drafts.
- Clarified unfinished product surfaces as unfinished.

### Known limitations

- AI Chat remains a placeholder.
- Windows installer QA is still pending.
- No public installer artifact has been released yet.
- Legal drafts still need final review before public distribution.

## Internal history

See `docs/04_changelog.md` for the full internal change history.
