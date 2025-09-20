import Image from "next/image";

export default function CheckoutError() {
  return (
    <div className="h-svh flex flex-col justify-center items-center">
      <Image src={'/images/emojies/broken-heart.webp'} height={200} width={200} alt="قلب شکسته" />
      <p className="text-xl font-bold">خطایی پیش اومد</p>
      <p className="text-center">یا لینک شما صحیح نیست یا ما دردسترس نیستیم. لطفا یکم بعد دوباره امتحان کن یا دوباره درخواست لینک بده</p>
    </div>
  );
}
