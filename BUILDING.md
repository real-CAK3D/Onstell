# Building Onstell

Onstell is not yet a complete native app. The current repo contains the first UI prototype and release planning files.

## Prototype

Open:

```text
prototype/onstell-widget.html
```

No build step is required for the prototype.

## Planned Native Stack

The intended app shape is:

```text
apps/desktop/        Tauri desktop app
crates/              Rust protocol, input, discovery, and platform crates
packages/            Shared TypeScript packages
scripts/             Install and release helper scripts
```

## Required Tooling Later

Once the native app scaffold is added:

- Node.js LTS
- Rust stable
- Tauri prerequisites for each operating system
- Platform SDKs for signing and packaging

## Release Builds

Release builds should be produced by GitHub Actions from version tags. Local builds are for development only until signing and checksums are wired in.

