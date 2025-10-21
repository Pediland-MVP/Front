import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface CardImageProps {
  src?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function CardImage({
  src,
  alt = "",
  className = "",
  priority = false,
}: CardImageProps) {
  const placeholder = "/images/placeholder.webp";
  const [imgSrc, setImgSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src) setImgSrc(src);
  }, [src]);

  const handleError = useCallback(() => setImgSrc(placeholder), []);
  const handleLoad = useCallback(() => setIsLoading(false), []);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      className={`rounded-lg object-cover transition-opacity duration-300 ${
        isLoading ? "opacity-0" : "opacity-100"
      } ${className}`}
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      priority={priority}
      placeholder="blur"
      blurDataURL={placeholder}
    />
  );
}
