import { NavLink, useLocation } from "react-router";

import type { MenuData } from "@/components/layout/AppSidebar";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavRecentItems({ groupItem }: Readonly<{ groupItem: MenuData["recentItems"] }>) {
  const { pathname } = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupItem.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {groupItem.items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={pathname === item.url}>
                <NavLink to={item.url}>
                  <span className="flex gap-2">
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
