import Image from "next/image";

export const HomeScreenRecord = () => {
  return (
    <section className="_home-screen-record bg-gradient-to-b from-blue-500 to-violet-600 py-14">
      <div className="container max-w-5xl px-5">
        <div className="flex items-center justify-center">
          <img
            className="h-auto w-[244px] rounded-2xl"
            src="/images/screen-record.gif"
            alt="Screen record of Befroosh App"
          />
        </div>
      </div>
    </section>
  );
};
