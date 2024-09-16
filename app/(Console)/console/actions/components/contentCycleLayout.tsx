// "use client";

// // import { userData } from "./data";
// import React, { useEffect, useState } from "react";
// import SidebarContent from "./sidebarContent";
// interface ChatLayoutProps {
//   children: React.ReactNode;
// //   defaultLayout: number[] | undefined;
// //   defaultCollapsed?: boolean;
// //   navCollapsedSize: number;
// }

// export function contentCycleLayout({
//   children,
// //   defaultLayout = [320, 480],
// //   defaultCollapsed = false,
// //   navCollapsedSize,
// }: ChatLayoutProps) {
// //   const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
// //   const [selectedUser, setSelectedUser] = React.useState(userData[0]);
// //   const [isMobile, setIsMobile] = useState(false);

// //   useEffect(() => {
// //     const checkScreenWidth = () => {
// //       setIsMobile(window.innerWidth <= 768);
// //       sessionStorage.setItem(SessionStorageKeys.IS_MOBILE, "true");
// //     };

// //     // Initial check
// //     checkScreenWidth();

// //     // Event listener for screen width changes
// //     window.addEventListener("resize", checkScreenWidth);

// //     // Cleanup the event listener on component unmount
// //     return () => {
// //       window.removeEventListener("resize", checkScreenWidth);
// //     };
// //   }, []);

//   return (
//     <>
//       <div className="w-full flex mr-4">
//         <div className="w-2/6">
//           <SidebarContent

//           />
//         </div>

//         {children}
//       </div>
//     </>
//   );
// }
