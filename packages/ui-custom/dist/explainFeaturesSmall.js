"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var image_1 = require("next/image");
var react_2 = require("@phosphor-icons/react");
var ExplainFeatures = function (_a) {
    var flex = _a.flex, bg = _a.bg, picCoverSize = _a.picCoverSize, picCoverBg = _a.picCoverBg, srcPic = _a.srcPic, title = _a.title, text = _a.text;
    return (<div className={"flex justify-center items-center mb-4 md:mb-6   text-blueKommo "}>
      <div className={"w-full max-w-[35rem] ".concat(bg, " rounded-2xl py-6 px-4")}>
        <div className={"flex w-full  flex-col-reverse  ".concat(flex, " items-center  ")}>
          <div className="sm:w-1/2 w-full m-auto flex flex-col pt-4 gap-4 md:pt-0  xl:w-1/2 l md:px-8">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm ">{text}
            </p>
            <span className="flex gap-2 mt-4 items-center hover:text-purple-700 cursor-pointer font-semibold">
              بیشتر
              <react_2.ArrowLeft size={18} color="#100534" className="hover:text-purple-700"/>
            </span>
          </div>
          <div className="relative w-full sm:w-1/2 xl:pb-[34%] ">
            <image_1.default src={srcPic} objectFit="cover" 
    // objectFit="cover"
    objectPosition="center" layout="fill" alt="Description" className={"rounded-[1rem] w-auto "}/>
          </div>
        </div>
      </div>
    </div>);
};
exports.default = ExplainFeatures;
