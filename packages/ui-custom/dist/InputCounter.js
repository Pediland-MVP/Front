"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputCounter = void 0;
var utils_1 = require("@befroosh/lib/utils");
var InputCounter = function (_a) {
    var text = _a.text, _b = _a.placeholder, placeholder = _b === void 0 ? "Type your message here..." : _b, _c = _a.maxLength, maxLength = _c === void 0 ? 100 : _c, className = _a.className;
    var charCount = (text === null || text === void 0 ? void 0 : text.length) || 0;
    var progress = Math.min((charCount / maxLength) * 100, 100);
    var isOverLimit = charCount >= maxLength;
    // SVG circle properties
    var size = 25;
    var strokeWidth = 4;
    var radius = (size - strokeWidth) / 2;
    var circumference = radius * 2 * Math.PI;
    var offset = circumference - (progress / 100) * circumference;
    return (<div className="relative flex items-center gap-2">
      <div className="relative flex size-5 items-center justify-center">
        <svg width={size} height={size} viewBox={"0 0 ".concat(size, " ").concat(size)} className="rotate-[-90deg]">
          {/* Background circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted-foreground/20"/>
          {/* Progress circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={isOverLimit ? "text-orange-500" : "text-green-600"} style={{
            transition: "stroke-dashoffset 0.2s ease, stroke 0.2s ease",
        }}/>
        </svg>
      </div>

      <span className={(0, utils_1.cn)("flex text-xs leading-px font-medium", isOverLimit ? "text-orange-500" : "text-green-600")}>
        {charCount}/{maxLength} کاراکتر
      </span>
    </div>);
};
exports.InputCounter = InputCounter;
