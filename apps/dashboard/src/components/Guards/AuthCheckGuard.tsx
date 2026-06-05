// "use client";

// import { useAuth } from "@/components/Providers/AuthProvider";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// interface AuthCheckGuardProps {
//   children: React.ReactNode;
// }

// export const AuthCheckGuard = ({ children }: AuthCheckGuardProps) => {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (loading) return; // Wait for auth check to complete

//     if (user) {
//       console.log("🔒 User is logged in, redirecting from auth pages to /");
//       router.replace("/");
//     } else {
//       console.log("✅ User not logged in, showing auth page");
//     }
//   }, [user, loading, router]);

//   // Show loading while checking auth
//   if (loading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center">
//         <div className="text-center">
//           <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-violet-600"></div>
//           <p className="mt-2 text-sm text-gray-600">Checking...2222</p>
//         </div>
//       </div>
//     );
//   }

//   // Don't render if user is logged in (should redirect)
//   if (user) {
//     return null;
//   }

//   // Show auth pages only if user is not logged in
//   return <>{children}</>;
// };
