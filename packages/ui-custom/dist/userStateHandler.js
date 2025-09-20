"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserStateHandler;
// components/UserStateHandler.tsx
var useUser_1 = require("@/hooks/useUser");
function UserStateHandler(_a) {
    var children = _a.children, _b = _a.loadingComponent, loadingComponent = _b === void 0 ? <div>Loading...</div> : _b, _c = _a.errorComponent, errorComponent = _c === void 0 ? <div>Error loading user data</div> : _c;
    var _d = (0, useUser_1.default)(), hasSubscription = _d.hasSubscription, hasInstagram = _d.hasInstagram, isLoading = _d.isLoading, error = _d.error;
    if (isLoading)
        return <>{loadingComponent}</>;
    if (error)
        return <>{errorComponent}</>;
    return <>{children({ hasSubscription: hasSubscription, hasInstagram: hasInstagram })}</>;
}
