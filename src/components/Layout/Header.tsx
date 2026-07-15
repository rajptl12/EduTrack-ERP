"use client";

import React, { useState, useEffect } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import {
  Sun,
  Moon,
  Bell,
  UserCheck,
  ChevronDown,
  LogOut,
  Menu,
  Palette,
  Check,
  GraduationCap,
  Calendar,
  Clock,
} from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { employees, currentUser, leaveRequests } = useAttendance();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState<string>("teal");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [accentDropdownOpen, setAccentDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const ACCENT_THEMES = [
    { id: "teal", name: "Teal Aurora", fromColor: "bg-teal-500", toColor: "bg-indigo-500" },
    { id: "violet", name: "Royal Amethyst", fromColor: "bg-violet-500", toColor: "bg-pink-500" },
    { id: "emerald", name: "Emerald Breeze", fromColor: "bg-emerald-500", toColor: "bg-sky-500" },
    { id: "sunset", name: "Sunset Glow", fromColor: "bg-rose-500", toColor: "bg-amber-500" },
    { id: "neon", name: "Cyber Neon", fromColor: "bg-cyan-500", toColor: "bg-fuchsia-500" },
  ];

  // Load and apply theme class on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // Default to light as per user request
      document.documentElement.classList.remove("dark");
    }

    const savedAccent = localStorage.getItem("theme-accent") || "teal";
    setAccent(savedAccent);
    document.documentElement.setAttribute("data-accent", savedAccent);
  }, []);

  // Live clock
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const changeAccent = (newAccent: string) => {
    setAccent(newAccent);
    localStorage.setItem("theme-accent", newAccent);
    document.documentElement.setAttribute("data-accent", newAccent);
    setAccentDropdownOpen(false);
  };

  // Get pending leave requests to act as notifications
  const pendingLeaves = leaveRequests.filter(req => req.status === "Pending");

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border-custom bg-bg-surface backdrop-blur-xl">

      {/* ── Main College Header Bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 gap-4">

        {/* LEFT: Hamburger + College Identity */}
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 text-txt-secondary hover:bg-bg-base rounded-lg cursor-pointer shrink-0"
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>
          )}

          {/* College Emblem */}
          <div className="relative shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-brand-teal to-brand-indigo flex items-center justify-center shadow-lg ring-2 ring-brand-teal/30">
            <GraduationCap size={22} className="text-white" />
          </div>

          {/* College Name & Tagline */}
          <div className="hidden sm:flex flex-col leading-tight min-w-0">
            <span className="text-sm font-extrabold text-txt-primary tracking-tight truncate">
              EduTrack ERP
            </span>
            <span className="text-[10px] text-txt-secondary font-medium tracking-wide truncate">
              Dept. of Administration &amp; Staff Management
            </span>
          </div>
        </div>

        {/* CENTER: Live Date & Time */}
        {currentTime && (
          <div className="hidden md:flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl bg-bg-base border border-border-custom shadow-sm">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-brand-teal shrink-0" />
              <span className="text-base font-black text-txt-primary tabular-nums tracking-tight leading-none">
                {formatTime(currentTime)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={11} className="text-txt-secondary shrink-0" />
              <span className="text-[10px] text-txt-secondary font-medium">
                {formatDate(currentTime)}
              </span>
            </div>
          </div>
        )}

        {/* RIGHT: Action Controls */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-bg-base border border-border-custom transition-all text-txt-primary text-sm font-medium cursor-pointer"
            >
              {currentUser?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-7 w-7 rounded-full bg-bg-base border border-border-custom"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-indigo flex items-center justify-center text-white font-bold text-xs">
                  {currentUser?.name?.[0] ?? "U"}
                </div>
              )}
              <div className="hidden md:flex flex-col leading-none text-left">
                <span className="text-xs font-semibold text-txt-primary max-w-[90px] truncate">{currentUser?.name}</span>
                <span className="text-[10px] text-txt-secondary">{currentUser?.role}</span>
              </div>
              <ChevronDown size={13} className="text-txt-secondary" />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl bg-bg-surface border border-border-custom shadow-xl z-20 py-2 divide-y divide-border-custom animate-scale-in">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-teal to-brand-indigo flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {currentUser?.name?.[0] ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-txt-primary truncate">{currentUser?.name}</p>
                      <p className="text-[10px] text-txt-secondary truncate">{currentUser?.email}</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-txt-secondary uppercase tracking-wider">
                      🎓 EduTrack ERP
                    </div>
                    <div className="px-4 py-1 text-[11px] text-brand-teal font-semibold">
                      Role: {currentUser?.role}
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        alert("In demo mode, logout is disabled. Use the Sandbox controller to switch personas.");
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-rose-500 hover:bg-bg-base transition-colors cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Accent Color Palette Selector */}
          <div className="relative">
            <button
              onClick={() => setAccentDropdownOpen(!accentDropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-bg-base border border-border-custom text-txt-primary transition-colors cursor-pointer"
              aria-label="Change Accent Theme"
              title="Change Theme Accent"
            >
              <Palette size={18} />
            </button>

            {accentDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setAccentDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-bg-surface border border-border-custom shadow-xl z-20 py-2 animate-scale-in">
                  <div className="px-4 py-2 border-b border-border-custom">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-txt-secondary">
                      Accent Themes
                    </span>
                  </div>
                  <div className="p-2 space-y-1">
                    {ACCENT_THEMES.map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => changeAccent(themeOption.id)}
                        className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs text-txt-primary hover:bg-bg-base transition-colors cursor-pointer ${accent === themeOption.id ? "bg-bg-base font-semibold" : ""
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-5 w-5 shrink-0 rounded-full overflow-hidden border border-border-custom">
                            <div className={`w-1/2 h-full ${themeOption.fromColor}`} />
                            <div className={`w-1/2 h-full ${themeOption.toColor}`} />
                          </div>
                          <span>{themeOption.name}</span>
                        </div>
                        {accent === themeOption.id && (
                          <Check size={14} className="text-brand-teal" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-bg-base border border-border-custom text-txt-primary transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-bg-base border border-border-custom text-txt-primary transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {pendingLeaves.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse-slow" />
              )}
            </button>

            {notifDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setNotifDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl bg-bg-surface border border-border-custom shadow-xl z-20 py-2 animate-scale-in">
                  <div className="px-4 py-2 border-b border-border-custom flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-txt-secondary">
                      System Alerts &amp; Inbox
                    </span>
                    <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded-full">
                      {pendingLeaves.length} Action Needed
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-border-custom">
                    {pendingLeaves.length > 0 ? (
                      pendingLeaves.map((req) => {
                        const emp = employees.find((e) => e.id === req.employeeId);
                        return (
                          <div key={req.id} className="p-3.5 hover:bg-bg-base text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-txt-primary">
                                {emp?.name || "Employee"}
                              </span>
                              <span className="text-txt-secondary">applied for</span>
                              <span className="font-bold text-brand-teal">{req.leaveType} Leave</span>
                            </div>
                            <p className="text-txt-secondary line-clamp-1 italic mb-1.5 font-normal">
                              &quot;{req.reason}&quot;
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-txt-secondary">
                              <span>{req.startDate} to {req.endDate}</span>
                              <span className="text-brand-indigo font-semibold">Pending Approval</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-txt-secondary flex flex-col items-center justify-center gap-2 font-normal">
                        <UserCheck size={24} className="text-border-custom" />
                        <span className="text-xs">No pending items to review!</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Mobile: Date/Time Bar ── */}
      {currentTime && (
        <div className="md:hidden flex items-center justify-center gap-3 px-4 pb-2 text-[11px] text-txt-secondary border-t border-border-custom pt-1.5">
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-brand-teal" />
            <span className="font-bold text-txt-primary tabular-nums">{formatTime(currentTime)}</span>
          </span>
          <span className="text-border-custom">·</span>
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(currentTime)}
          </span>
        </div>
      )}
    </header>
  );
};
