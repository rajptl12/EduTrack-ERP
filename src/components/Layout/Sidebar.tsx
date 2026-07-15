"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarRange,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  History
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, onCloseMobile }) => {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard Portal", href: "/", icon: LayoutDashboard },
    { name: "Faculty Directory", href: "/employees", icon: Users },
    { name: "Academic Records", href: "/records", icon: Clock },
    { name: "Leave & Duty Portal", href: "/leaves", icon: CalendarRange },
    { name: "History Registry", href: "/history", icon: History },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-border-custom bg-bg-surface backdrop-blur-xl transition-all duration-300 ease-in-out ${isOpen ? "w-64" : "w-20"
        }`}
    >
      {/* Brand Logo Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border-custom">
        <div className="flex items-center gap-3 overflow-hidden pl-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-teal to-brand-indigo text-white font-bold text-lg shadow-md shadow-brand-teal/20">
            E
          </div>
          {isOpen && (
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-txt-primary to-txt-secondary bg-clip-text text-transparent transition-opacity duration-300">
              EduTrack ERP
            </span>
          )}
        </div>
        {onCloseMobile ? (
          <button
            onClick={onCloseMobile}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-bg-base text-txt-secondary cursor-pointer animate-scale-in"
            aria-label="Close Menu"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-bg-base text-txt-secondary cursor-pointer"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${isActive
                ? "bg-brand-teal/10 text-brand-teal border-l-4 border-brand-teal"
                : "text-txt-secondary hover:bg-bg-base hover:text-txt-primary"
                }`}
            >
              <item.icon
                size={20}
                className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-brand-teal" : "text-txt-secondary group-hover:text-txt-primary"
                  }`}
              />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${!isOpen ? "opacity-0 md:group-hover:opacity-100 md:group-hover:absolute md:group-hover:left-16 md:group-hover:bg-slate-900 md:group-hover:text-white md:group-hover:px-3 md:group-hover:py-1.5 md:group-hover:rounded-md md:group-hover:shadow-md" : "opacity-100"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
};
