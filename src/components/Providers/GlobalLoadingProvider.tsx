"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingLogo } from "@/components/Global/LoadingLogo";

interface GlobalLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showLoadingFor: (duration: number) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType>({
  isLoading: false,
  setLoading: () => {},
  showLoadingFor: () => {},
});

export const useGlobalLoading = () => useContext(GlobalLoadingContext);

interface GlobalLoadingProviderProps {
  children: React.ReactNode;
  initialLoading?: boolean;
}

export const GlobalLoadingProvider = ({
  children,
  initialLoading = true,
}: GlobalLoadingProviderProps) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const pathname = usePathname();

  // Clear any existing timeout when component unmounts
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  // Handle initial loading state
  useEffect(() => {
    console.log("🔄 GlobalLoadingProvider useEffect", { initialLoading });
    // Only set initial loading state once, don't auto-hide on pathname changes
    // Let individual pages control when to hide loading
    if (initialLoading) {
      setIsLoading(true);
    }
  }, [initialLoading]); // Remove pathname dependency to prevent auto-hiding

  const setLoading = useCallback(
    (loading: boolean) => {
      console.log("🔄 setLoading called with:", loading);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
      setIsLoading(loading);
    },
    [loadingTimeout],
  );

  const showLoadingFor = useCallback(
    (duration: number) => {
      setIsLoading(true);

      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      const timeout = setTimeout(() => {
        setIsLoading(false);
        setLoadingTimeout(null);
      }, duration);

      setLoadingTimeout(timeout);
    },
    [loadingTimeout],
  );

  const contextValue = useMemo(
    () => ({
      isLoading,
      setLoading,
      showLoadingFor,
    }),
    [isLoading, setLoading, showLoadingFor],
  );

  return (
    <GlobalLoadingContext.Provider value={contextValue}>
      {isLoading && <LoadingLogo />}
      {children}
    </GlobalLoadingContext.Provider>
  );
};
