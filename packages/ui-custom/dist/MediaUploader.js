"use client";
"use strict";
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
exports.MediaUploader = void 0;
var button_1 = require("@/components/ui/button");
var ssr_1 = require("@phosphor-icons/react/dist/ssr");
var next_intl_1 = require("next-intl");
var react_1 = require("react");
var react_dropzone_1 = require("react-dropzone");
var image_1 = require("next/image");
var MediaUploader = function (_a) {
    var _b = _a.multiple, multiple = _b === void 0 ? false : _b, files = _a.files, setFiles = _a.setFiles, accept = _a.accept, onChange = _a.onChange;
    var _c = (0, react_1.useState)(false), isDragActive = _c[0], setIsDragActive = _c[1];
    var t = (0, next_intl_1.useTranslations)("Automations.Contents.Media.FileUploader");
    // Type guards and helpers
    var isNewFile = function (file) { return 'file' in file; };
    var isExistingFile = function (file) { return 'url' in file; };
    var getDisplayName = function (file) {
        var _a, _b;
        if (isNewFile(file))
            return file.file.name;
        if (isExistingFile(file)) {
            return (_b = (_a = file.originalName) !== null && _a !== void 0 ? _a : file.url.split('/').pop()) !== null && _b !== void 0 ? _b : t("uploaded_file");
        }
        return t("uploaded_file");
    };
    var isUploading = function (file) {
        if (isExistingFile(file))
            return false;
        if (isNewFile(file)) {
            if (file.process !== undefined)
                return file.process < 100;
            if (file.isUploading)
                return !!file.isUploading;
            return true; // new file without process yet
        }
        return false;
    };
    var getDisplaySize = function (file) {
        if (isNewFile(file)) {
            return "".concat((file.file.size / 1024 / 1024).toFixed(2), " ").concat(t("MB"));
        }
        if (isExistingFile(file)) {
            return t("uploaded");
        }
        return t("uploaded");
    };
    var getProgressText = function (file) {
        if (isExistingFile(file))
            return null; // Don't show progress for existing files
        if (isNewFile(file) && file.process !== undefined) {
            return "".concat(Math.round(file.process), "%");
        }
        return t("uploaded");
    };
    var onDrop = (0, react_1.useCallback)(function (acceptedFiles, rejectedFiles) {
        var newFiles = acceptedFiles.map(function (file) { return ({
            file: file,
            id: Math.floor(Math.random() * 1000000),
        }); });
        var updatedFiles = multiple ? __spreadArray(__spreadArray([], files, true), newFiles, true) : newFiles;
        setFiles(updatedFiles);
        onChange(updatedFiles, rejectedFiles);
    }, [files, multiple, onChange, setFiles]);
    var _d = (0, react_dropzone_1.useDropzone)({
        onDrop: onDrop,
        accept: accept
            ? accept.split(",").reduce(function (acc, mimeType) {
                acc[mimeType.trim()] = [];
                return acc;
            }, {})
            : undefined,
        multiple: multiple,
        onDragEnter: function () { return setIsDragActive(true); },
        onDragLeave: function () { return setIsDragActive(false); },
        onDropAccepted: function () { return setIsDragActive(false); },
        onDropRejected: function () { return setIsDragActive(false); },
    }), getRootProps = _d.getRootProps, getInputProps = _d.getInputProps;
    var removeFile = function (id) {
        var updatedFiles = files.filter(function (file) { return "id" in file && file.id !== id; });
        setFiles(updatedFiles);
        onChange(updatedFiles);
    };
    var renderPreview = function (file) {
        var _a;
        var isUploaded = "url" in file;
        var uploadedFile = file.file;
        var fileType = isUploaded
            ? (_a = file.mimeType) === null || _a === void 0 ? void 0 : _a.split("/")[0]
            : uploadedFile.type.split("/")[0];
        var content = (function () {
            switch (fileType) {
                case "image":
                    return (<image_1.default src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)} alt="Preview" width={64} height={64} className="h-full w-full object-cover"/>);
                case "video":
                    return (<div className="flex h-full w-full items-center justify-center bg-gray-600">
              <ssr_1.PlayIcon size={24} className="text-gray-300" weight="thin"/>
            </div>);
                case "audio":
                    return (<div className="flex h-full w-full items-center justify-center bg-gray-600">
              <ssr_1.MusicNoteIcon size={24} className="text-gray-300" weight="thin"/>
            </div>);
                default:
                    return (<div className="flex h-full w-full items-center justify-center">
              <ssr_1.FileIcon size={24} weight="thin" className="text-gray-400"/>
            </div>);
            }
        })();
        return content;
    };
    return (<div className="w-full space-y-3">
      <div {...getRootProps()} className={"relative min-h-32 cursor-pointer rounded-lg border bg-white transition-colors hover:bg-gray-50"}>
        <input {...getInputProps()}/>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <ssr_1.UploadSimpleIcon className="mb-1 size-8 text-gray-400"/>
          <p className="mb-3 text-sm text-gray-600">
            {isDragActive ? t("dropzone") : t("upload_button")}
          </p>
          <p className="text-xs text-gray-500">
            {t("drag_drop_hint", {
            defaultValue: "Drag and drop files here or click to browse",
        })}
          </p>
        </div>
      </div>

      {files.length > 0 &&
            files.map(function (file) { return (<div key={file.id} className="flex items-center gap-3 rounded-lg border bg-white/90 p-3">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {renderPreview(file)}
            </div>
            {/* File info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {t("uploaded_file")}
                </span>
                {isUploading(file) ? (<span className="w-1/3 h-6 truncate text-left text-[13px] text-gray-500">
                    {getDisplayName(file)}
                  </span>) : (<button_1.Button type="button" variant="link" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={function (e) {
                        e.stopPropagation();
                        removeFile(file.id);
                    }}>
                    <ssr_1.TrashSimpleIcon className="h-3 w-3"/>
                  </button_1.Button>)}
              </div>
              {/* Progress bar - always visible */}
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-blue-500 transition-all duration-300 ease-out" style={{
                    width: "".concat("process" in file && file.process !== undefined
                        ? file.process
                        : 100, "%"),
                }}/>
              </div>
              
              <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                <span className="ltr">
                  {getDisplaySize(file)}
                </span>
                {getProgressText(file) && (<span>
                    {getProgressText(file)}
                  </span>)}
              </div>
            </div>
          </div>); })}

      <div className="flex flex-col items-start justify-center text-sm uppercase">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">
            {t("Limits.image.text")}
          </span>
          .
          <span className="text-xs text-gray-500">
            {t("Limits.image.formats")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">
            {t("Limits.video.text")}
          </span>
          .
          <span className="text-xs text-gray-500">
            {t("Limits.video.formats")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">
            {t("Limits.audio.text")}
          </span>
          .
          <span className="text-xs text-gray-500">
            {t("Limits.audio.formats")}
          </span>
        </div>
      </div>
    </div>);
};
exports.MediaUploader = MediaUploader;
