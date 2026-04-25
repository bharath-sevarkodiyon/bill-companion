import { useEffect, useState } from "react";
import { Routes, Route, Navigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Database, Search, LogOut } from "lucide-react";
import FileUploadTab from "@/components/FileUploadTab";
import OverallDataTab from "@/components/OverallDataTab";
import { setSEO } from "@/lib/seo";

const TabLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `relative pb-1 text-sm font-medium transition-colors ${
        isActive ? "text-ink" : "text-slate hover:text-ink"
      } after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:rounded-full after:transition-all ${
        isActive ? "after:bg-ink" : "after:bg-transparent"
      }`
    }
  >
    {children}
  </NavLink>
);

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const isOverall = location.pathname.endsWith("/overall");
    setSEO({
      title: isOverall
        ? "Overall Data — DataExtractor Pro"
        : "File Upload — DataExtractor Pro",
      description:
        "Upload PDF invoices and view aggregated extraction results in DataExtractor Pro.",
    });
  }, [location.pathname]);

  const initials = (user?.email ?? "U")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-cloud">
      <header className="bg-background/80 backdrop-blur border-b border-border sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-deep-navy flex items-center justify-center">
              <img src="/logo.png" alt="Logo" />
            </div>
            <span className="text-lg font-bold text-ink">BILL EXTRACTION</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <TabLink to="/app">File Upload</TabLink>
            <TabLink to="/app/overall">Overall Data</TabLink>
          </nav>

          <div className="flex items-center gap-3">
            {/* <button
              aria-label="Search"
              className="h-9 w-9 rounded-full hover:bg-mist flex items-center justify-center text-slate"
            >
              <Search className="h-4 w-4" />
            </button> */}
            <div className="h-9 w-9 rounded-full bg-deep-navy text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Sign out"
              className="text-slate hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="md:hidden border-t border-border">
          <div className="container flex items-center justify-around h-12">
            <TabLink to="/app">File Upload</TabLink>
            <TabLink to="/app/overall">Overall Data</TabLink>
          </div>
        </nav>
      </header>

      <main className="container py-6">
        <Routes>
          <Route
            index
            element={<FileUploadTab onUploaded={() => setRefreshKey((k) => k + 1)} />}
          />
          <Route path="overall" element={<OverallDataTab refreshKey={refreshKey} />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
