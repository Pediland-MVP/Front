// src/app/(auth)/layout.tsx

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-sidebar flex h-screen items-center justify-center px-3">{children}</div>
  );
}
