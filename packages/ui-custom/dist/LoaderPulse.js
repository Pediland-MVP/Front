"use strict";
// src/components/ui-custom/LoaderPulse.tsx
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoaderPulse = void 0;
var utils_1 = require("@befroosh/lib/utils");
var lucide_react_1 = require("lucide-react");
var LoaderPulse = function (_a) {
    var size = _a.size;
    return (<div className="flex items-center justify-center">
      <lucide_react_1.EllipsisIcon className={(0, utils_1.cn)("animate-pulse text-gray-500", size ? "size-".concat(size) : "size-4")}/>
    </div>);
};
exports.LoaderPulse = LoaderPulse;
