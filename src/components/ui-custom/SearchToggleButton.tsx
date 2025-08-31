import { Dispatch, SetStateAction } from "react";
import {
  Button,
  ListMagnifyingGlassIcon,
  XCircleIcon,
} from "@/components/index";

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
        <XCircleIcon className="size-7 text-gray-400 xl:hidden" />
      ) : (
        <ListMagnifyingGlassIcon className="text-foreground size-8 xl:hidden" />
      )}
    </Button>
  );
};
