# Contributing to CallFlow

Thanks for helping improve CallFlow.

## What this repository is for

CallFlow is a local-first Electron desktop MVP for call-center work. Contributions should keep that scope intact unless the README and changelog are updated to reflect a deliberate product change.

## Before you open a PR

- Check that your change matches the current product state.
- Avoid documenting unfinished features as if they already shipped.
- Run the available validation scripts locally when possible.
- Keep screenshots and docs free from sensitive or personal data.
- Update the README, changelog, or legal notes if your change affects public-facing behavior.

## Suggested workflow

1. Create a branch.
2. Make a focused change.
3. Run `npm run check` and `npm test`.
4. Update docs if the user-facing behavior changed.
5. Open a pull request with a clear summary of what changed and what is still future work.

## Style

- Use the existing plain Electron + HTML/CSS/JavaScript architecture.
- Prefer small, reviewable commits.
- Keep the repo honest about what is implemented today.

## Questions

If something is unclear, open an issue or leave a note in the PR describing the tradeoff.
