# Changesets

This directory is used by [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## Workflow

1. **Add a changeset** when you make a notable change:
   ```bash
   npx changeset
   ```
   Select the package, bump type (patch/minor/major), and write a summary.

2. **Version and update changelog** before a release:
   ```bash
   npx changeset version
   ```
   This bumps `package.json` version and updates `CHANGELOG.md`.

3. **Publish** (when ready for npm):
   ```bash
   npx changeset publish
   ```
