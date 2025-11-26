"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ListOrdered,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
  Undo2,
  List,
  CreditCard,
  PackagePlus,
  TrendingUp,
  Users,
  Landmark,
  Wallet,
  Receipt,
} from "lucide-react";
import { getDashboardStats } from "@/lib/db";

// Quick action buttons - matching sidebar items with black icons
const quickActions = [
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
    icon: PackagePlus,
  },
];

export default function InventoryDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statsRow1 = [
    {
      title: "Total Sale",
      value: stats ? `Rs ${stats.totalSales?.toLocaleString() || 0}` : "Rs 0",
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      title: "Customer Balances",
      value: stats ? `Rs ${stats.customerBalances?.toLocaleString() || 0}` : "Rs 0",
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      title: "Cash In Hand",
      value: stats ? `Rs ${stats.cashInHand?.toLocaleString() || 0}` : "Rs 0",
      icon: Wallet,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
    },
  ];

  const statsRow2 = [
    {
      title: "Balance in Bank",
      value: stats ? `Rs ${stats.bankBalance?.toLocaleString() || 0}` : "Rs 0",
      icon: Landmark,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
    },
    {
      title: "Total Purchase",
      value: stats ? `Rs ${stats.totalPurchases?.toLocaleString() || 0}` : "Rs 0",
      icon: ShoppingCart,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-500",
    },
    {
      title: "Expenses",
      value: stats ? `Rs ${stats.totalExpenses?.toLocaleString() || 0}` : "Rs 0",
      icon: Receipt,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-[22px] font-bold text-gray-900">Dashboard</h1>
        <p className="text-[13px] text-gray-500">Welcome back, System Administrator</p>
      </div>

      {/* Quick Actions - Compact cards with black background icons */}
      <div className="grid grid-cols-9 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-1.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#333] transition-colors">
                <Icon className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                {action.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-3 gap-5">
        {statsRow1.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                {stat.change && (
                  <span className={`text-[13px] font-semibold ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-500 font-medium">{stat.title}</p>
              <p className="text-[22px] font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-3 gap-5">
        {statsRow2.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                {stat.change && (
                  <span className={`text-[13px] font-semibold ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-500 font-medium">{stat.title}</p>
              <p className="text-[22px] font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
