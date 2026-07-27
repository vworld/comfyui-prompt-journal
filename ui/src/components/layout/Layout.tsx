import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider defaultOpen={false} className="h-dvh overflow-hidden">
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
