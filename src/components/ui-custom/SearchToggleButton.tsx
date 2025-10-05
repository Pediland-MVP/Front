// Refactored
import { Dispatch, SetStateAction } from "react";

import { Button } from "@/components";
import { CircleXIcon, SearchIcon } from "lucide-react";

interface Props {
  setIsSearchVisible: Dispatch<SetStateAction<boolean>>;
  isSearchVisible: boolean;
}

export const SearchToggleButton = ({
  setIsSearchVisible,
  isSearchVisible,
}: Props) => {
  return (
    <Button
      className="md:hidden"
      type="button"
      variant="link"
      size="icon"
      onClick={() => setIsSearchVisible((prev: boolean) => !prev)}
      aria-label={"toggle_search"}
    >
      {isSearchVisible ? (
        <CircleXIcon className="size-6 text-white xl:hidden" />
      ) : (
        <SearchIcon className="size-6 text-white xl:hidden" />
      )}
    </Button>
  );
};
