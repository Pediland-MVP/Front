"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MegaMenuXl;
var react_1 = require("@phosphor-icons/react");
var react_2 = require("react");
var profile_ui_kommo_png_1 = require("@/public/profile-ui-kommo.png");
var explainFeaturesSmall_1 = require("../explainFeaturesSmall");
function MegaMenuXl(_a) {
    var title1 = _a.title1, title2 = _a.title2, list2 = _a.list2, list1 = _a.list1;
    return (<div className="max-w-[72rem] w-full  ">
      <div className="hidden xl:block w-full bg-white ">
        <div className="flex  py-7 justify-between ">
          <div>
            <h2 className="font-semibold text-xl">{title1}</h2>
            <h3 className="text-md "></h3>
            <ul className="leading-[2rem] mt-4">
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <react_1.CaretLeft size={13}/>
                </a>
              </li>
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <react_1.CaretLeft size={13}/>
                </a>
              </li>
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <react_1.CaretLeft size={13}/>
                </a>
              </li>
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <react_1.CaretLeft size={13}/>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-xl">{title2}</h2>
            <ul className="leading-[2rem] mt-4">
              <li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <react_1.CaretLeft size={13}/>
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <react_1.CaretLeft size={13}/>
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <react_1.CaretLeft size={13}/>
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <react_1.CaretLeft size={13}/>
                  </a>
                </li>
              </li>
            </ul>
          </div>
          <div>
            <explainFeaturesSmall_1.default flex="sm:flex-row" bg="bg-purple-100" picCoverBg="bg-blue-700" picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]" srcPic={profile_ui_kommo_png_1.default} text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در" title="تولید سادگی نامفهوم"/>
          </div>
        </div>
        <div className="border-t cursor-pointer">
          <a href="contact" className="flex items-center pt-4">
            <react_1.EnvelopeSimple size={28} className="pl-1"/>
            تماس با ما
          </a>
        </div>
      </div>
    </div>);
}
