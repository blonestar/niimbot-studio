# Releasing

Releases are built by GitHub Actions for Windows, macOS and Linux and published as GitHub Releases. The installed app checks
GitHub Releases for new versions and updates itself.

## Make a release

1. Bump the version. This edits `package.json`, commits, and creates the tag:

   ```sh
   npm version patch        # 0.1.0 -> 0.1.1
   npm version minor        # 0.1.0 -> 0.2.0
   npm version prerelease --preid beta   # 0.2.0 -> 0.2.1-beta.0
   ```

2. Push the commit and the tag:

   ```sh
   git push --follow-tags
   ```

3. Wait for the **Release** workflow. It builds the Windows and Linux installers and uploads them
   to a **draft** release.
4. Open the draft on GitHub, write the release notes, and publish it. For a beta version, select
   **Set as a pre-release**.

The app sees a release only after you publish it. Beta versions reach only users who turned on
**Also get test (beta) versions** in Settings.

## What is built

| Platform | Files | Updates itself |
| --- | --- | --- |
| Windows | `Niimbot-Studio-Setup-<version>.exe` | Yes |
| Linux | `.AppImage`, `.deb`, `.rpm` | Yes (`.deb` and `.rpm` ask for the administrator password) |
| macOS | `.dmg` and `.zip` for Apple Silicon (arm64) and Intel (x64) | No. The app is not signed with an Apple Developer ID, so it shows a download link for new versions |

## Build locally

```sh
npm run dist     # installers for the current OS in dist/, nothing is uploaded
```

## Notes

- The workflow fails when the tag does not match the version in `package.json`.
- Windows installers are not code-signed. Windows SmartScreen shows a warning on the first install.
  Updates still work.
- The update source is set in `electron-builder.yml` (`publish`). The repository must be public so
  that the app can read releases without a token.

## Test build without releasing

Run **Actions → Release → Run workflow**. The installers are attached to the run as artifacts for
seven days, and nothing is published.
