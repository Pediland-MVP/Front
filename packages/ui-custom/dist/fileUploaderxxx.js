'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.useFileUploadProvider = exports.LazyFileUploader = void 0;
exports.FileUploaderSkeleton = FileUploaderSkeleton;
exports.FileUploaderProvider = FileUploaderProvider;
var react_1 = require("react");
var react_dropzone_1 = require("react-dropzone");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var skeleton_1 = require("@/components/ui/skeleton");
var dynamic_1 = require("next/dynamic");
var next_intl_1 = require("next-intl");
var circularProgress_1 = require("@/components/ui/circularProgress");
// Update FilePreview to use the new type
var FilePreview = function (_a) {
    var _b;
    var fileData = _a.fileData, progress = _a.progress, defaultFile = _a.defaultFile;
    var _c = (0, react_1.useState)(false), isPlaying = _c[0], setIsPlaying = _c[1];
    var audioRef = (0, react_1.useRef)(null);
    var t = (0, next_intl_1.useTranslations)();
    var filetypeFromurl = (_b = fileData.url) === null || _b === void 0 ? void 0 : _b.split('.').pop();
    var file = fileData.file;
    var isImage = fileData.type || (file === null || file === void 0 ? void 0 : file.type.startsWith('image/'));
    var isVideo = fileData.type || (file === null || file === void 0 ? void 0 : file.type.startsWith('video/'));
    var isAudio = fileData.type || (file === null || file === void 0 ? void 0 : file.type.startsWith('audio/'));
    var isPDF = fileData.type || (file === null || file === void 0 ? void 0 : file.type) === 'application/pdf';
    var renderPreview = function () {
        if (isImage) {
            return (<img src={file ? URL.createObjectURL(file) : fileData.url} alt={file === null || file === void 0 ? void 0 : file.name} className="w-24 h-24 object-cover rounded"/>);
        }
        if (isVideo) {
            return (<video src={file ? URL.createObjectURL(file) : fileData.url} className="w-24 h-24 object-cover rounded" controls/>);
        }
        if (isAudio) {
            return (<div className="w-24 h-24 flex flex-col items-center justify-center bg-muted rounded">
          <lucide_react_1.MusicIcon className="w-12 h-12 text-primary"/>
          <audio ref={audioRef} src={file ? URL.createObjectURL(file) : fileData.url} onEnded={function () { return setIsPlaying(false); }} className="hidden"/>
        </div>);
        }
        if (isPDF) {
            return (<div className="w-24 h-24 flex flex-col items-center justify-center bg-muted rounded">
          <lucide_react_1.FileIcon className="w-12 h-12 text-primary"/>
          <span className="text-xs font-thin truncate w-[15ch]">{file === null || file === void 0 ? void 0 : file.name}</span>
        </div>);
        }
        return (<div className="w-24 h-24 flex flex-col items-center justify-center bg-muted rounded">
        <lucide_react_1.FileIcon className="w-12 h-12 text-primary"/>
        <span className="text-xs font-thin truncate w-[15ch]">{file === null || file === void 0 ? void 0 : file.name}</span>
      </div>);
    };
    return (<div className="relative w-24 h-24">
      {renderPreview()}
      {progress < 100 && (<div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
          <circularProgress_1.default value={progress} size={48} strokeWidth={4}/>
        </div>)}
      {progress === 100 && (<div className="absolute inset-0 flex items-center justify-center bg-green-500/50 rounded">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>)}
    </div>);
};
var FileUploader = function (_a) {
    var _b = _a.multiple, multiple = _b === void 0 ? false : _b, uploadHandler = _a.uploadHandler, _c = _a.defaultFiles, defaultFiles = _c === void 0 ? [] : _c, _d = _a.acceptedFileTypes, acceptedFileTypes = _d === void 0 ? [] : _d, type = _a.type;
    var _e = (0, exports.useFileUploadProvider)(), files = _e.files, setFiles = _e.setFiles, removeFile = _e.removeFile;
    var t = (0, next_intl_1.useTranslations)();
    var onDrop = (0, react_1.useCallback)(function (acceptedFiles) {
        var newFiles = acceptedFiles.map(function (file) { return ({
            file: file, // Keep the original File object intact
            id: Math.random().toString(36).substr(2, 9),
            progress: 0,
            type: type
        }); });
        var updatedFiles = multiple ? __spreadArray(__spreadArray([], files, true), newFiles, true) : newFiles;
        setFiles(updatedFiles);
        newFiles.forEach(function (fileData) {
            uploadHandler({ file: fileData.file, fileId: fileData.id });
        });
    }, [files, multiple, uploadHandler]);
    var _f = (0, react_dropzone_1.useDropzone)({
        onDrop: onDrop,
        multiple: multiple,
        accept: acceptedFileTypes.length
            ? acceptedFileTypes.reduce(function (acc, curr) {
                var _a;
                return (__assign(__assign({}, acc), (_a = {}, _a[curr] = [], _a)));
            }, {})
            : undefined,
    }), getRootProps = _f.getRootProps, getInputProps = _f.getInputProps, isDragActive = _f.isDragActive;
    return (<card_1.Card {...getRootProps()} className={"p-4 border-dashed cursor-pointer ".concat(isDragActive ? 'border-primary' : 'border-muted')}>
      <input {...getInputProps()}/>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t('fileUploader.dragDropText')}
        </p>
        <button_1.Button variant="outline" className="mt-2" type='button'>
          {t('fileUploader.selectFiles')}
        </button_1.Button>
      </div>
      <div className="mt-4 h-[120px] overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map(function (fileData, index) { return (<div key={fileData.id} className="relative">
              <FilePreview defaultFile={null} fileData={fileData} progress={fileData.progress}/>
              <button_1.Button type="button" variant="ghost" size="sm" className="absolute top-0 right-0 rounded-full p-0 w-6 h-6" onClick={function (e) {
                e.stopPropagation();
                removeFile(fileData.id);
            }}>
                <lucide_react_1.X className="h-3 w-3 text-gray-500"/>
              </button_1.Button>
            </div>); })}
        </div>
      </div>
    </card_1.Card>);
};
function FileUploaderSkeleton() {
    return (<card_1.Card className="p-4 border-dashed">
      <div className="flex flex-col items-center space-y-2">
        <skeleton_1.Skeleton className="h-4 w-[250px]"/>
        <skeleton_1.Skeleton className="h-4 w-[200px]"/>
        <skeleton_1.Skeleton className="h-10 w-[150px]"/>
      </div>
      <div className="mt-4 h-[120px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <skeleton_1.Skeleton className="h-24 w-24 rounded"/>
          <skeleton_1.Skeleton className="h-24 w-24 rounded"/>
          <skeleton_1.Skeleton className="h-24 w-24 rounded"/>
        </div>
      </div>
    </card_1.Card>);
}
exports.LazyFileUploader = (0, dynamic_1.default)(function () { return Promise.resolve(FileUploader); }, {
    loading: function () { return <FileUploaderSkeleton />; },
    ssr: false,
});
exports.default = FileUploader;
var FileUploaderContext = (0, react_1.createContext)(undefined);
function FileUploaderProvider(_a) {
    var children = _a.children, onFileUpload = _a.onFileUpload;
    var _b = (0, react_1.useState)([]), files = _b[0], setFiles = _b[1];
    var addFiles = (0, react_1.useCallback)(function (newFiles, multiple) {
        if (multiple === void 0) { multiple = false; }
        var filesWithMetadata = newFiles.map(function (file) { return ({
            file: file,
            id: Math.random().toString(36).substr(2, 9),
            progress: 0,
            type: file.type
        }); });
        setFiles(function (prevFiles) {
            var updatedFiles = multiple ? __spreadArray(__spreadArray([], prevFiles, true), filesWithMetadata, true) : filesWithMetadata;
            // If onFileUpload is provided, call it for each new file
            if (onFileUpload) {
                filesWithMetadata.forEach(function (fileData) {
                    onFileUpload({ file: fileData.file, fileId: fileData.id });
                });
            }
            return updatedFiles;
        });
    }, [onFileUpload]);
    var removeFile = (0, react_1.useCallback)(function (id) {
        setFiles(function (prevFiles) { return prevFiles.filter(function (fileData) { return fileData.id !== id; }); });
    }, []);
    var clearFiles = (0, react_1.useCallback)(function () {
        setFiles([]);
    }, []);
    var value = {
        files: files,
        setFiles: setFiles,
        addFiles: addFiles,
        removeFile: removeFile,
        clearFiles: clearFiles
    };
    return (<FileUploaderContext.Provider value={value}>
      {children}
    </FileUploaderContext.Provider>);
}
var useFileUploadProvider = function () {
    var context = (0, react_1.useContext)(FileUploaderContext);
    if (!context) {
        throw new Error("useFileUploadProvider must be used within a FileUploaderProvider");
    }
    return context;
};
exports.useFileUploadProvider = useFileUploadProvider;
