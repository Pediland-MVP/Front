import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@befroosh/ui";
import { cn } from "@befroosh/lib";

const faqs = [
  {
    question:
      "دایرکت هوشمند اینستاگرام بفروش چیست و چطور به کسب‌وکار من کمک می‌کند؟",
    answer:
      "دایرکت هوشمند بفروش سیستمی است که به صورت خودکار پیام‌ها و کامنت‌های اینستاگرام شما را مدیریت می‌کند و پاسخ‌های سریع و دقیق ارسال می‌کند. این ابزار باعث افزایش سرعت پاسخگویی، ثبت منظم سفارش‌ها و بهبود تجربه مشتری می‌شود.",
  },
  {
    question: "آیا برای استفاده از بفروش نیاز به دانش فنی خاصی دارم؟",
    answer:
      "خیر، پنل بفروش به شکلی ساده طراحی شده و همراه با آموزش‌های کامل و پشتیبانی حرفه‌ای ارائه می‌شود تا همه کاربران بتوانند به راحتی از آن استفاده کنند.",
  },
  {
    question: "چگونه بفروش سفارش‌ها و اطلاعات مشتریان را مدیریت می‌کند؟",
    answer:
      "بفروش سفارش‌ها را به طور خودکار در همان محیط دایرکت ثبت می‌کند و اطلاعات مشتریان را به سیستم CRM متصل می‌کند تا پیگیری و مدیریت سفارش‌ها به ساده‌ترین شکل ممکن انجام شود.",
  },
  {
    question:
      "آیا امکان ارسال پیام‌های هدفمند به دسته‌بندی خاصی از مشتریان وجود دارد؟",
    answer:
      "بله، بفروش این امکان را فراهم می‌کند تا مشتریان را بر اساس معیارهای مختلف دسته‌بندی کنید و پیام‌های تبلیغاتی یا اطلاع‌رسانی را به صورت هدفمند ارسال نمایید.",
  },
  {
    question:
      "آیا برای فعال‌سازی و استفاده از دایرکت هوشمند باید همیشه آنلاین باشم؟",
    answer:
      "خیر، با استفاده از سیستم خودکار بفروش می‌توانید بدون نیاز به حضور دائمی آنلاین، به پیام‌ها پاسخ دهید و ارتباط موثر با مشتریان را حفظ کنید.",
  },
];

export const HomeFAQ = () => {
  return (
    <section className="_home-faq bg-gradient-to-r from-blue-500 to-violet-600 pt-10 pb-26">
      <div className="container max-w-5xl px-5">
        <div className="">
          <h2 className="mb-6 text-center text-2xl font-medium text-white">
            سوالات متداول شما
          </h2>

          <Accordion className="mx-auto md:w-2/3" type="single" collapsible>
            {faqs.map((faq, idx) => {
              const isLast = idx === faqs.length - 1;

              return (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="overflow-hidden border-dashed border-violet-200 bg-white/95 first:rounded-t-xl last:rounded-b-xl"
                >
                  <AccordionTrigger className="py-3 pr-4 pl-3 text-[13px] font-normal text-gray-700 data-[state=open]:border-b data-[state=open]:font-semibold data-[state=open]:text-violet-700 [&[data-state=open]>svg]:text-violet-800">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent
                    className={cn(
                      "bg-violet-100/80 px-3 py-2.5 text-[13px] text-violet-900",
                      isLast && "rounded-b-xl",
                    )}
                  >
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
