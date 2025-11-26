"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Circle, X } from "lucide-react";
import { getOutOfStockProducts } from "@/lib/db";

export default function OutOfStockPanel() {
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const items = await getOutOfStockProducts();
        setOutOfStockItems(items || []);
      } catch (error) {
        console.error("Failed to fetch out of stock items:", error);
        setOutOfStockItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      {/* Fixed Icon Button - Right Side */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-white p-2.5 rounded-lg shadow-lg border border-neutral-200 hover:shadow-xl hover:scale-105 transition-all"
        title="Out of Stock Items"
      >
        <div className="relative">
          <AlertTriangle className="w-5 h-5 text-neutral-600" />
          {outOfStockItems.length > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {outOfStockItems.length}
            </span>
          )}
        </div>
      </button>

      {/* Sidebar - Only shows when icon is clicked */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Panel */}
          <aside className="fixed right-0 top-0 h-full w-[280px] bg-white shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">Out of Stock</h3>
                  <p className="text-[13px] text-gray-500">{outOfStockItems.length} items</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table Header */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="grid grid-cols-12 gap-2 text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-6">PRODUCT</div>
                <div className="col-span-3">UNIT</div>
                <div className="col-span-3 text-right">STOCK</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                  Loading...
                </div>
              ) : outOfStockItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                  No out of stock items
                </div>
              ) : (
                outOfStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-3 grid grid-cols-12 gap-2 items-center border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="col-span-6 flex items-center gap-2">
                      <Circle className="w-3 h-3 text-gray-300 fill-gray-300" />
                      <span className="text-[13px] text-gray-700 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-[13px] text-gray-500">{item.unit}</span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="inline-flex px-2 py-0.5 rounded bg-red-100 text-red-600 text-[13px] font-semibold">
                        {item.stock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button className="w-full py-3 rounded-xl bg-[#1a1a1a] text-white text-[14px] font-medium hover:bg-black transition-colors">
                View All Reports
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
