import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import FilterBar from "@/components/FilterBar";

export const metadata = {
  title: "Inventory Management - Nawab Cash & Carry",
  description: "Professional Inventory Management System by Airoxlab",
};

export default function InventoryLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Fixed TopBar - Top */}
      <TopBar />

      {/* Fixed Sidebar - Left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-[200px] pt-8">
        {/* Fixed Filter Bar */}
        <FilterBar />

        {/* Page Content - Scrollable Area */}
        <main className="p-5 min-h-[calc(100vh-88px)] bg-[#f8f9fa]">
          {children}
        </main>
      </div>
    </div>
  );
}
