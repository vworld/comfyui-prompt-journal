"use client";

import { NavLink, useLocation } from "react-router";

import type { MenuItems } from "@/components/layout/AppSidebar";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({ items }: Readonly<{ items: MenuItems[] }>) {
  const { pathname } = useLocation();
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((subItem) => (
              <SidebarMenuItem key={subItem.title}>
                <NavLink to={subItem.url}>
                  <SidebarMenuButton isActive={pathname === subItem.url} tooltip={subItem.title}>
                    <span className="flex gap-2">
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                    </span>
                  </SidebarMenuButton>
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
