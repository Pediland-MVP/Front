import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
  experimental: {
    // Next's built-in optimize list covers lucide-react but not Phosphor, whose
    // barrel re-exports ~3025 modules. Imports here are already deep per-icon
    // paths; this is the belt-and-braces guard against new barrel imports.
    optimizePackageImports: ['@phosphor-icons/react', '@befroosh/ui'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
