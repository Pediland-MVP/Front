import { Spinner } from "@phosphor-icons/react/dist/ssr";

export default function ImageLoader() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Spinner className="animate-spin h-8 w-8 text-gray-500" />
    </div>
  );
}
