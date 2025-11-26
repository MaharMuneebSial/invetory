"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { getSaleInvoices } from "@/lib/db";

export default function FilterBar() {
  const [activeTab, setActiveTab] = useState("today");
  const [salesTotal, setSalesTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calculate date ranges
  const getDateRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          label: "Today's Sale"
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        return {
          start: weekStart,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          label: "This Week"
        };
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: monthStart,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          label: "This Month"
        };
      default:
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          label: "Today's Sale"
        };
    }
  };

  // Fetch and calculate sales
  const fetchSales = async (period) => {
    setLoading(true);
    try {
      const invoices = await getSaleInvoices();
      const { start, end } = getDateRange(period);

      // Filter invoices by date range
      const filteredInvoices = (invoices || []).filter((invoice) => {
        const invoiceDate = new Date(invoice.created_at || invoice.date);
        return invoiceDate >= start && invoiceDate < end;
      });

      // Calculate total
      const total = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
      setSalesTotal(total);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      setSalesTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when tab changes
  useEffect(() => {
    fetchSales(activeTab);
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toLocaleString("en-PK")}`;
  };

  // Get label based on active tab
  const getLabel = () => {
    switch (activeTab) {
      case "today": return "Today's Sale";
      case "week": return "Week's Sale";
      case "month": return "Month's Sale";
      default: return "Today's Sale";
    }
  };

  return (
    <div className="h-9 bg-white border-b border-gray-100 flex items-center justify-start px-4">
      {/* Left Side - Date Tabs */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleTabChange("today")}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
            activeTab === "today"
              ? "bg-[#1a1a1a] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => handleTabChange("week")}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
            activeTab === "week"
              ? "bg-[#1a1a1a] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => handleTabChange("month")}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
            activeTab === "month"
              ? "bg-[#1a1a1a] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          This Month
        </button>
      </div>

      {/* Sales Counter */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 ml-4">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[11px] font-medium text-emerald-600">{getLabel()}</span>
        {loading ? (
          <span className="text-[13px] font-bold text-emerald-600">...</span>
        ) : (
          <span className="text-[13px] font-bold text-emerald-600">{formatCurrency(salesTotal)}</span>
        )}
      </div>
    </div>
  );
}
