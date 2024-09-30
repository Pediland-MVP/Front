export default function ErrorMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-red-500 text-xs ${className}`} {...props}>
      {children}
    </p>
  );
}
