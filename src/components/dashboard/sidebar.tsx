'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, Truck } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const AppSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/dashboard/products', label: 'Products', icon: Package },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Truck className="size-6 text-primary" />
          <h2
            className={cn(
              'text-lg font-semibold text-foreground',
              'group-data-[collapsible=icon]:hidden'
            )}
          >
            SyncFlow Pro
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-sidebar-foreground/50">© 2024 Majime SyncFlow</p>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
