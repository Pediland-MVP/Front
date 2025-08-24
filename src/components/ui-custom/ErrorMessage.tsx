// src/components/ui-custom/errorMessage.tsx

export const ErrorMessage = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={`text-xs text-red-500 ${className}`}
      id="error_message_custom_for_react_hook_forms"
      {...props}
    >
      {children}
    </p>
  );
};
