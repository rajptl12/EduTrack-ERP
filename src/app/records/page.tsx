"use client";

import React, { useState } from "react";
import { useAttendance, AttendanceLog, LectureSchedule } from "@/context/AttendanceContext";
import { Shell } from "@/components/Layout/Shell";
import { 
  Search, 
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  Grid3X3, 
  FilterX, 
  ArrowUpDown,
  SearchCode,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  UserCheck
} from "lucide-react";

export default function AcademicRecords() {
  const { attendanceLogs, employees, lectures } = useAttendance();

  const [activeTab, setActiveTab] = useState<"swipes" | "classes">("swipes");

  // Filter Swipes States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  
  // Sort state
  const [sortField, setSortField] = useState<"date" | "checkInTime">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDateFilter("");
    setCurrentPage(1);
  };

  // Sort toggle handler
  const handleSort = (field: "date" | "checkInTime") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filter logs for Swipes Tab
  const filteredLogs = attendanceLogs
    .filter((log) => {
      const emp = employees.find((e) => e.id === log.employeeId);
      if (!emp) return false;

      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || log.status === statusFilter;
      const matchesDate = !dateFilter || log.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const valA = a[sortField] || "";
      const valB = b[sortField] || "";

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Filter lectures for Classes Tab
  const filteredLectures = lectures
    .filter((lec) => {
      const emp = employees.find((e) => e.id === lec.facultyId);
      if (!emp) return false;

      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lec.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lec.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || lec.status === statusFilter;
      const matchesDate = !dateFilter || lec.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      // Sort classes by date desc, then by time string
      if (a.date !== b.date) {
        return a.date > b.date ? -1 : 1;
      }
      return a.time > b.time ? 1 : -1;
    });

  // Pagination calculations
  const totalItems = activeTab === "swipes" ? filteredLogs.length : filteredLectures.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const adjustedPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedLogs = filteredLogs.slice(
    (adjustedPage - 1) * itemsPerPage,
    adjustedPage * itemsPerPage
  );

  const paginatedLectures = filteredLectures.slice(
    (adjustedPage - 1) * itemsPerPage,
    adjustedPage * itemsPerPage
  );

  // Export to CSV Function
  const exportToCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = "";

    if (activeTab === "swipes") {
      headers = ["Date", "Faculty ID", "Name", "Department", "RFID Swipe In", "RFID Swipe Out", "Swipe Status", "Notes / Remarks", "Location Zone", "IP Address"];
      rows = filteredLogs.map((log) => {
        const emp = employees.find((e) => e.id === log.employeeId);
        return [
          log.date,
          log.employeeId,
          emp?.name || "Unknown",
          emp?.department || "Unknown",
          log.checkInTime,
          log.checkOutTime || "N/A",
          log.status,
          log.notes || "",
          log.location,
          log.ipAddress
        ];
      });
      filename = `Faculty_Swipe_Records_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      headers = ["Date", "Faculty ID", "Name", "Department", "Subject Title", "Course Code", "Semester", "Room", "Time Schedule", "Conduction Status"];
      rows = filteredLectures.map((lec) => {
        const emp = employees.find((e) => e.id === lec.facultyId);
        return [
          lec.date,
          lec.facultyId,
          emp?.name || "Unknown",
          emp?.department || "Unknown",
          lec.subject,
          lec.courseCode,
          lec.semester,
          lec.room,
          lec.time,
          lec.status
        ];
      });
      filename = `Lecture_Conduction_Logs_${new Date().toISOString().split("T")[0]}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Shell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-slate-900 dark:text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Academic Records & Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Access swipe times, Geofence connections, and class schedules conduction sheets.
          </p>
        </div>
        
        <button
          onClick={exportToCSV}
          disabled={totalItems === 0}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-500/10 transition-all cursor-pointer active:scale-95"
        >
          <Download size={16} />
          <span>Export {activeTab === "swipes" ? "Swipes" : "Classes"} to CSV</span>
        </button>
      </div>

      {/* Tabs Control */}
      <div className="flex gap-2 p-1.5 bg-bg-surface border border-border-custom rounded-2xl mb-8 max-w-sm">
        <button
          onClick={() => { setActiveTab("swipes"); handleResetFilters(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "swipes"
              ? "bg-brand-teal text-white shadow-md shadow-brand-teal/15"
              : "text-txt-secondary hover:text-txt-primary hover:bg-bg-base"
          }`}
        >
          <UserCheck size={14} />
          <span>Faculty Swipe Logs</span>
        </button>
        <button
          onClick={() => { setActiveTab("classes"); handleResetFilters(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "classes"
              ? "bg-brand-teal text-white shadow-md shadow-brand-teal/15"
              : "text-txt-secondary hover:text-txt-primary hover:bg-bg-base"
          }`}
        >
          <BookOpen size={14} />
          <span>Class Conduction</span>
        </button>
      </div>

      {/* Filter Options Area */}
      <div className="glass-panel p-5 rounded-2xl mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-txt-secondary mb-4 flex items-center gap-1.5">
          <Grid3X3 size={14} />
          <span>Filter Parameters</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
          
          {/* Search Employee Name/ID */}
          <div className="space-y-1.5 font-bold text-txt-secondary">
            <label htmlFor="search">Search Text</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={activeTab === "swipes" ? "e.g. Keshav, CSE" : "e.g. CS-302, Priya"}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5 font-bold text-txt-secondary">
            <label htmlFor="status">Conduction/Swipe Status</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium cursor-pointer"
            >
              {activeTab === "swipes" ? (
                <>
                  <option value="All">All Swipes</option>
                  <option value="On Time">On Time</option>
                  <option value="Late">Late Check-in</option>
                  <option value="Absent">Absent</option>
                </>
              ) : (
                <>
                  <option value="All">All Schedules</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Conducted">Conducted</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rescheduled">Rescheduled</option>
                </>
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5 font-bold text-txt-secondary">
            <label htmlFor="date">Select Calendar Date</label>
            <div className="relative">
              <input
                type="date"
                id="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all [color-scheme:light] dark:[color-scheme:dark] font-medium cursor-pointer"
              />
            </div>
          </div>

          {/* Reset Filters button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 rounded-xl border border-border-custom hover:bg-bg-base text-txt-secondary transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold active:scale-[0.98]"
            >
              <FilterX size={14} />
              <span>Clear Filter Parameters</span>
            </button>
          </div>

        </div>
      </div>

      {/* Logs Table / Cards Area */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-md">
        
        {/* TAB 1: SWIPES VIEW */}
        {activeTab === "swipes" && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-base border-b border-border-custom text-[10px] font-bold uppercase tracking-wider text-txt-secondary">
                    <th 
                      onClick={() => handleSort("date")}
                      className="py-4 px-6 cursor-pointer hover:text-brand-teal select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-6">Faculty Member</th>
                    <th className="py-4 px-6">Academic Department</th>
                    <th 
                      onClick={() => handleSort("checkInTime")}
                      className="py-4 px-6 cursor-pointer hover:text-brand-teal select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Swipe In Time</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-6">Swipe Out Time</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 hidden lg:table-cell">Remarks / Notes</th>
                    <th className="py-4 px-6 hidden md:table-cell">Zone & IP Address</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-border-custom text-xs">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      const emp = employees.find((e) => e.id === log.employeeId);
                      
                      return (
                        <tr 
                          key={log.id} 
                          className="hover:bg-bg-base/40 transition-all text-txt-primary"
                        >
                          <td className="py-3.5 px-6 font-semibold whitespace-nowrap text-txt-primary">
                            <div className="flex items-center gap-2">
                              <Calendar size={13} className="text-txt-secondary" />
                              <span>{log.date}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={emp?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                                alt={emp?.name}
                                className="h-7 w-7 rounded-lg bg-bg-base border border-border-custom"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-txt-primary truncate">{emp?.name || "Unknown"}</p>
                                <p className="text-[9px] text-txt-secondary tracking-wide font-medium">{log.employeeId}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap uppercase tracking-wider font-semibold text-[10px] text-txt-secondary">
                            {emp?.department || "N/A"}
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap font-mono text-txt-primary font-semibold">
                            {log.checkInTime !== "00:00:00" ? log.checkInTime : "-"}
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap font-mono text-txt-primary font-semibold">
                            {log.checkOutTime ? log.checkOutTime : "-"}
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              log.status === "On Time"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10"
                                : log.status === "Late"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-455 border border-amber-500/10"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10"
                            }`}>
                              {log.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 hidden lg:table-cell max-w-xs truncate text-txt-secondary italic font-normal">
                            {log.notes || "-"}
                          </td>

                          <td className="py-3.5 px-6 hidden md:table-cell whitespace-nowrap text-txt-secondary">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 font-semibold text-[10px] text-txt-primary">
                                <MapPin size={11} className="text-txt-secondary" />
                                <span className="truncate max-w-[130px]">{log.location}</span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[9px]">
                                <Clock size={11} className="text-txt-secondary" />
                                <span>{log.ipAddress}</span>
                              </div>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-txt-secondary">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <SearchCode size={36} className="text-border-custom" />
                          <div>
                            <p className="font-semibold text-sm">No swipe records found</p>
                            <p className="text-xs mt-1">Try relaxing filters.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Swipe Mobile Cards */}
            <div className="md:hidden divide-y divide-border-custom/50 bg-bg-surface text-xs">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const emp = employees.find((e) => e.id === log.employeeId);
                  return (
                    <div key={log.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={emp?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                            alt={emp?.name}
                            className="h-8 w-8 rounded-lg bg-bg-base border border-border-custom"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-txt-primary truncate">{emp?.name || "Unknown"}</p>
                            <p className="text-[10px] text-txt-secondary">{log.employeeId} • {emp?.department}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                          log.status === "On Time"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                            : log.status === "Late"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-455"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border-custom/30 pt-2.5 text-txt-secondary font-medium">
                        <div>
                          <span className="uppercase text-[8px] font-bold text-txt-secondary tracking-wider">Date</span>
                          <p className="font-semibold text-txt-primary mt-0.5">{log.date}</p>
                        </div>
                        <div>
                          <span className="uppercase text-[8px] font-bold text-txt-secondary tracking-wider">RFID Swipe Times</span>
                          <p className="font-mono text-txt-primary mt-0.5">
                            In: {log.checkInTime !== "00:00:00" ? log.checkInTime : "-"} / Out: {log.checkOutTime || "-"}
                          </p>
                        </div>
                      </div>
                      
                      {log.notes && (
                        <p className="text-[10px] text-txt-secondary italic bg-bg-base px-2 py-1 rounded border border-border-custom/50 font-normal">
                          &quot;{log.notes}&quot;
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-txt-secondary flex flex-col items-center justify-center gap-3">
                  <SearchCode size={36} className="text-border-custom" />
                  <span className="text-xs">No attendance swipes found.</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: CLASSES VIEW */}
        {activeTab === "classes" && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-base border-b border-border-custom text-[10px] font-bold uppercase tracking-wider text-txt-secondary">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Faculty Member</th>
                    <th className="py-4 px-6">Subject & Code</th>
                    <th className="py-4 px-6">Semester</th>
                    <th className="py-4 px-6">Room / LH</th>
                    <th className="py-4 px-6">Scheduled Time</th>
                    <th className="py-4 px-6">Conduction Status</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-border-custom text-xs">
                  {paginatedLectures.length > 0 ? (
                    paginatedLectures.map((lec) => {
                      const emp = employees.find((e) => e.id === lec.facultyId);
                      
                      return (
                        <tr 
                          key={lec.id} 
                          className="hover:bg-bg-base/40 transition-all text-txt-primary"
                        >
                          <td className="py-3.5 px-6 font-semibold whitespace-nowrap text-txt-primary">
                            <div className="flex items-center gap-2">
                              <Calendar size={13} className="text-txt-secondary" />
                              <span>{lec.date}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={emp?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                                alt={emp?.name}
                                className="h-7 w-7 rounded-lg bg-bg-base border border-border-custom"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-txt-primary truncate">{emp?.name || "Unknown"}</p>
                                <p className="text-[9px] text-txt-secondary tracking-wide font-medium">{lec.facultyId}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap font-bold text-txt-primary">
                            <div className="space-y-0.5">
                              <p>{lec.subject}</p>
                              <span className="text-[9px] bg-bg-base border border-border-custom text-txt-secondary px-1.5 py-0.5 rounded font-bold uppercase">
                                {lec.courseCode}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap font-semibold text-txt-secondary">
                            {lec.semester}
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap font-semibold text-txt-primary">
                            {lec.room}
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap font-mono font-semibold text-txt-primary">
                            {lec.time}
                          </td>

                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              lec.status === "Conducted"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10"
                                : lec.status === "Cancelled"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10"
                                : lec.status === "Rescheduled"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10"
                                : "bg-border-custom text-txt-secondary border border-border-custom"
                            }`}>
                              {lec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-txt-secondary">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <SearchCode size={36} className="text-border-custom" />
                          <div>
                            <p className="font-semibold text-sm">No lecture logs found</p>
                            <p className="text-xs mt-1">Try relaxing filters.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Classes Mobile Cards */}
            <div className="md:hidden divide-y divide-border-custom/50 bg-bg-surface text-xs">
              {paginatedLectures.length > 0 ? (
                paginatedLectures.map((lec) => {
                  const emp = employees.find((e) => e.id === lec.facultyId);
                  return (
                    <div key={lec.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={emp?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                            alt={emp?.name}
                            className="h-8 w-8 rounded-lg bg-bg-base border border-border-custom"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-txt-primary truncate">{emp?.name || "Unknown"}</p>
                            <p className="text-[10px] text-txt-secondary">{lec.semester}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                          lec.status === "Conducted"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : lec.status === "Cancelled"
                            ? "bg-rose-500/10 text-rose-650 dark:text-rose-450"
                            : "bg-amber-500/10 text-amber-500 dark:text-amber-455"
                        }`}>
                          {lec.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border-custom/30 pt-2.5 text-txt-secondary font-medium">
                        <div>
                          <span className="uppercase text-[8px] font-bold text-txt-secondary tracking-wider">Subject</span>
                          <p className="font-bold text-txt-primary mt-0.5">{lec.subject} ({lec.courseCode})</p>
                        </div>
                        <div>
                          <span className="uppercase text-[8px] font-bold text-txt-secondary tracking-wider">Schedule</span>
                          <p className="font-mono text-txt-primary mt-0.5">
                            {lec.time} @ Room {lec.room}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-txt-secondary flex flex-col items-center justify-center gap-3">
                  <SearchCode size={36} className="text-border-custom" />
                  <span className="text-xs">No classes schedules logged.</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Count footer summary panel */}
        {totalItems > 0 && (
          <div className="py-3 px-6 bg-bg-base border-t border-border-custom text-[10px] uppercase font-bold tracking-wider text-txt-secondary flex justify-between items-center">
            <span>Showing {activeTab === "swipes" ? paginatedLogs.length : paginatedLectures.length} of {totalItems} logs</span>
            <span>Refreshed Live</span>
          </div>
        )}

        {/* Pagination Controller */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-custom bg-bg-surface px-6 py-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                disabled={adjustedPage === 1}
                onClick={() => setCurrentPage(adjustedPage - 1)}
                className={`relative inline-flex items-center rounded-xl border border-border-custom bg-bg-surface px-4 py-2 text-xs font-semibold text-txt-primary hover:bg-bg-base transition-colors cursor-pointer ${
                  adjustedPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Previous
              </button>
              <button
                disabled={adjustedPage === totalPages}
                onClick={() => setCurrentPage(adjustedPage + 1)}
                className={`relative ml-3 inline-flex items-center rounded-xl border border-border-custom bg-bg-surface px-4 py-2 text-xs font-semibold text-txt-primary hover:bg-bg-base transition-colors cursor-pointer ${
                  adjustedPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-txt-secondary">
                  Showing <span className="font-semibold text-txt-primary">{(adjustedPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-semibold text-txt-primary">
                    {Math.min(adjustedPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of <span className="font-semibold text-txt-primary">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm gap-1" aria-label="Pagination">
                  <button
                    disabled={adjustedPage === 1}
                    onClick={() => setCurrentPage(adjustedPage - 1)}
                    className={`relative inline-flex items-center rounded-xl px-2.5 py-1.5 text-txt-secondary border border-border-custom hover:bg-bg-base cursor-pointer ${
                      adjustedPage === 1 ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`relative inline-flex items-center rounded-xl px-3.5 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
                        p === adjustedPage
                          ? "z-10 bg-brand-teal border-brand-teal text-white shadow-sm"
                          : "border-border-custom hover:bg-bg-base text-txt-secondary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={adjustedPage === totalPages}
                    onClick={() => setCurrentPage(adjustedPage + 1)}
                    className={`relative inline-flex items-center rounded-xl px-2.5 py-1.5 text-txt-secondary border border-border-custom hover:bg-bg-base cursor-pointer ${
                      adjustedPage === totalPages ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

      </div>
    </Shell>
  );
}
