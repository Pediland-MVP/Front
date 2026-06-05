// src/components/table/contact-options.tsx

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SmsData } from "@/types/sms";

type Props = {
  leadId: string;
  mobile: string;
  fullName: string;
  openSmsDialog?: (data: SmsData) => void;
};

export const ContactOptions = ({
  leadId,
  mobile,
  fullName,
  openSmsDialog,
}: Props) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-primary hover:text-secondary underline-offset-4 hover:cursor-pointer hover:underline">
        {mobile}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-22">
        <DropdownMenuItem size="sm" className="justify-center">
          <a href={`tel:${mobile}`} rel="noopener noreferrer">
            تماس
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem size="sm" className="justify-center">
          <a
            href={`https://wa.me/98${mobile?.replace(/^0/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            واتسپ
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem size="sm" className="justify-center">
          <a
            href={`https://t.me/+98${mobile?.replace(/^0/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            تلگرام
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          size="sm"
          className="justify-center"
          onClick={() =>
            openSmsDialog?.({
              id: leadId,
              mobile,
              name: fullName,
            })
          }
        >
          پیامک
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
