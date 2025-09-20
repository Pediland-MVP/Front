"use strict";
// src/components/ui-custom/LoaderSpin.tsx
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ssr_1 = require("@phosphor-icons/react/dist/ssr");
var LoaderSpin = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<div className={"flex h-full w-full flex-1 flex-col items-center justify-center ".concat(className)}>
      <ssr_1.SpinnerGapIcon {...props} className={"text-secondary animate-spin ".concat(className)} size={28}/>
    </div>);
};
exports.default = LoaderSpin;
