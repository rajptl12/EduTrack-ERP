"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { Sparkles, RefreshCw, X, HelpCircle, Users, Check } from "lucide-react";

export const SandboxControls: React.FC = () => {
  const { employees, currentUser, switchUser } = useAttendance();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the sandbox data? This will restore initial mock values.")) {
      localStorage.removeItem("att_employees");
      localStorage.removeItem("att_logs");
      localStorage.removeItem("att_leaves");
      localStorage.removeItem("att_curr_user");
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-brand-teal to-brand-indigo text-white shadow-lg shadow-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-pulse-slow animate-bounce-slow"
          title="Sandbox Controls"
        >
          <Sparkles size={20} />
        </button>
      )}

      {/* Sandbox Controller Panel */}
      {isOpen && (
        <div className="w-85 rounded-2xl border border-border-custom bg-bg-surface backdrop-blur-xl shadow-2xl animate-scale-in flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-brand-teal/10 to-brand-indigo/10 px-4 py-3 border-b border-border-custom flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-teal">
              <Sparkles size={16} />
              <span className="font-bold text-xs uppercase tracking-wider">Sandbox Control Panel</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 rounded-lg hover:bg-bg-base text-txt-secondary flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Panel Content */}
          <div className="p-4 space-y-4">

            {/* Quick explanation */}
            <div className="flex gap-2.5 p-3 rounded-xl bg-brand-indigo/5 border border-brand-indigo/10 text-[11px] text-txt-secondary leading-relaxed font-normal">
              <HelpCircle size={15} className="text-brand-indigo shrink-0 mt-0.5" />
              <span>Simulate different user profiles and permissions roles. Changes persist locally in your browser.</span>
            </div>

            {/* Selector Form */}
            <div className="space-y-1.5">
              <label htmlFor="sandbox-user" className="block text-[10px] font-bold uppercase tracking-wider text-txt-secondary">
                Switch Active Persona
              </label>
              <div className="relative">
                <select
                  id="sandbox-user"
                  value={currentUser.id}
                  onChange={(e) => switchUser(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 pr-8 rounded-xl border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal transition-all font-semibold"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} - {emp.jobTitle})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Role Details */}
            <div className="p-3 rounded-xl bg-bg-base border border-border-custom flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-txt-secondary" />
                <span className="text-txt-secondary">Active Role:</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[9px] uppercase tracking-wider ${currentUser.role === "Admin"
                  ? "bg-brand-indigo/15 text-brand-indigo"
                  : "bg-brand-teal/15 text-brand-teal"
                }`}>
                {currentUser.role}
              </span>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl border border-border-custom hover:bg-rose-500/5 hover:border-rose-500/30 hover:text-rose-500 text-txt-secondary font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <RefreshCw size={13} />
              <span>Reset Sandbox Database</span>
            </button>

          </div>

          {/* Footer status */}
          <div className="bg-bg-base px-4 py-2 border-t border-border-custom flex items-center justify-between text-[10px] text-txt-secondary font-semibold uppercase tracking-wider">
            <span>Environment: Development</span>
            <span className="flex items-center gap-1 text-emerald-500">
              <Check size={11} strokeWidth={3} /> Active
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
