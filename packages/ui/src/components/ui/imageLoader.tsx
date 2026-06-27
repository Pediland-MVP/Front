import { Spinner } from '@phosphor-icons/react/dist/ssr';

export default function ImageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  );
}
