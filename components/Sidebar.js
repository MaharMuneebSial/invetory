"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ListOrdered,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
  Undo2,
  List,
  CreditCard,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/inventory",
    icon: LayoutDashboard,
  },
  {
    name: "Sale Invoice",
    href: "/inventory/sale-invoice",
    icon: FileText,
  },
  {
    name: "Sale Invoices List",
    href: "/inventory/sale-invoices-list",
    icon: ListOrdered,
  },
  {
    name: "Purchase Invoice",
    href: "/inventory/purchase-invoice",
    icon: ShoppingCart,
  },
  {
    name: "Purchase Invoices List",
    href: "/inventory/purchase-invoices-list",
    icon: ClipboardList,
  },
  {
    name: "Purchase Return Invoice",
    href: "/inventory/purchase-return",
    icon: RotateCcw,
  },
  {
    name: "Sale Return Invoice",
    href: "/inventory/sale-return",
    icon: Undo2,
  },
  {
    name: "Sale Return List",
    href: "/inventory/sale-return-list",
    icon: List,
  },
  {
    name: "Payment",
    href: "/inventory/payment",
    icon: CreditCard,
  },
  {
    name: "New Product Entry",
    href: "/inventory/new-product",
    icon: () => (
      <div className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center">
        <span className="text-white text-[11px] font-bold">N</span>
      </div>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-8 h-[calc(100vh-32px)] w-[200px] bg-white border-r border-gray-100 flex flex-col z-40">
      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5
                transition-all duration-200
                ${
                  isActive
                    ? "bg-[#1a1a1a] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              <Icon
                className={`w-[18px] h-[18px] ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              />
              <span className="text-[13px] font-medium leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
