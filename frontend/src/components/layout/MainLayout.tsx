/**
 * Main layout wrapper — sidebar + header + content area.
 */

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content Area — offset by sidebar width */}
      <div className="flex-1 flex flex-col ml-[260px] transition-all duration-300">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
