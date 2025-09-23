module.exports = {

"[externals]/next/dist/compiled/next-server/app-page.runtime.dev.js [external] (next/dist/compiled/next-server/app-page.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/apps/Site/providers/PageViewReporter.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>PageViewReporter)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
function PageViewReporter() {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!pathname) return;
        const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
        // GA4 recommended page_view event
        // @ts-ignore
        window.gtag?.("event", "page_view", {
            page_location: window.location.origin + url,
            page_path: pathname
        });
    }, [
        pathname,
        searchParams
    ]);
    return null;
}
}}),
"[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "cn": (()=>cn)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$3$2e$3$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/tailwind-merge@3.3.1/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$3$2e$3$2e$1$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}}),
"[project]/packages/lib/src/index.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @file Automatically generated by barrelsby.
 */ __turbopack_context__.s({});
;
}}),
"[project]/packages/lib/src/index.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$lib$2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/lib/src/index.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/packages/lib/index.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
}}),
"[project]/packages/lib/index.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$lib$2f$src$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/packages/lib/src/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$lib$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/lib/index.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/apps/Site/components/Home/HomeFeatures.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "HomeFeatures": (()=>HomeFeatures)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$lib$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/packages/lib/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/ui/src/lib/utils.ts [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@befroosh/ui'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Barcode$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/Barcode.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$BellRinging$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/BellRinging.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Cardholder$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/Cardholder.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Chats$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/Chats.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$ChatText$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/ChatText.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$ListStar$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/ListStar.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Package$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/Package.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Plant$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/Plant.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Television$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/Television.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/ssr/Users.es.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
const ICONS = {
    chats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Chats$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ChatsIcon"],
    chat: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$ChatText$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ChatTextIcon"],
    barcode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Barcode$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BarcodeIcon"],
    package: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Package$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PackageIcon"],
    users: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UsersIcon"],
    bell: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$BellRinging$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BellRingingIcon"],
    pay: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Cardholder$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardholderIcon"],
    live: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Television$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TelevisionIcon"],
    form: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$ListStar$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ListStarIcon"],
    plant: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Plant$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlantIcon"]
};
const COLOR_STYLES = {
    cyan: {
        text: "text-cyan-600",
        bg: "bg-cyan-500",
        bgFrom: "from-cyan-300/70",
        bgTo: "to-cyan-900"
    },
    sky: {
        text: "text-sky-600",
        bg: "bg-sky-500",
        bgFrom: "from-sky-300/70",
        bgTo: "to-sky-900"
    },
    blue: {
        text: "text-blue-600",
        bg: "bg-blue-500",
        bgFrom: "from-blue-300/70",
        bgTo: "to-blue-900"
    },
    indigo: {
        text: "text-indigo-600",
        bg: "bg-indigo-500",
        bgFrom: "from-indigo-300/70",
        bgTo: "to-indigo-900"
    },
    violet: {
        text: "text-violet-600",
        bg: "bg-violet-500",
        bgFrom: "from-violet-300/70",
        bgTo: "to-violet-900"
    },
    purple: {
        text: "text-purple-600",
        bg: "bg-purple-500",
        bgFrom: "from-purple-300/70",
        bgTo: "to-purple-900"
    },
    fuchsia: {
        text: "text-fuchsia-600",
        bg: "bg-fuchsia-500",
        bgFrom: "from-fuchsia-300/70",
        bgTo: "to-fuchsia-900"
    },
    pink: {
        text: "text-pink-600",
        bg: "bg-pink-500",
        bgFrom: "from-pink-300/70",
        bgTo: "to-pink-900"
    },
    rose: {
        text: "text-rose-600",
        bg: "bg-rose-500",
        bgFrom: "from-rose-300/70",
        bgTo: "to-rose-900"
    }
};
const HomeFeatures = ()=>{
    const [activeFeature, setActiveFeature] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1); // Default to first feature
    const [carouselApi, setCarouselApi] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const features = [
        {
            id: 1,
            title: "دایرکت هوشمند",
            icon: "chats",
            color: "cyan",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 2,
            title: "کامنت هوشمند",
            icon: "chat",
            color: "sky",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 3,
            title: "سفارش خودکار",
            icon: "barcode",
            color: "blue",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 4,
            title: "ثبت پستی سریع",
            icon: "package",
            color: "indigo",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 5,
            title: "مدیریت مشتریان",
            icon: "users",
            color: "violet",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 6,
            title: "یادآوری خودکار",
            icon: "bell",
            color: "purple",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 7,
            title: "پرداخت متنوع",
            icon: "pay",
            color: "fuchsia",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 8,
            title: "فروش زنده",
            icon: "live",
            color: "pink",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        },
        {
            id: 9,
            title: "فرم اختصاصی",
            icon: "form",
            color: "rose",
            image: "sample-feat.png",
            description: "هیچ پیامی بی‌جواب نمی‌ماند. پاسخ‌ها سریع، دقیق و خودکار ارسال می‌شوند."
        }
    ];
    // Sync active feature with carousel selection (arrows/swipe)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!carouselApi) return;
        const onSelect = ()=>{
            try {
                const index = carouselApi.selectedScrollSnap?.() ?? 0;
                const f = features[index];
                if (f && f.id !== activeFeature) setActiveFeature(f.id);
            } catch  {}
        };
        onSelect();
        carouselApi.on?.("select", onSelect);
        carouselApi.on?.("reInit", onSelect);
        return ()=>{
            carouselApi.off?.("select", onSelect);
            carouselApi.off?.("reInit", onSelect);
        };
    }, [
        carouselApi,
        activeFeature
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "_home-features bg-gradient-to-l from-blue-500 to-violet-600 py-10",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container max-w-5xl px-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "mb-10 text-center text-2xl font-medium text-white",
                            children: "امکاناتی که کار شما را ساده‌تر و فروشتان را بیشتر می‌کند."
                        }, void 0, false, {
                            fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                            lineNumber: 224,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-3 gap-x-3 gap-y-5 md:grid-cols-9",
                            children: features.map((feature, index)=>{
                                const Icon = ICONS[feature.icon] ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Plant$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlantIcon"];
                                const styles = COLOR_STYLES[feature.color] ?? COLOR_STYLES.violet;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("_item flex cursor-pointer flex-col items-center space-y-2 transition-all duration-300", styles.text, activeFeature === feature.id ? "scale-110" : "opacity-70 hover:scale-105 hover:opacity-100"),
                                    onClick: ()=>{
                                        setActiveFeature(feature.id);
                                        const targetIndex = features.findIndex((f)=>f.id === feature.id);
                                        if (targetIndex >= 0) {
                                            carouselApi?.scrollTo?.(targetIndex);
                                        }
                                    },
                                    role: "button",
                                    tabIndex: 0,
                                    onKeyDown: (e)=>{
                                        if (e.key === "Enter") {
                                            setActiveFeature(feature.id);
                                            const targetIndex = features.findIndex((f)=>f.id === feature.id);
                                            if (targetIndex >= 0) {
                                                carouselApi?.scrollTo?.(targetIndex);
                                            }
                                        }
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "_icon flex size-14 items-center justify-center rounded-full bg-white",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                className: "size-7",
                                                weight: "duotone"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                                lineNumber: 267,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                            lineNumber: 266,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "_title text-[13px] font-semibold text-white",
                                            children: feature.title
                                        }, void 0, false, {
                                            fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                            lineNumber: 269,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, index, true, {
                                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                    lineNumber: 234,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                            lineNumber: 228,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                    lineNumber: 223,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                lineNumber: 222,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Carousel, {
                    className: "w-full",
                    opts: {
                        direction: "rtl",
                        loop: true,
                        watchSlides: true
                    },
                    setApi: setCarouselApi,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CarouselContent, {
                        children: features.map((feature)=>{
                            const Icon = ICONS[feature.icon] ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$ssr$2f$Plant$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlantIcon"];
                            const styles = COLOR_STYLES[feature.color] ?? COLOR_STYLES.violet;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CarouselItem, {
                                className: "mx-auto max-w-[300px]",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-1",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Card, {
                                        className: "overflow-hidden border-none",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CardContent, {
                                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col items-center justify-center p-0 duration-300", activeFeature === feature.id ? "" : "blur-xs"),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex w-full justify-center rounded-t-xl rounded-br-3xl bg-gradient-to-t pb-5", styles.bgFrom, styles.bgTo),
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        src: `/images/features/${feature.image}`,
                                                        alt: feature.title,
                                                        width: 160,
                                                        height: 240
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                                        lineNumber: 313,
                                                        columnNumber: 27
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                                    lineNumber: 306,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$ui$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("px-5 pt-4 pb-6", styles.text),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            className: "mb-1 flex items-center gap-2 text-lg font-bold",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                    className: "size-7",
                                                                    weight: "duotone"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                                                    lineNumber: 322,
                                                                    columnNumber: 29
                                                                }, this),
                                                                feature.title
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                                            lineNumber: 321,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm",
                                                            children: feature.description
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                                            lineNumber: 325,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                                    lineNumber: 320,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                            lineNumber: 300,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                        lineNumber: 299,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                    lineNumber: 298,
                                    columnNumber: 19
                                }, this)
                            }, feature.id, false, {
                                fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                                lineNumber: 294,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                        lineNumber: 288,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                    lineNumber: 279,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                lineNumber: 278,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8 flex justify-center px-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Button, {
                    asChild: true,
                    className: "w-full md:w-auto",
                    variant: "outline",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "https://console.befroosh.app",
                        children: "فعالسازی رایگان"
                    }, void 0, false, {
                        fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                        lineNumber: 339,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                    lineNumber: 338,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
                lineNumber: 337,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/Site/components/Home/HomeFeatures.tsx",
        lineNumber: 221,
        columnNumber: 5
    }, this);
};
}}),
"[project]/apps/Site/components/Home/HomePricing.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "HomePricing": (()=>HomePricing)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$intl$40$4$2e$3$2e$9_next$40$15$2e$2$2e$2_7c59a37c71a7da096bd34ef6f46b5c88$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-intl@4.3.9_next@15.2.2_7c59a37c71a7da096bd34ef6f46b5c88/node_modules/next-intl/dist/esm/development/react-client/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@befroosh/ui'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$FlowerTulip$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/csr/FlowerTulip.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Package$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/csr/Package.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Plant$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/csr/Plant.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Sun$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/csr/Sun.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$TreeEvergreen$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@phosphor-icons+react@2.1.1_dd4c3d434c7421dc2e70674c4a5049f9/node_modules/@phosphor-icons/react/dist/csr/TreeEvergreen.es.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const ICONS = {
    plant: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Plant$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlantIcon"],
    "flower-tulip": __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$FlowerTulip$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FlowerTulipIcon"],
    "tree-evergreen": __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$TreeEvergreen$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TreeEvergreenIcon"],
    sun: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Sun$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SunIcon"],
    package: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Package$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PackageIcon"]
};
const HomePricing = ({ btnColors = [
    "bg-violet-500",
    "bg-violet-600",
    "bg-violet-700",
    "bg-violet-800"
], iconColors = [
    "text-lime-500",
    "text-rose-400",
    "text-green-700",
    "text-amber-400"
] })=>{
    const pricingItems = [
        {
            icon: "plant",
            title: "کمتر از 25K",
            price: "198"
        },
        {
            icon: "flower-tulip",
            title: "25K تا 100K",
            price: "298"
        },
        {
            icon: "tree-evergreen",
            title: "100K تا 500K",
            price: "398"
        },
        {
            icon: "sun",
            title: "بیشتر از 500K",
            price: "498"
        }
    ];
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$intl$40$4$2e$3$2e$9_next$40$15$2e$2$2e$2_7c59a37c71a7da096bd34ef6f46b5c88$2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["useTranslations"])("Components.Home.HomePricing");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `_home-pricing bg-gradient-to-t from-white to-gray-200/70 py-14`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container max-w-5xl px-7",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-gradient mb-7 text-center text-2xl font-bold",
                    children: t("title")
                }, void 0, false, {
                    fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                    lineNumber: 58,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-10 md:flex-row md:justify-between md:gap-4",
                    children: pricingItems.map((it, i)=>{
                        const btnColorClass = btnColors[i % btnColors.length];
                        const iconColorClass = iconColors[i % iconColors.length];
                        const Icon = ICONS[it.icon] ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$phosphor$2d$icons$2b$react$40$2$2e$1$2e$1_dd4c3d434c7421dc2e70674c4a5049f9$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Package$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PackageIcon"];
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "_item flex-wrap rounded-xl border-2 bg-white px-6 pb-8 pt-10 md:px-5 md:pt-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-x-6 md:flex-col md:gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                            size: 50,
                                            weight: "thin",
                                            className: iconColorClass,
                                            "aria-hidden": true
                                        }, void 0, false, {
                                            fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                            lineNumber: 74,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-1 text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-lg font-medium",
                                                    children: [
                                                        t("page"),
                                                        " ",
                                                        it.title,
                                                        " ",
                                                        t("followers")
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                                    lineNumber: 81,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-lg font-bold text-violet-600",
                                                    children: [
                                                        it.price,
                                                        " ",
                                                        t("tomans")
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                                    lineNumber: 84,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                            lineNumber: 80,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                    lineNumber: 73,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "-mb-12 mt-6",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Button, {
                                        asChild: true,
                                        className: `btn ${btnColorClass} inline-flex w-full items-center justify-center`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            href: "https://console.befroosh.app",
                                            children: t("button")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                            lineNumber: 95,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                        lineNumber: 91,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                                    lineNumber: 90,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, `${it.title}-${i}`, true, {
                            fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                            lineNumber: 69,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
                    lineNumber: 62,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
            lineNumber: 57,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/Site/components/Home/HomePricing.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
};
}}),

};

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__2bb256fc._.js.map