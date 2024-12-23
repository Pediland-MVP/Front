import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { RocketIcon, Cross1Icon } from "@radix-ui/react-icons";
import { WarningCircle } from "@phosphor-icons/react";

export function ChatAlert() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="mb-2 ">
      <Alert className="bg-yellow-50 border-yellow-500 border-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2 items-center">
            <WarningCircle size={24} color="#855707" />
            <div>
              {/* <AlertTitle>Heads up!</AlertTitle> */}
              <AlertDescription className="text-yellow-700">
              برای مشاهده آخرین نسخه پیام ها صفحه را رفرش کنید.
              </AlertDescription>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <Cross1Icon className="h-4 w-4" />
          </button>
        </div>
      </Alert>
    </div>
  );
}
