// Test-only stand-in for `next/link`. Same rationale as next-image.tsx: packages/ui isn't
// a Next.js app and doesn't depend on `next`, but some Contents-tree components (e.g.
// ContentPromotionDialog) are only ever consumed from within a Next.js app. This alias
// (see vitest.config.ts) gives it a resolvable, good-enough stand-in for tests.
import React from 'react';

const NextLinkStub = ({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
  <a href={href} {...rest}>
    {children}
  </a>
);

export default NextLinkStub;

// Real `next/link` also exports `useLinkStatus` (a hook that reports prefetch/navigation
// pending state). Components that call it unconditionally (e.g. NavMain's NavItemIcon)
// need this stub to export something callable too, or the hook call throws under test.
// This stand-in never enters a pending state.
export const useLinkStatus = () => ({ pending: false });
