"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchToggleButton = void 0;
var index_1 = require("@/components/index");
var SearchToggleButton = function (_a) {
    var setIsSearchVisible = _a.setIsSearchVisible, isSearchVisible = _a.isSearchVisible;
    return (<index_1.Button className="md:hidden" type="button" variant="link" size="icon" onClick={function () { return setIsSearchVisible(function (prev) { return !prev; }); }} aria-label={"toggle_search"}>
      {isSearchVisible ? (<index_1.XCircleIcon className="size-7 text-gray-400 xl:hidden"/>) : (<index_1.ListMagnifyingGlassIcon className="text-foreground size-8 xl:hidden"/>)}
    </index_1.Button>);
};
exports.SearchToggleButton = SearchToggleButton;
