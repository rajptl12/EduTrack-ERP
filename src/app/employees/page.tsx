"use client";

import React, { useState } from "react";
import { useAttendance, Employee } from "@/context/AttendanceContext";
import { Shell } from "@/components/Layout/Shell";
import {
  Search,
  UserPlus,
  X,
  UserCheck,
  Calendar,
  Mail,
  Briefcase,
  Activity,
  Clock,
  ClipboardList,
  Sparkles,
  SearchCode,
  MapPin,
  BookOpen,
  Phone,
  BookOpenCheck
} from "lucide-react";

export default function FacultyDirectory() {
  const { employees, attendanceLogs, leaveRequests, lectures, addEmployee, currentUser } = useAttendance();

  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const todayStr = new Date().toISOString().split("T")[0];

  const getPresenceStatus = (empId: string) => {
    const todayLog = attendanceLogs.find(
      (l) => l.employeeId === empId && l.date === todayStr
    );
    if (!todayLog) return "Away";
    if (todayLog.checkInTime !== "00:00:00") {
      if (!todayLog.checkOutTime) {
        return "Active";
      } else {
        return "Shift Ended";
      }
    }
    return "Away";
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // New Faculty Form State
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpTitle, setNewEmpTitle] = useState("");
  const [newEmpDept, setNewEmpDept] = useState("Computer Science & Engineering");
  const [newEmpRole, setNewEmpRole] = useState<"Admin" | "Employee">("Employee");
  const [newCabin, setNewCabin] = useState("");
  const [newSubjects, setNewSubjects] = useState("");
  const [newContact, setNewContact] = useState("");

  const departments = ["All", ...Array.from(new Set(employees.map((e) => e.department)))];

  // Filters
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.subjects && emp.subjects.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.cabinNumber && emp.cabinNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = deptFilter === "All" || emp.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  // Calculate Employee-specific Statistics
  const getEmployeeStats = (empId: string) => {
    const empLogs = attendanceLogs.filter(l => l.employeeId === empId);
    const presentLogs = empLogs.filter(l => l.checkInTime !== "00:00:00");
    const onTimeLogs = presentLogs.filter(l => l.status === "On Time");

    const totalLogs = empLogs.length || 1;
    const attendanceRate = Math.round((presentLogs.length / totalLogs) * 100);
    const onTimeRate = presentLogs.length > 0 ? Math.round((onTimeLogs.length / presentLogs.length) * 100) : 0;

    // Total Leaves approved
    const empLeaves = leaveRequests.filter(r => r.employeeId === empId && r.status === "Approved");
    const leaveDays = empLeaves.reduce((acc, curr) => {
      const start = new Date(curr.startDate);
      const end = new Date(curr.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return acc + diffDays;
    }, 0);

    // Lecture Conduction stats
    const empLectures = lectures.filter(l => l.facultyId === empId);
    const conductedLectures = empLectures.filter(l => l.status === "Conducted");
    const conductionRate = empLectures.length > 0
      ? Math.round((conductedLectures.length / empLectures.length) * 100)
      : 100;

    return {
      attendanceRate,
      onTimeRate,
      leaveDays,
      totalDays: presentLogs.length,
      lateDays: presentLogs.filter(l => l.status === "Late").length,
      conductionRate,
      totalClasses: empLectures.length,
      conductedClasses: conductedLectures.length
    };
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpEmail || !newEmpTitle || !newEmpDept) {
      alert("Please fill all required fields");
      return;
    }

    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newEmpName)}&backgroundType=gradientLinear&fontSize=42`;

    addEmployee({
      name: newEmpName,
      email: newEmpEmail,
      jobTitle: newEmpTitle,
      department: newEmpDept,
      role: newEmpRole,
      avatar,
      cabinNumber: newCabin || "N/A",
      subjects: newSubjects || "N/A",
      contactNo: newContact || "N/A"
    });

    // Reset Form
    setNewEmpName("");
    setNewEmpEmail("");
    setNewEmpTitle("");
    setNewEmpDept("Computer Science & Engineering");
    setNewEmpRole("Employee");
    setNewCabin("");
    setNewSubjects("");
    setNewContact("");
    setShowAddForm(false);
    alert("Faculty member added successfully!");
  };

  return (
    <Shell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-slate-900 dark:text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Faculty & Staff Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            View academic profiles, cabin room mappings, core subjects taught, and attendance reports.
          </p>
        </div>
        {currentUser?.role === "Admin" && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm shadow-md shadow-teal-500/10 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus size={16} />
            <span>Add Faculty Member</span>
          </button>
        )}
      </div>

      {/* Directory Filter controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, cabin, subjects, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-11 pr-4 py-2.5 rounded-xl border border-border-custom bg-bg-surface text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all shadow-sm font-medium"
          />
        </div>

        {/* Filter Tab pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap transition-all cursor-pointer ${deptFilter === dept
                  ? "bg-brand-teal/10 border-brand-teal text-brand-teal"
                  : "bg-bg-surface border-border-custom text-txt-secondary hover:border-brand-teal/40"
                }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Employee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => {
            const stats = getEmployeeStats(emp.id);
            const presence = getPresenceStatus(emp.id);
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer border border-slate-200/50 dark:border-slate-800/50 group"
              >

                {/* Profile Header card */}
                <div className="flex items-start gap-4 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="h-14 w-14 rounded-2xl bg-bg-base p-1 border border-border-custom group-hover:border-brand-teal/50 transition-colors"
                  />
                  <div className="space-y-1 min-w-0 pr-12">
                    <h3 className="font-bold text-txt-primary text-sm truncate group-hover:text-brand-teal transition-colors">
                      {emp.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-brand-teal truncate">{emp.jobTitle}</p>
                    <p className="text-[10px] text-txt-secondary truncate">{emp.department}</p>

                    <div className="flex gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[9px] bg-bg-base px-2 py-0.5 rounded-full text-txt-secondary font-semibold uppercase tracking-wider border border-border-custom">
                        {emp.cabinNumber || "Admin Block"}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${emp.role === "Admin"
                          ? "bg-brand-indigo/10 text-brand-indigo"
                          : "bg-bg-base text-txt-secondary border border-border-custom"
                        }`}>
                        {emp.role === "Admin" ? "HOD/Dean" : "Faculty"}
                      </span>
                    </div>
                  </div>

                  {/* Presence indicator badge top-right */}
                  <div className="absolute top-0 right-0">
                    {presence === "Active" ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm animate-pulse-slow">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>Present</span>
                      </span>
                    ) : presence === "Shift Ended" ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                        <span>Out</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span>Away</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* mini stats */}
                <div className="grid grid-cols-3 gap-3 border-t border-slate-200/40 dark:border-slate-800/40 pt-4 mt-5 text-center text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Attendance</span>
                    <p className="font-extrabold text-slate-700 dark:text-slate-200">{stats.attendanceRate}%</p>
                  </div>
                  <div className="space-y-1 border-x border-slate-200/30 dark:border-slate-800/30">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lectures</span>
                    <p className="font-extrabold text-teal-600 dark:text-teal-400">{stats.conductionRate}%</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Leaves</span>
                    <p className="font-extrabold text-rose-500">{stats.leaveDays} Days</p>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
            <SearchCode size={36} className="text-slate-300 dark:text-slate-800 animate-bounce" />
            <div>
              <p className="font-semibold text-sm">No faculty members match filters</p>
              <p className="text-xs mt-1">Try updating your query or searching a different department.</p>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL 1: VIEW DETAILS MODAL --- */}
      {selectedEmployee && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSelectedEmployee(null)}
          />
          <div className="fixed inset-x-4 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[480px] z-50 bg-bg-surface border-t sm:border-t-0 sm:border-l border-border-custom rounded-t-3xl sm:rounded-t-none shadow-2xl p-6 sm:p-8 flex flex-col h-[90vh] sm:h-screen overflow-y-auto animate-scale-in">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-txt-secondary">
                Faculty Profile Overview
              </span>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="h-8 w-8 rounded-full hover:bg-bg-base text-txt-secondary flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Header section */}
            <div className="flex flex-col items-center text-center border-b border-slate-200/50 dark:border-slate-800/50 pb-6 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="h-20 w-20 rounded-3xl bg-bg-base p-1.5 border border-brand-teal/20 mb-3 shadow-sm"
              />
              <h2 className="text-xl font-bold text-txt-primary">{selectedEmployee.name}</h2>
              <p className="text-sm font-semibold text-brand-teal">{selectedEmployee.jobTitle}</p>
              <p className="text-xs text-txt-secondary mt-0.5">{selectedEmployee.department}</p>

              <div className="mt-3 text-center">
                {getPresenceStatus(selectedEmployee.id) === "Active" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>RFID Present Today</span>
                  </span>
                ) : getPresenceStatus(selectedEmployee.id) === "Shift Ended" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/25">
                    <span>Shift Ended</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    <span>Off Campus / Away</span>
                  </span>
                )}
              </div>
            </div>

            {/* General Contact Info details */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                Dossier Metadata
              </h4>
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-slate-450" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-slate-450" />
                  <span>Cabin Room: {selectedEmployee.cabinNumber || "Admin Block"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-slate-450" />
                  <span>Subjects: {selectedEmployee.subjects || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-450" />
                  <span>Contact Extension: {selectedEmployee.contactNo || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-slate-450" />
                  <span>Joined Academy on {selectedEmployee.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Performance Analytics statistics */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-2">
                Faculty Metrics
              </h4>

              <div className="grid grid-cols-2 gap-4">

                {/* Swipe Attendance Rate */}
                <div className="p-4 rounded-2xl bg-bg-base border border-border-custom flex flex-col justify-between h-24">
                  <span className="text-[9px] font-bold text-txt-secondary uppercase tracking-wider">Attendance Swipe Rate</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-brand-teal">
                      {getEmployeeStats(selectedEmployee.id).attendanceRate}%
                    </span>
                    <span className="text-[10px] text-txt-secondary">Goal: 90%</span>
                  </div>
                </div>

                {/* Class Conduction Rate */}
                <div className="p-4 rounded-2xl bg-bg-base border border-border-custom flex flex-col justify-between h-24">
                  <span className="text-[9px] font-bold text-txt-secondary uppercase tracking-wider">Class Conduction Rate</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-brand-indigo">
                      {getEmployeeStats(selectedEmployee.id).conductionRate}%
                    </span>
                    <span className="text-[10px] text-txt-secondary">Classes taken</span>
                  </div>
                </div>

                {/* Punctuality Rate */}
                <div className="p-4 rounded-2xl bg-bg-base border border-border-custom flex flex-col justify-between h-24">
                  <span className="text-[9px] font-bold text-txt-secondary uppercase tracking-wider">Swipe Punctuality</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-500">
                      {getEmployeeStats(selectedEmployee.id).onTimeRate}%
                    </span>
                    <span className="text-[10px] text-txt-secondary">On Time</span>
                  </div>
                </div>

                {/* Approved Leave days */}
                <div className="p-4 rounded-2xl bg-bg-base border border-border-custom flex flex-col justify-between h-24">
                  <span className="text-[9px] font-bold text-txt-secondary uppercase tracking-wider">Absences & Leaves</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-rose-500">
                      {getEmployeeStats(selectedEmployee.id).leaveDays}
                    </span>
                    <span className="text-[10px] text-txt-secondary">approved days</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Lecture Conduction History */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                Recent Class Conduction Logs
              </h4>
              <div className="space-y-2">
                {lectures
                  .filter(l => l.facultyId === selectedEmployee.id)
                  .slice(0, 4)
                  .map(lec => (
                    <div key={lec.id} className="flex justify-between items-center text-xs p-3 rounded-xl bg-bg-base border border-border-custom">
                      <div className="space-y-0.5">
                        <span className="font-bold text-txt-primary">{lec.subject} ({lec.courseCode})</span>
                        <div className="flex gap-2 text-txt-secondary text-[10px]">
                          <span>Time: <strong className="text-txt-primary font-medium">{lec.time}</strong></span>
                          <span>Room: <strong className="text-txt-primary font-medium">{lec.room}</strong></span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${lec.status === "Conducted"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : lec.status === "Cancelled"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                            : "bg-amber-500/10 text-amber-500 dark:text-amber-455"
                        }`}>
                        {lec.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Logs for this specific employee */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 mb-1">
                Recent Swipe Swipes
              </h4>
              <div className="space-y-2">
                {attendanceLogs
                  .filter(l => l.employeeId === selectedEmployee.id && l.checkInTime !== "00:00:00")
                  .slice(0, 3)
                  .map(log => (
                    <div key={log.id} className="flex justify-between items-center text-xs p-3 rounded-xl bg-bg-base border border-border-custom">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-txt-primary">{log.date}</span>
                        <div className="flex gap-2 text-txt-secondary text-[10px]">
                          <span>In: <strong className="text-txt-primary font-medium">{log.checkInTime}</strong></span>
                          {log.checkOutTime && (
                            <span>Out: <strong className="text-txt-primary font-medium">{log.checkOutTime}</strong></span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${log.status === "On Time"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                          : "bg-amber-500/10 text-amber-550 dark:text-amber-455"
                        }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* --- MODAL 2: ADD FACULTY MEMBER MODAL (HR/ADMIN VIEW) --- */}
      {showAddForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          <div className="fixed inset-x-4 top-10 bottom-10 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] z-50 bg-bg-surface border-l border-border-custom shadow-2xl p-6 sm:p-8 flex flex-col justify-between h-[90vh] sm:h-screen overflow-y-auto animate-scale-in">

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-6 flex-1 flex flex-col justify-between">

              <div className="space-y-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-txt-primary">
                    Create Faculty Profile
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="h-8 w-8 rounded-full hover:bg-bg-base text-txt-secondary flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-4 text-sm font-semibold text-txt-secondary">
                  {/* Name */}
                  <div className="space-y-1">
                    <label htmlFor="empName" className="block text-xs font-bold uppercase tracking-wider">
                      Faculty Full Name *
                    </label>
                    <input
                      type="text"
                      id="empName"
                      required
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      placeholder="e.g. Dr. Ramesh Kumar"
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="empEmail" className="block text-xs font-bold uppercase tracking-wider">
                      University Email *
                    </label>
                    <input
                      type="email"
                      id="empEmail"
                      required
                      value={newEmpEmail}
                      onChange={(e) => setNewEmpEmail(e.target.value)}
                      placeholder="e.g. ramesh.cse@edu.in"
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label htmlFor="empTitle" className="block text-xs font-bold uppercase tracking-wider">
                      Designation *
                    </label>
                    <input
                      type="text"
                      id="empTitle"
                      required
                      value={newEmpTitle}
                      onChange={(e) => setNewEmpTitle(e.target.value)}
                      placeholder="e.g. Assistant Professor, HOD, Lab Assistant"
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label htmlFor="empDept" className="block text-xs font-bold uppercase tracking-wider">
                      Academic Department *
                    </label>
                    <select
                      id="empDept"
                      required
                      value={newEmpDept}
                      onChange={(e) => setNewEmpDept(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Office of Academic Affairs">Office of Academic Affairs</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>

                  {/* Cabin Room */}
                  <div className="space-y-1">
                    <label htmlFor="empCabin" className="block text-xs font-bold uppercase tracking-wider">
                      Cabin Room Office
                    </label>
                    <input
                      type="text"
                      id="empCabin"
                      value={newCabin}
                      onChange={(e) => setNewCabin(e.target.value)}
                      placeholder="e.g. Block A, Room 405"
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    />
                  </div>

                  {/* Subjects */}
                  <div className="space-y-1">
                    <label htmlFor="empSubjects" className="block text-xs font-bold uppercase tracking-wider">
                      Core Subjects Taught (Comma separated)
                    </label>
                    <input
                      type="text"
                      id="empSubjects"
                      value={newSubjects}
                      onChange={(e) => setNewSubjects(e.target.value)}
                      placeholder="e.g. Data Structures, Computer Networks"
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    />
                  </div>

                  {/* Contact Ext */}
                  <div className="space-y-1">
                    <label htmlFor="empContact" className="block text-xs font-bold uppercase tracking-wider">
                      Contact Extension No
                    </label>
                    <input
                      type="text"
                      id="empContact"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      placeholder="e.g. +91 99999 88888"
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    />
                  </div>

                  {/* System Role */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider">
                      System Permissions Role *
                    </label>
                    <div className="flex gap-4 font-medium text-txt-primary text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="empRole"
                          checked={newEmpRole === "Employee"}
                          onChange={() => setNewEmpRole("Employee")}
                          className="text-brand-teal focus:ring-brand-teal"
                        />
                        <span>Regular Faculty</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="empRole"
                          checked={newEmpRole === "Admin"}
                          onChange={() => setNewEmpRole("Admin")}
                          className="text-brand-teal focus:ring-brand-teal"
                        />
                        <span>HOD / Dean (Admin)</span>
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-border-custom mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 rounded-xl border border-border-custom hover:bg-bg-base text-txt-secondary font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-teal to-brand-indigo hover:opacity-90 text-white font-semibold text-xs transition-all shadow-md shadow-brand-teal/10 active:scale-[0.98] cursor-pointer"
                >
                  Create Profile
                </button>
              </div>

            </form>

          </div>
        </>
      )}

    </Shell>
  );
}
