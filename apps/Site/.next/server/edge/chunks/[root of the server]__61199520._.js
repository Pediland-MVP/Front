(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["chunks/[root of the server]__61199520._.js", {

"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[externals]/node:buffer [external] (node:buffer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}}),
"[project]/apps/Site/middleware.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "CustomResponse": (()=>CustomResponse),
    "config": (()=>config),
    "default": (()=>middleware)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.2.2_@babel+core@7.2_f5736dc6f3e8c9b0ec0c656c3858dc1f/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
async function middleware(request) {
    const currentRoute = request.nextUrl.pathname.split("/")[1];
    if (currentRoute === "en" || currentRoute === "fa") {
        const pathWithoutLocale = request.nextUrl.pathname.replace(`/${currentRoute}`, "");
        const response = CustomResponse.redirect(new URL(pathWithoutLocale ? pathWithoutLocale : "/", request.url), request);
        response.cookies.set("NEXT_LOCALE", currentRoute, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10)
        });
        return response;
    }
    // Check for shops that's are like this: /cvexor/0f7d0b72-fac4-4c52-a9af-0a0607bee542/order
    const splittedPathname = request.nextUrl.pathname.split("/");
    splittedPathname.shift();
    if (splittedPathname.length === 3 && splittedPathname.at(-1) === "order") {
        if (UUID_REGEX.test(splittedPathname[1])) {
            return CustomResponse.next(request);
        }
    }
    return consoleMiddleware(request);
}
async function consoleMiddleware(request) {
    const token = request.cookies.get("token2");
    if (!token) {
        return CustomResponse.redirect(new URL("/auth/signin", request.url), request);
    }
    return CustomResponse.next(request);
}
class CustomResponse {
    static redirect(url, request, init) {
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url, init);
        response.headers.set("next-pathname", request.nextUrl.pathname);
        return response;
    }
    static next(request, init) {
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$2$2e$2_$40$babel$2b$core$40$7$2e$2_f5736dc6f3e8c9b0ec0c656c3858dc1f$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next(init);
        response.headers.set("next-pathname", request.nextUrl.pathname);
        return response;
    }
}
const config = {
    matcher: [
        "/((?!api|payments/verify|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts).*)"
    ]
};
}}),
}]);

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__61199520._.js.map