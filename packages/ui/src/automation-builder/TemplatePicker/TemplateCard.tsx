'use client';

import type { TemplateSummary } from './TemplatePicker';

export function TemplateCard({
  template,
  onClick,
}: {
  template: TemplateSummary;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 rounded-lg border p-3 text-right hover:border-blue-300 hover:bg-blue-50/60"
    >
      <div className="bg-muted h-24 w-full overflow-hidden rounded">
        {template.templateImage?.url && (
          <img src={template.templateImage.url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <span className="text-sm font-medium">{template.templateTitle}</span>
      {template.templateDescription && (
        <span className="text-muted-foreground line-clamp-2 text-xs">
          {template.templateDescription}
        </span>
      )}
    </button>
  );
}
