'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FullScreenImageProps {
  src: string;
  alt: string;
}

export function FullScreenImage({ src, alt }: FullScreenImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" className="h-auto p-0" onClick={() => setIsOpen(true)}>
        <Image
          src={src}
          alt={alt}
          width={100}
          height={100}
          className="h-auto w-full rounded-md object-cover"
        />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-full max-w-full p-0">
          <Button
            variant="ghost"
            className="absolute top-2 right-2 rounded-full p-2"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <Image src={src} alt={alt} width={1000} height={1000} className="h-auto w-full" />
        </DialogContent>
      </Dialog>
    </>
  );
}
