import { Card } from "@/components/ui/card";
import { ArrowLeft, Sidebar } from "@phosphor-icons/react/dist/ssr";

export default function CommentsListSkeleton() {
    return (
      <div className="lg:w-1/3 w-full h-full bg-white animate-pulse">
        <Card className="w-full h-full p-4 box-border overflow-hidden flex flex-col border-l-2 border-gray-100">
          <div className="w-full flex lg:hidden justify-between mb-4">
            <Sidebar
              className="text-gray-300 bg-gray-200 rounded-md h-6 w-6"
            />
            <ArrowLeft
              className="text-gray-300 bg-gray-200 rounded-md h-6 w-6"
            />
          </div>
  
          <div className="flex-grow overflow-y-auto w-full space-y-4">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="flex p-2 items-center gap-4 box-border rounded-lg bg-gray-100"
              >
                <div className="bg-gray-200 rounded-full w-12 h-12"></div>
                <div className="flex flex-col w-full">
                  <div className="bg-gray-200 h-4 w-3/4 mb-2 rounded-md"></div>
                  <div className="bg-gray-200 h-3 w-1/2 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }