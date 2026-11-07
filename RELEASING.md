# Releasing

Releases are built by GitHub Actions for Windows, macOS and Linux and published as GitHub Releases. The installed app checks
GitHub Releases for new versions and updates itself.

## Make a release

`main` is protected: every change, the version bump included, goes through a pull request.

1. Bump the version on a branch and open a pull request:

   ```sh
   git switch -c release/0.1.1 main
   npm version patch --no-git-tag-version        # 0.1.0 -> 0.1.1 (or minor, or: prerelease --preid beta)
   git commit -am "Release 0.1.1"
   git push -u origin release/0.1.1
   gh pr create --fill
   ```

2. Merge the pull request after CI passes.
3. Tag the merged commit and push the tag:

   ```sh
   git switch main && git pull
   git tag -a v0.1.1 -m v0.1.1
   git push origin v0.1.1
   ```

4. Wait for the **Release** workflow. It builds the Windows, macOS and Linux installers and uploads
   them to a **draft** release.
5. Open the draft on GitHub, write the release notes, and publish it. For a beta version, select
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
