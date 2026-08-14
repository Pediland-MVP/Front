import { cn } from '@/lib/utils';

interface LayoutSettingsProps {
  children: React.ReactNode;
  className?: string;
}

export const LayoutSettings = ({ children, className }: LayoutSettingsProps) => {
  return (
    <div
      className={cn(
        className,
        // Scrolls only from `md` up. On mobile SidebarInset is already a scroll container,
        // so a second one here nested them: the inner scroller ran out first and the last
        // 56px only appeared after a separate gesture on the outer one, which also dragged
        // the header off screen. One scroller per axis on mobile keeps the gesture native.
        'flex-1 flex-col rounded-t-3xl bg-white md:min-h-0 md:overflow-y-auto md:rounded-t-none md:rounded-b-xl',
      )}
    >
      <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">{children}</div>
    </div>
  );
};
