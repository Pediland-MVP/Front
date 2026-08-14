interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    // `flex-1` rather than `h-full` on mobile: `h-full` asked for 100% of the scroll
    // container's box while the 56px header was already sitting in it, so once the content
    // grew past the screen this column overshot by exactly the header height and pushed its
    // last strip under the bottom nav. `flex-1` fills the space left over instead, and the
    // default `min-height:auto` still lets it grow past the screen so the page can scroll.
    <div className="_settings-page flex flex-1 rounded-t-3xl bg-linear-to-t from-white/85 to-white md:h-[calc(100vh-88px)] md:flex-none md:rounded-t-none">
      <div className="flex flex-1 gap-3 md:min-h-0 md:p-3 md:pt-0">{children}</div>
    </div>
  );
}
