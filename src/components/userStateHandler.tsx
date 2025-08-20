// components/UserStateHandler.tsx
import useUser from '@/hooks/useUser';
import { ReactNode } from 'react';

interface UserStateHandlerProps {
  children: (props: {
    hasSubscription: boolean;
    hasInstagram: boolean;
  }) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}


export default function UserStateHandler({
  children,
  loadingComponent = <div>Loading...</div>,
  errorComponent = <div>Error loading user data</div>,
}: UserStateHandlerProps) {
  const { hasSubscription, hasInstagram, isLoading, error } = useUser();

  if (isLoading) return <>{loadingComponent}</>;
  if (error) return <>{errorComponent}</>;

  return <>{children({ hasSubscription, hasInstagram })}</>;
}