# Pulse

Blog platform for YouTrack. Pulse turns the articles of one YouTrack project into a blog: root articles are blogs, their child articles are posts, and article comments are the discussion under each post.

- Documentation: https://youtrack.fans/pulse/
- Issues and feedback: https://github.com/youtrack-fans/pulse/issues
- Email: support@youtrack.fans

## Build

You need Node.js 24 LTS.

```sh
npm ci
npm run build
npm run pack
```

`npm run build` type-checks the app, builds the backend handlers and the widget into `dist/`, and validates the result with `youtrack-app app validate`. `npm run pack` zips `dist/` into `pulse.zip`, the archive you upload to YouTrack under Administration → Apps.

## Releases

Every release is built by the [Release workflow](.github/workflows/release.yml) from a `v<version>` tag of this repository. The workflow checks that the tag matches the version in `manifest.json` and `package.json`, runs the checks below, builds `pulse-<version>.zip` and attaches it with its SHA-256 to the [GitHub release](https://github.com/youtrack-fans/pulse/releases). The archive uploaded to JetBrains Marketplace is that file, unchanged.

Each archive carries a signed build provenance attestation. To confirm that an archive was built from this repository:

```sh
gh attestation verify pulse-1.0.0.zip --repo youtrack-fans/pulse
```

## Check

```sh
npm run lint
npm test
npm run test:bundle
```

## Upload to your own YouTrack

Copy `.env.example` to `.env`, set `YOUTRACK_HOST` and a permanent token with the "Low-level Admin Write" permission, then run `npm run update`.

## License

MIT, see [LICENSE](LICENSE).

Pulse is an independent project, not affiliated with or endorsed by JetBrains. YouTrack is a trademark of JetBrains s.r.o.
