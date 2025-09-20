// src/components/SearchInput.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchInput = void 0;
var index_1 = require("@/components/index");
var next_intl_1 = require("next-intl");
var SearchInput = function (_a) {
    var value = _a.value, onChange = _a.onChange, placeholder = _a.placeholder, _b = _a.visible, visible = _b === void 0 ? true : _b;
    var t = (0, next_intl_1.useTranslations)("Components.SearchInput");
    return (<index_1.Input type="search" value={value} onChange={function (e) { return onChange(e.target.value.replace(/\s+/g, " ")); }} placeholder={placeholder || t("search_placeholder")} aria-label={t("search_placeholder")} className={visible ? "flex mt-1.5" : "hidden xl:flex"}/>);
};
exports.SearchInput = SearchInput;
