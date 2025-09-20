"use client";
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
Object.defineProperty(exports, "__esModule", { value: true });
//From https://github.com/kushagrasarathe/image-upload-shadcn/blob/main/src/components/image-upload.tsx
var react_1 = require("react");
var react_dropzone_1 = require("react-dropzone");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var image_1 = require("next/image");
var link_1 = require("next/link");
var radial_progress_1 = require("@/components/ui-custom/radial.progress");
var axios_1 = require("axios");
var ssr_1 = require("@phosphor-icons/react/dist/ssr");
var ImageUpload = function (_a) {
    var onUploadComplete = _a.onUploadComplete;
    var _b = (0, react_1.useState)(false), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(0), progress = _c[0], setProgress = _c[1];
    var _d = (0, react_1.useState)(null), selectedImage = _d[0], setSelectedImage = _d[1];
    var _e = (0, react_1.useState)(null), uploadedImagePath = _e[0], setUploadedImagePath = _e[1];
    var onUploadProgress = function (progressEvent) {
        if (progressEvent.total) {
            var percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentage);
        }
    };
    var handleImageChange = function (event) {
        var _a;
        if ((_a = event.target.files) === null || _a === void 0 ? void 0 : _a.length) {
            var image = event.target.files[0];
            setSelectedImage(image);
            handleImageUpload(image);
        }
    };
    var removeSelectedImage = function () {
        setLoading(false);
        setUploadedImagePath(null);
        setSelectedImage(null);
    };
    var handleImageUpload = function (image) { return __awaiter(void 0, void 0, void 0, function () {
        var formData, res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!image)
                        return [2 /*return*/];
                    setLoading(true);
                    formData = new FormData();
                    formData.append("file", image);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("formData, onUploadProgress")];
                case 2:
                    res = _a.sent();
                    if (res.status === 200) {
                        setLoading(false);
                        setUploadedImagePath(res.data.url);
                        if (onUploadComplete) {
                            onUploadComplete(res.data.url);
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    setLoading(false);
                    console.error("Error uploading image:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var onDrop = (0, react_1.useCallback)(function (acceptedFiles) { return __awaiter(void 0, void 0, void 0, function () {
        var image;
        return __generator(this, function (_a) {
            if (acceptedFiles.length > 0) {
                image = acceptedFiles[0];
                setSelectedImage(image);
                handleImageUpload(image);
            }
            return [2 /*return*/];
        });
    }); }, []);
    var _f = (0, react_dropzone_1.useDropzone)({ onDrop: onDrop }), getRootProps = _f.getRootProps, getInputProps = _f.getInputProps;
    return (<div className="space-y-3 h-full">
      <div {...getRootProps()} className="h-full">
        <label htmlFor="dropzone-file" className="relative flex flex-col items-center justify-center p-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 w-full visually-hidden-focusable h-full">
          {loading && (<div className="text-center max-w-md">
              <radial_progress_1.default progress={progress}/>
              <p className="text-sm font-semibold"></p>
              <p className="text-xs text-gray-400">
                Do not refresh or perform any other action while the picture is
                being uploaded
              </p>
            </div>)}

          {!loading && !uploadedImagePath && (<div className="text-center">
              <div className="border p-2 rounded-md max-w-min mx-auto">
                <ssr_1.UploadSimple size="1.6em"/>
              </div>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Drag an image</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-400">
                Select a image or drag here to upload directly
              </p>
            </div>)}

          {uploadedImagePath && !loading && (<div className="text-center space-y-2">
              <image_1.default width={1000} height={1000} src={uploadedImagePath} className="w-full object-contain max-h-16 opacity-70" alt="uploaded image"/>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Image Uploaded</p>
                <p className="text-xs text-gray-400">
                  Click here to upload another image
                </p>
              </div>
            </div>)}
        </label>

        <input_1.Input {...getInputProps()} id="dropzone-file" accept="image/png, image/jpeg" type="file" className="hidden" disabled={loading || uploadedImagePath !== null} onChange={handleImageChange}/>
      </div>

      {!!uploadedImagePath && (<div className="flex items-center justify-between">
          <link_1.default href={uploadedImagePath} className=" text-gray-500 text-xs hover:underline ">
            Click here to see uploaded image :D
          </link_1.default>

          <button_1.Button onClick={removeSelectedImage} type="button" variant="secondary">
            {uploadedImagePath ? "Remove" : "Close"}
          </button_1.Button>
        </div>)}
    </div>);
};
exports.default = ImageUpload;
