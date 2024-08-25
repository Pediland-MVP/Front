"use client";
import React from "react";
import {
  FacebookLogo,
  TwitterLogo,
  InstagramLogo,
  LinkedinLogo,
} from "@phosphor-icons/react";

export default function Footer() {
  return (
    <div className="md:mt-24 mt-16">
      {/* Footer */}
      <footer className="bg-blueKommo mt-auto pt-8 rounded-t-2xl px-4 md:px-8">
        <div className="container mx-auto rounded-t-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-8 justify-items-center mx-auto">
            {/* First Column */}
            <div>
              <h3 className="text-sm md:text-md font-semibold mb-4 text-white">
                شرکت
              </h3>
              <ul className="leading-8 md:leading-[2.5rem] text-xs">
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    درباره ما
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    فرصت‌های شغلی
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    رسانه‌ها
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    بلاگ
                  </a>
                </li>
              </ul>
            </div>
            {/* Second Column */}
            <div>
              <h3 className="text-sm md:text-md font-semibold mb-4 text-white">
                پشتیبانی
              </h3>
              <ul className="leading-8 md:leading-[2.5rem] text-xs">
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    مرکز کمک
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    تماس با ما
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    سوالات متداول
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    قوانین
                  </a>
                </li>
              </ul>
            </div>
            {/* Third Column */}
            <div>
              <h3 className="text-sm md:text-md font-semibold mb-4 text-white">
                خدمات
              </h3>
              <ul className="leading-8 md:leading-[2.5rem] text-xs">
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    مشاوره
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    فروش
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    بازاریابی
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    خدمات مشتریان
                  </a>
                </li>
              </ul>
            </div>
            {/* Fourth Column*/}

            <div>
              <h3 className="text-sm md:text-md font-semibold mb-4 text-white">
                پشتیبانی
              </h3>
              <ul className="leading-8 md:leading-[2.5rem] text-xs">
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    مرکز کمک
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    تماس با ما
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    سوالات متداول
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-100 hover:text-gray-400  "
                  >
                    قوانین
                  </a>
                </li>
              </ul>
            </div>
          </div>


          <div className="border-b text-center pb-8">
            <h3 className="text-sm md:text-mdfont-semibold mb-4 text-white">
              ما را دنبال کنید
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#"
                aria-label="Facebook"
                className="text-white hover:text-purple-700"
              >
                <FacebookLogo size={28} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-white hover:text-purple-700"
              >
                <TwitterLogo size={28} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-white hover:text-purple-700"
              >
                <InstagramLogo size={28} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-white hover:text-purple-700"
              >
                <LinkedinLogo size={28} />
              </a>
            </div>
          </div>
          <h4 className="text-center m-auto py-4 text-white text-xs md: font-light">
            کلیه حقوق برای سایت محفوظ بوده و هرگونه کپی برداری غیرمجاز
            می‌باشد.
          </h4>
        </div>
      </footer>
    </div>
  );
}
