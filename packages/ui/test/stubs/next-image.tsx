// Test-only stand-in for `next/image`. `packages/ui` isn't a Next.js app and doesn't (and
// shouldn't) depend on `next`, but some ui-custom components (e.g. MediaUploader) are only
// ever consumed from within a Next.js app, where the real `next/image` is resolved via that
// app's own dependency tree. Vitest here runs the package in isolation, so this alias (see
// vitest.config.ts) gives it a resolvable, good-enough stand-in.
import React from 'react';

const NextImageStub = (props: Record<string, unknown>) => <img {...props} />;

export default NextImageStub;
