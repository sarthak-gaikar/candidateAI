/**
 * Main application layout.
 *
 * Sidebar + header + page content.
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className="min-h-screen flex flex-col transition-[margin-left] duration-300"
        style={{
          marginLeft: collapsed ? "72px" : "260px",
        }}
      >
        <Header />

        <main className="flex-1 min-w-0 px-5 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}