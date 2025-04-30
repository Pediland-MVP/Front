import { FocusEvent } from "react";

export const useSelectOnFocus = () => {
  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return {
    onFocus: handleFocus,
  };
};
