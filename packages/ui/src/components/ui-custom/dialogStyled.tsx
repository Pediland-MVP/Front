"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as Icons from "@phosphor-icons/react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PhosphorIconName = keyof typeof Icons;

type DialogStyledTitleProps = React.ComponentProps<
  typeof DialogPrimitive.Title
> & {
  icon?: PhosphorIconName;
};

function DialogStyled({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogStyledTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogStyledPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogStyledClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogStyledOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function DialogStyledContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogStyledPortal data-slot="dialog-portal">
      <DialogStyledOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] max-h-[90dvh] flex-col translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg duration-200 overflow-hidden sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 left-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogStyledPortal>
  );
}

function DialogStyledHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2 rounded-t-xl border-b bg-stone-50 px-6 py-4 text-center sm:text-right",
        className,
      )}
      {...props}
    />
  );
}

function DialogStyledBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-body" className={cn("flex-1 overflow-y-auto p-6", className)} {...props} />
  );
}

function DialogStyledFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogStyledTitle({
  className,
  icon,
  children,
  ...props
}: DialogStyledTitleProps) {
  const IconComponent = icon
    ? (Icons[icon] as React.ElementType<Icons.IconProps>)
    : null;

  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("flex items-center gap-2 font-medium", className)}
      {...props}
    >
      {IconComponent && <IconComponent size={24} weight="duotone" />}
      {children}
    </DialogPrimitive.Title>
  );
}

function DialogStyledDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  if (!children) return null;

  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Description>
  );
}

export {
  DialogStyled,
  DialogStyledClose,
  DialogStyledContent,
  DialogStyledDescription,
  DialogStyledFooter,
  DialogStyledHeader,
  DialogStyledBody,
  DialogStyledOverlay,
  DialogStyledPortal,
  DialogStyledTitle,
  DialogStyledTrigger,
};
