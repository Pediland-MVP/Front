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
exports.FileUpload = void 0;
exports.GridPattern = GridPattern;
var utils_1 = require("@befroosh/lib/utils");
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var react_dropzone_1 = require("react-dropzone");
var image_1 = require("next/image");
var animated_circular_progress_bar_1 = require("../../ui/src/animated-circular-progress-bar");
var ssr_1 = require("@phosphor-icons/react/dist/ssr");
var next_intl_1 = require("next-intl");
var mainVariant = {
    initial: {
        x: 0,
        y: 0,
    },
    animate: {
        x: 20,
        y: -20,
        opacity: 0.9,
    },
};
var secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};
var FileUpload = function (_a) {
    var onChange = _a.onChange, _b = _a.type, type = _b === void 0 ? "file" : _b, _c = _a.accept, accept = _c === void 0 ? "*" : _c, _d = _a.multiple, multiple = _d === void 0 ? false : _d, _e = _a.images, images = _e === void 0 ? [] : _e, _f = _a.progress, progress = _f === void 0 ? 0 : _f, _g = _a.isUploading, isUploading = _g === void 0 ? false : _g, className = _a.className;
    var t = (0, next_intl_1.useTranslations)('FileUpload');
    var _h = (0, react_1.useState)([]), files = _h[0], setFiles = _h[1];
    var fileInputRef = (0, react_1.useRef)(null);
    var handleFileChange = function (newFiles) {
        if (multiple) {
            setFiles(function (prevFiles) { return __spreadArray(__spreadArray([], prevFiles, true), newFiles, true); });
        }
        else {
            setFiles(function (prevFiles) { return __spreadArray([], newFiles, true); });
        }
        onChange && onChange(newFiles);
    };
    var handleClick = function () {
        var _a;
        (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    var _j = (0, react_dropzone_1.useDropzone)({
        multiple: false,
        noClick: true,
        onDrop: handleFileChange,
        onDropRejected: function (error) {
            console.log(error);
        },
    }), getRootProps = _j.getRootProps, isDragActive = _j.isDragActive;
    return (<div className={(0, utils_1.cn)(className, "bg-white border-2 hover:border-primary rounded-lg mt-1 duration-300 relative")} {...getRootProps()}>
      {isUploading && (<animated_circular_progress_bar_1.default className="w-10 h-10 text-xs font-sans absolute right-5 top-5" gaugeSecondaryColor="#bababa" gaugePrimaryColor="black" max={100} min={0} value={progress}/>)}
      <framer_motion_1.motion.div onClick={handleClick} whileHover="animate" className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden">
        <input ref={fileInputRef} id="file-upload-handle" type={type} accept={accept} onChange={function (e) { return handleFileChange(Array.from(e.target.files || [])); }} className="hidden"/>
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 text-neutral-400 dark:text-neutral-400 text-sm font-light text-center">
            {t('description')}
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            <ImageGrid images={images}/>

            {files.length > 0 &&
            files.map(function (file, idx) { return (<framer_motion_1.motion.div key={"file" + idx} layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx} className={(0, utils_1.cn)("relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md", "shadow-sm")}>
                  <div className="flex justify-between w-full items-center gap-4">
                    <framer_motion_1.motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                      {file.name}
                    </framer_motion_1.motion.p>
                    <framer_motion_1.motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="rounded-lg px-2 py-1 w-fit flex-shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </framer_motion_1.motion.p>
                  </div>

                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                    <framer_motion_1.motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 ">
                      {file.type}
                    </framer_motion_1.motion.p>
                  </div>
                </framer_motion_1.motion.div>); })}
            {!files.length && (<framer_motion_1.motion.div layoutId="file-upload" variants={mainVariant} transition={{
                type: "spring",
                stiffness: 300,
                damping: 10,
            }} className={(0, utils_1.cn)("relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md", "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]")}>
                {isDragActive ? (<framer_motion_1.motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neutral-600 flex flex-col items-center">
                    {t('dropIt')}
                    <ssr_1.UploadSimple size={28} className="text-neutral-600 dark:text-neutral-400"/>
                  </framer_motion_1.motion.p>) : (<ssr_1.UploadSimple size={28} className="text-neutral-600 dark:text-neutral-300"/>)}
              </framer_motion_1.motion.div>)}

            {!files.length && (<framer_motion_1.motion.div variants={secondaryVariant} className="absolute opacity-0 border border-gray-200 inset-0 z-30 bg-transparent flex items-center justify-center mt-4 w-full max-w-[8rem] mx-auto rounded-md"></framer_motion_1.motion.div>)}
          </div>
        </div>
      </framer_motion_1.motion.div>
    </div>);
};
exports.FileUpload = FileUpload;
function GridPattern() {
    var columns = 41;
    var rows = 11;
    return (<div className="flex bg-gray-100 dark:bg-neutral-900 flex-shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map(function (_, row) {
            return Array.from({ length: columns }).map(function (_, col) {
                var index = row * columns + col;
                return (<div key={"".concat(col, "-").concat(row)} className={"w-10 h-10 flex flex-shrink-0 rounded-[2px] ".concat(index % 2 === 0
                        ? "bg-gray-50 dark:bg-neutral-950"
                        : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]")}/>);
            });
        })}
    </div>);
}
var ImageGrid = function (_a) {
    var images = _a.images;
    if (images.length === 0)
        return null;
    var gridColsClass = images.length === 1
        ? "grid-cols-1"
        : images.length === 2
            ? "grid-cols-2"
            : "grid-cols-3";
    return (<div className={"grid ".concat(gridColsClass, " gap-4 mb-4 place-items-center justify-center")}>
      {images.map(function (image, index) { return (<div key={index} className="relative aspect-square rounded-md overflow-hidden h-40 w-40">
          <image_1.default src={image} alt={"Uploaded image ".concat(index + 1)} layout="fill" objectFit="cover"/>
        </div>); })}
    </div>);
};
