import { UserGear } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const SettingsPage = () => {
  return (
    <div className="_settings">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">تنظیمات</h1>

        <div className="_tools"></div>
      </div>
      <div className="_cards grid grid-cols-12 gap-4">
        <div className="_card col-span-3 bg-white hover:shadow-md rounded-lg duration-300">
          <Link
            href="/console/accounts"
            className="flex flex-col items-center gap-3 p-12 group"
          >
            <UserGear
              size={44}
              className="text-gray-400 group-hover:text-black duration-300"
            />
            <span className="text-lg font-semibold text-gray-400 group-hover:text-black duration-300">
              مدیریت اکانت‌ها
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
