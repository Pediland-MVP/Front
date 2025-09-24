"use client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Textarea,
} from "@/components/index";
import {
  useContentStore,
  useCurrentTextAreaValue,
} from "@/store/contentCycleStore";
import {
  CameraIcon,
  CaretLeftIcon,
  PhoneIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function InstaDirectUi() {
  const { adminContentCycle } = useContentStore();
  const { currentTextAreaValue, setCurrentTextAreaValue } =
    useCurrentTextAreaValue();
  // console.log(adminContentCycle);

  return (
    <div className="flex h-full w-full">
      {/* Main chat area */}
      <div className="flex w-full flex-col">
        {/* Chat header */}
        <div className="mb-4 flex flex-row-reverse items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold">Ali</p>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <CaretLeftIcon size={28} color="#242324" />
          </div>
          <div className="flex gap-4">
            <VideoCameraIcon size={28} color="#1a191a" />
            <PhoneIcon size={28} color="#1a191a" />
          </div>
        </div>

        {/* Messages area */}
        <div className="mb-4 flex flex-grow flex-col justify-end">
          {adminContentCycle.length > 0 &&
            adminContentCycle?.map(
              (value, index) =>
                value && ( // Only render if the value is truthy
                  <div
                    key={index}
                    className="flex flex-col items-end justify-end gap-4 py-2"
                  >
                    <div className="max-w-[70%] rounded-[2rem] bg-gray-200 px-6 py-3 break-words">
                      {value}
                    </div>{" "}
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" className="rounded-2xl">
                        دکمه
                      </Button>
                    </div>
                  </div>
                ),
            )}
        </div>

        {/* Message input area */}
        <div className="relative flex items-center gap-4 rounded-[3rem]">
          <Textarea
            value={currentTextAreaValue}
            placeholder="message ..."
            className="flex-1 rounded-full border pl-[3rem]"
            dir="ltr"
          />
          <div className="absolute left-2 rounded-full bg-blue-500 p-1">
            <CameraIcon size={26} color="#232223" />
          </div>
        </div>
      </div>
    </div>
  );
}
