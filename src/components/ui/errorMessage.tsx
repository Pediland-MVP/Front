export default function ErrorMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-red-500 text-xs ${className}`} id="error_message_custom_for_react_hook_forms" {...props}>
      {children}
    </p>
  );
}
