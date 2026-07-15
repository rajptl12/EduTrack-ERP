"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SandboxControls } from "./SandboxControls";
import { Menu } from "lucide-react";

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-bg-base text-txt-primary transition-colors duration-300">
      
      {/* Desktop Sidebar (Left side) */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex w-64 flex-1 flex-col bg-bg-surface border-r border-border-custom animate-scale-in">
            <Sidebar isOpen={true} setIsOpen={() => {}} onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header containing persona switcher, theme toggles, etc */}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 max-w-7xl w-full mx-auto animate-fade-in-up">
          {children}
        </main>
      </div>

      {/* Sandbox Controls Floating Panel */}
      <SandboxControls />

    </div>
  );
};
