'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmileIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// `@emoji-mart/react` and its ~400 KB `@emoji-mart/data` JSON are only needed
// once the picker is actually opened. Importing them statically put both in the
// module graph of every route that renders a chat/comment composer.
const Picker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

interface EmojiPickerProps {
  onChange: (value: string) => void;
}

export const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    import('@emoji-mart/data').then((mod) => {
      if (!cancelled) setData(mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [open, data]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="hover:bg-muted rounded-md p-2">
        <SmileIcon className="text-muted-foreground h-5 w-5" />
      </PopoverTrigger>
      <PopoverContent className="w-full">
        {data ? (
          <Picker
            emojiSize={18}
            theme="light"
            data={data}
            maxFrequentRows={1}
            onEmojiSelect={(emoji: any) => onChange(emoji.native)}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
};
