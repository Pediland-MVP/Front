import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import React from 'react';
import screenShotExplain from '@/public/profile-ui-kommo.png';
import ExplainFeatures from './explainFeaturesSmall';

interface megaMenuXlProps {
  title1: string;
  title2: string;
  list1: string | string[];
  list2: string | string[];
}
export default function MegaMenuXl({ title1, title2, list2, list1 }: megaMenuXlProps) {
  return (
    <div className="w-full max-w-[72rem]">
      <div className="hidden w-full bg-white xl:block">
        <div className="flex justify-between py-7">
          <div>
            <h2 className="text-xl font-semibold">{title1}</h2>
            <h3 className="text-md"></h3>
            <ul className="mt-4 leading-[2rem]">
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <CaretLeft size={13} />
                </a>
              </li>
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <CaretLeft size={13} />
                </a>
              </li>
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <CaretLeft size={13} />
                </a>
              </li>
              <li>
                <a className="flex items-center gap-1">
                  لورم اپیزوم <CaretLeft size={13} />
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title2}</h2>
            <ul className="mt-4 leading-[2rem]">
              <li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <CaretLeft size={13} />
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <CaretLeft size={13} />
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <CaretLeft size={13} />
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-1">
                    لورم اپیزوم <CaretLeft size={13} />
                  </a>
                </li>
              </li>
            </ul>
          </div>
          <div>
            <ExplainFeatures
              flex="sm:flex-row"
              bg="bg-purple-100"
              picCoverBg="bg-blue-700"
              picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
              srcPic={screenShotExplain}
              text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در"
              title="تولید سادگی نامفهوم"
            />
          </div>
        </div>
        <div className="cursor-pointer border-t">
          <a href="contact" className="flex items-center pt-4">
            <EnvelopeSimple size={28} className="pl-1" />
            تماس با ما
          </a>
        </div>
      </div>
    </div>
  );
}
