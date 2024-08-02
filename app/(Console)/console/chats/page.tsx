import { ResizablePanel } from "@/components/ui/resizable";
import { cookies } from "next/headers";



export default function ChatsPage({defaultlayout}: {defaultlayout: number[]}) {
  const layout = cookies().get("react-resizable-panels:layout");
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  return (
    <>
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <div className="flex flex-col justify-center items-center w-full h-full">
          <p className="text-lg text-gray-300">یک گفتگو انتخاب کنید</p>
        </div>
      </ResizablePanel>
    </>
  );
}
