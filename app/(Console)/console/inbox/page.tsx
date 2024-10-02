// import { ResizablePanel } from "@/components/ui/resizable";
import { cookies } from "next/headers";

export default function ChatsPage() {
  const layout = cookies().get("react-resizable-panels:layout");
  const defaultLayout = layout ? JSON.parse(layout.value) : [0, 80];

  console.log(defaultLayout);

  return (
    <>
      {/* <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}> */}
      <div className=" px-8 py-4 w-full h-full">
        {/* <p className="text-lg text-gray-900 font-semibold border-b pb-4 border-gray-400">
          لیست پیام ها <span>(4)</span>
        </p> */}
      </div>
      {/* </ResizablePanel> */}
    </>
  );
}
