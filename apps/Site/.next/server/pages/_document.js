const CHUNK_PUBLIC_PATH = "server/pages/_document.js";
const runtime = require("../chunks/ssr/[turbopack]_runtime.js");
runtime.loadChunk("server/chunks/ssr/node_modules__pnpm_768c3627._.js");
runtime.loadChunk("server/chunks/ssr/[root of the server]__e237d7a2._.js");
runtime.getOrInstantiateRuntimeModule("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/document.js [ssr] (ecmascript)", CHUNK_PUBLIC_PATH);
module.exports = runtime.getOrInstantiateRuntimeModule("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/document.js [ssr] (ecmascript)", CHUNK_PUBLIC_PATH).exports;
