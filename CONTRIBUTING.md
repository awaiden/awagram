# Contributing to awagram

Thank you for your interest in contributing to **awagram**!

## Local Setup

```bash
npm install
```

## Checks Before Opening a PR

Please make sure all checks pass locally:

```bash
npm run build
npm test
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
