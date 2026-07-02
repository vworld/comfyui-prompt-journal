import { BookText, type LucideIcon, SquareStar } from "lucide-react";

import logo from "@/assets/logo.svg";
import { NavMain } from "@/components/layout/NavMain";
// import { NavRecentItems } from "@/components/layout/NavRecentItems";
import SidebarFooterApp from "@/components/layout/SidebarStats";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";

export interface MenuItems {
  title: string;
  url: string;
  icon?: LucideIcon;
}
export interface MenuData {
  navItem: MenuItems[];
  recentItems: {
    title: string;
    items: MenuItems[];
  };
}

const menuData: MenuData = {
  navItem: [
    { title: "Review Console", url: "/", icon: SquareStar },
    { title: "Browse Generations", url: "/browse-generation", icon: SquareStar },
  ],
  recentItems: {
    title: "Recent Projects",
    items: [
      { title: "Project 1", url: "#", icon: BookText },
      { title: "Project 2", url: "#", icon: BookText },
    ],
  },
};

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="floating">
      <SidebarHeader>
        <div className="flex items-center h-18 p-2 gap-6">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <div className="flex flex-col h-full">
            <div className="text-lg font-bold">Prompt Journal</div>
            <div className="text-sm text-muted-foreground">v{__APP_VERSION__}</div>
          </div>
        </div>
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuData.navItem} />
        <Separator className="mt-12" />
        {/* <NavRecentItems groupItem={menuData.recentItems} /> */}
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterApp />
      </SidebarFooter>
    </Sidebar>
  );
}
