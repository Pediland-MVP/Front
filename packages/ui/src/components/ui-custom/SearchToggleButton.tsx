import { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { CircleXIcon, SearchIcon } from 'lucide-react';

interface Props {
  setIsSearchVisible: Dispatch<SetStateAction<boolean>>;
  isSearchVisible: boolean;
}

export const SearchToggleButton = ({ setIsSearchVisible, isSearchVisible }: Props) => {
  return (
    <Button
      className="md:hidden"
      type="button"
      size="icon"
      onClick={() => setIsSearchVisible((prev: boolean) => !prev)}
      aria-label={'toggle_search'}
    >
      {isSearchVisible ? (
        <CircleXIcon className="size-5 text-white xl:hidden" />
      ) : (
        <SearchIcon className="size-5 text-white xl:hidden" />
      )}
    </Button>
  );
};
