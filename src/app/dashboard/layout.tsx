import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The Suspense boundary is for the useSearchParams hook in child components
    <Suspense fallback={<div>Cargando...</div>}> 
      <SidebarProvider>
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </Suspense>
  );
}
