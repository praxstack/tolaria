# ADR-0115: Expo Native Module Boundary for Mobile Git

Date: 2026-05-05

## Status

Accepted

## Context

Tolaria mobile needs a real Git implementation inside the iOS and later Android app. The JavaScript UI already has app-local vault storage, Git credential state, GitHub OAuth, and a `MobileGitTransport` contract, but pull/push cannot be implemented safely in JavaScript alone.

The mobile strategy keeps over-the-air JavaScript updates important, but native dependencies still require development-client, TestFlight, or App Store builds. Git is one of those native capabilities: the JavaScript layer should expose a narrow, stable boundary while native code handles repository operations and credentials.

Expo SDK 55 provides `expo-modules-core` and `requireOptionalNativeModule`, which lets JavaScript discover a native module when it exists and degrade cleanly when running in Expo Go or a build that does not contain the module.

## Decision

Use an Expo native module named `TolariaGit` as the JavaScript-facing native Git boundary.

The JavaScript app imports `expo-modules-core` directly and resolves `TolariaGit` through `requireOptionalNativeModule`. `createNativeMobileGitTransport` binds to the module when it exposes both `pull` and `push`; otherwise it returns the explicit unavailable-module failure already used by the sync UI.

The native request stays narrow: vault id, app-managed vault directory name, remote URL, remote host, and required auth strategy. Credentials remain behind SecureStore/OAuth/native Git credential callbacks; remote URLs must not contain tokens.

## Consequences

- Expo Go remains useful for UI/editor work, but Git transport requires a development-client or production build that includes `TolariaGit`.
- OTA updates can change JavaScript sync planning, UI, retry behavior, and request shaping, but native Git implementation changes require a binary update.
- The future iOS module can use Rust/libgit2 or Swift/libgit2 behind the same TypeScript contract.
- Android can later implement the same `TolariaGit` module name and request/result shape.
- Unit tests can validate module discovery and transport normalization without native build output.
