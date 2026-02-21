// ============================================================
// (app) Layout — Authenticated app shell with Sidebar + Navbar
// DataProvider fetches habits + entries on mount
// ============================================================

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import DataProvider from "@/components/providers/DataProvider";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <div className="flex min-h-screen bg-cosmic-dark">
        {/* Fixed sidebar */}
        <Sidebar />

        {/* Main content area — offset for 72px sidebar */}
        <div className="ml-[72px] flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1">
            <ErrorBoundary fallbackMessage="This page encountered an error. Please try refreshing.">
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
