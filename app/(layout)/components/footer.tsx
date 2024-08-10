"use client"
import React from 'react';
import { FacebookLogo, TwitterLogo, InstagramLogo, LinkedinLogo } from '@phosphor-icons/react';

export default function Footer() {
  return (
    <div className="mt-32">

      {/* فوتر */}
      <footer className='bg-blueKommo mt-auto pt-8 rounded-t-2xl '>
        <div className='container mx-auto bg-white rounded-t-xl py-8'>
          <div className='grid grid-cols-1 md:grid-cols-4'>
            {/* ستون اول */}
            <div>
              <h3 className='text-xl font-semibold mb-4 text-blueKommo'>شرکت</h3>
              <ul className='leading-[2rem]'>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>درباره ما</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>فرصت‌های شغلی</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>رسانه‌ها</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>بلاگ</a></li>
              </ul>
            </div>
            {/* ستون دوم */}
            <div>
              <h3 className='text-xl font-semibold mb-4 text-blueKommo'>پشتیبانی</h3>
              <ul className='leading-[2rem]'>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>مرکز کمک</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>تماس با ما</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>سوالات متداول</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>سیاست حفظ حریم خصوصی</a></li>
              </ul>
            </div>
            {/* ستون سوم */}
            <div>
              <h3 className='text-xl font-semibold mb-4 text-blueKommo'>خدمات</h3>
              <ul className='leading-[2rem]'>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>مشاوره</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>فروش</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>بازاریابی</a></li>
                <li><a href="#" className='text-gray-600 hover:text-gray-900'>خدمات مشتریان</a></li>
              </ul>
            </div>
            {/* ستون چهارم (شبکه‌های اجتماعی) */}
            <div>
              <h3 className='text-xl font-semibold mb-4 text-blueKommo'>ما را دنبال کنید</h3>
              <div className='flex gap-4'>
                <a href="#" aria-label="Facebook" className='text-blueKommo hover:text-purple-700'>
                  <FacebookLogo size={32} />
                </a>
                <a href="#" aria-label="Twitter" className='text-blueKommo hover:text-purple-700'>
                  <TwitterLogo size={32} />
                </a>
                <a href="#" aria-label="Instagram" className='text-blueKommo hover:text-purple-700'>
                  <InstagramLogo size={32} />
                </a>
                <a href="#" aria-label="LinkedIn" className='text-blueKommo hover:text-purple-700'>
                  <LinkedinLogo size={32} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
