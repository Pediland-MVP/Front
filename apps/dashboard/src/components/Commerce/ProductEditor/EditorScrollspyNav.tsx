'use client';

import { useEffect, type MutableRefObject } from 'react';

import { cn } from '@/lib/utils';

export type EditorSectionId = 'basic' | 'media' | 'variants' | 'inventory' | 'org' | 'shipping';

export interface EditorNavSection {
  id: EditorSectionId;
  label: string;
}

interface EditorScrollspyNavProps {
  sections: EditorNavSection[];
  /** Populated by the parent as it renders each section's wrapper element (ref callback), not
   * queried from the DOM — keeps this component decoupled from how/where sections render. */
  sectionRefs: MutableRefObject<Partial<Record<EditorSectionId, HTMLElement | null>>>;
  activeSection: EditorSectionId;
  onSelect: (id: EditorSectionId) => void;
  /** Driven by the parent's `matchMedia('(max-width: 900px)')` — see `ProductEditorPage`. */
  isMobile: boolean;
}

/**
 * Reproduces the approved mockup's editor nav mechanism as React idioms instead of vanilla-JS
 * DOM queries:
 *  - Desktop: every section is stacked in one continuous scrollable page. This is a scrollspy
 *    jump-list, not a tab switcher — clicking smooth-scrolls to the section (via its ref) and
 *    an `IntersectionObserver` re-highlights whichever section is currently in view as the
 *    user scrolls past it.
 *  - Mobile (`isMobile`): a horizontal tab bar. The parent only mounts the active section, so
 *    there is nothing to scrollspy — the click handler is the only way the active section
 *    changes, matching the mockup's `.editor-section`/`.editor-section.active` degradation.
 */
export const EditorScrollspyNav = ({
  sections,
  sectionRefs,
  activeSection,
  onSelect,
  isMobile,
}: EditorScrollspyNavProps) => {
  useEffect(() => {
    // On mobile only the active section is mounted at all (see `ProductEditorPage`), so
    // there's nothing for an observer to watch — the tab click is the sole trigger there.
    if (isMobile) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Match by ref identity (not a `data-*` DOM query) — the section that intersected
          // is looked up against the same ref map the click handler uses.
          const matched = sections.find(({ id }) => sectionRefs.current[id] === entry.target);
          if (matched) onSelect(matched.id);
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );

    sections.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections, sectionRefs, isMobile, onSelect]);

  const handleClick = (id: EditorSectionId) => {
    onSelect(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className={cn(
        'flex gap-1',
        isMobile ? 'w-full flex-row overflow-x-auto pb-1' : 'sticky top-20 w-56 shrink-0 flex-col',
      )}
    >
      {sections.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          data-active={activeSection === id}
          onClick={() => handleClick(id)}
          className={cn(
            'rounded-md px-3 py-2 text-start text-[13px] font-medium whitespace-nowrap transition-colors',
            isMobile && 'shrink-0',
            activeSection === id
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  );
};
