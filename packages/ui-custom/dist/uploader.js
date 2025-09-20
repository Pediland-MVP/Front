"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ssr_1 = require("@phosphor-icons/react/dist/ssr");
var react_1 = require("react");
var FileUploader = function () {
    var _a = (0, react_1.useState)(""), fileName = _a[0], setFileName = _a[1];
    var handleFileChange = function (event) {
        var _a;
        var file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0]; // بررسی وجود فایل
        if (file) {
            setFileName(file.name); // ذخیره نام فایل در state
        }
        else {
            setFileName(""); // اگر فایل انتخاب نشد
        }
    };
    return (<div className="flex flex-col items-center justify-center border border-dashed border-gray-200 h-36 w-full rounded-md hover:bg-sky-50/50 duration-300 hover:border-sky-200 group">
            <label htmlFor="picture" className="flex flex-col items-center justify-center cursor-pointer w-full h-full rounded-md">
                {fileName ? (<p className="text-sm text-center text-gray-500">فایل انتخاب شده: <span className="font-medium">{fileName}</span><br /><span className="text-xs font-light">جهت تغییر فایل دوباره اینجا کلیک کنید.</span></p>) : (<ssr_1.UploadSimple size={36} className="text-gray-400 group-hover:text-blue-300 duration-300" weight="light"/>)}
            </label>
            <input id="picture" type="file" className="hidden" onChange={handleFileChange}/>
        </div>);
};
exports.default = FileUploader;
