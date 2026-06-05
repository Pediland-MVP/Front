// src/components/app-breadcrumb.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppBreadcrumb() {
  return (
    <div className="flex h-8 w-full flex-1 items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">داشبورد</BreadcrumbLink>
          </BreadcrumbItem>
          {/* <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>...</BreadcrumbPage>
          </BreadcrumbItem> */}
        </BreadcrumbList>
      </Breadcrumb>

      {/* <SyncButton /> */}
    </div>
  );
}
