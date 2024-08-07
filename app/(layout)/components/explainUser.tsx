import React from "react";
import happyCustomer from "../../../public/kommo-happy-client.png";
import Customer from "../../../public/kommo-enterpreneur.png";

import Image from "next/image";
export default function ExplainUser() {
  return (
    <div className="max-w-[104rem] m-auto overflow-hidden  w-full flex flex-col md:flex-row  md:justify-between items-center mb-24">
      <Image
        src={happyCustomer}
        alt="happy customer"
        width={550}
        height={40}
        className="hidden xl:block"
      />
      <Image
        src={happyCustomer}
        alt="happy customer"
        width={300}
        height={40}
        className="hidden md:block xl:hidden"
      />
      <h2 className=" text-2xl text-center leading-120 font-medium md:text-2xl lg:leading-[3rem] lg:text-[38px] px-16 md:px-0">
        لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از نامفهومنامفهوم صنعت چاپ
        و با استفاده
      </h2>
      <Image
        src={Customer}
        alt="happy customer"
        width={550}
        height={40}
        className="hidden xl:block"
      />
      <Image
        src={Customer}
        alt="happy customer"
        width={300}
        height={40}
        className="hidden md:block xl:hidden"
      />
      <div className="md:hidden flex mt-4">
        <Image
          src={Customer}
          alt="happy customer"
          width={180}
          height={40}
          className="block md:hidden"
        />
        <Image
          src={happyCustomer}
          alt="happy customer"
          width={190}
          height={40}
          className="block md:hidden"
        />
      </div>
    </div>
  );
}
