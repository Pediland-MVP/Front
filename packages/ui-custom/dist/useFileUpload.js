"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileUpload = void 0;
var logger_1 = require("@/utils/logger");
var react_1 = require("react");
var useFileUpload = function (_a) {
    var setValue = _a.setValue, getValues = _a.getValues, fieldName = _a.fieldName, uploadUrl = _a.uploadUrl, _b = _a.uploadMethod, uploadMethod = _b === void 0 ? 'POST' : _b, _c = _a.fileFieldName, fileFieldName = _c === void 0 ? 'file' : _c;
    var _d = (0, react_1.useState)([]), files = _d[0], setFiles = _d[1];
    var uploadFile = (0, react_1.useCallback)(function (file) { return __awaiter(void 0, void 0, void 0, function () {
        var formData, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append(fileFieldName, file);
                    return [4 /*yield*/, fetch(uploadUrl, {
                            method: uploadMethod,
                            body: formData,
                            credentials: 'include'
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
            }
        });
    }); }, [uploadUrl, uploadMethod, fileFieldName]);
    var addFiles = (0, react_1.useCallback)(function (newFiles) { return __awaiter(void 0, void 0, void 0, function () {
        var fileArray, newFilesWithPreview, uploadedFiles, currentValue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fileArray = Array.from(newFiles);
                    newFilesWithPreview = fileArray.map(function (file) { return Object.assign(file, {
                        preview: URL.createObjectURL(file)
                    }); });
                    setFiles(function (prevFiles) { return __spreadArray(__spreadArray([], prevFiles, true), newFilesWithPreview, true); });
                    return [4 /*yield*/, Promise.all(fileArray.map(uploadFile))];
                case 1:
                    uploadedFiles = _a.sent();
                    currentValue = getValues(fieldName) || [];
                    logger_1.default.log(fieldName, __spreadArray(__spreadArray([], currentValue, true), uploadedFiles, true));
                    setValue(fieldName, __spreadArray(__spreadArray([], currentValue, true), uploadedFiles, true));
                    return [2 /*return*/];
            }
        });
    }); }, [uploadFile, setValue, getValues, fieldName]);
    var removeFile = (0, react_1.useCallback)(function (index) {
        setFiles(function (prevFiles) {
            var newFiles = __spreadArray([], prevFiles, true);
            var removedFile = newFiles.splice(index, 1)[0];
            if ('preview' in removedFile) {
                URL.revokeObjectURL(removedFile.preview);
            }
            return newFiles;
        });
        var currentValue = getValues(fieldName) || [];
        setValue(fieldName, currentValue.filter(function (_, i) { return i !== index; }));
    }, [setValue, getValues, fieldName]);
    var setDefaultFiles = (0, react_1.useCallback)(function (defaultFiles) {
        setFiles(defaultFiles);
        setValue(fieldName, defaultFiles);
    }, [setValue, fieldName]);
    return { files: files, addFiles: addFiles, removeFile: removeFile, setDefaultFiles: setDefaultFiles };
};
exports.useFileUpload = useFileUpload;
