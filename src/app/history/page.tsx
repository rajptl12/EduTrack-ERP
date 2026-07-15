"use client";

import React, { useState, useEffect } from "react";
import { useAttendance, LeaveRequest } from "@/context/AttendanceContext";
import { Shell } from "@/components/Layout/Shell";
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Briefcase,
  MapPin,
  ExternalLink,
  X,
  AlertTriangle,
  ArrowUpDown,
  CornerDownLeft,
  ChevronDown
} from "lucide-react";

type SortField = "employee" | "type" | "duration" | "applied" | "status";
type SortDirection = "asc" | "desc";

export default function HistoryRegistry() {
  const { currentUser, employees, leaveRequests, updateLeaveStatus } = useAttendance();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Sort State
  const [sortField, setSortField] = useState<SortField>("applied");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Selected Cell Coordinate State (Excel Sheet coordinates)
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colLetter: string; reqId: string } | null>(null);
  const [selectedCellValue, setSelectedCellValue] = useState<string>("");

  // Inline Cell Editing States (Admins only)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [tempRemark, setTempRemark] = useState<string>("");

  // Modal State for Detailed Audit
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Formula Bar States
  const [formulaDropdownOpen, setFormulaDropdownOpen] = useState(false);

  const FORMULAS = [
    { name: "=SUM(DURATION)", desc: "Total sum of leave days in filtered grid" },
    { name: "=AVERAGE(DURATION)", desc: "Average leave length in filtered grid" },
    { name: "=COUNTIF(APPROVED)", desc: "Total approved count in filtered grid" },
    { name: "=COUNTIF(PENDING)", desc: "Total pending count in filtered grid" },
    { name: "=COUNTIF(REJECTED)", desc: "Total rejected count in filtered grid" }
  ];

  const evaluateFormula = (val: string): string => {
    if (!val.startsWith("=")) return val;
    const clean = val.toUpperCase().trim();
    if (clean === "=SUM(DURATION)") {
      const sum = filteredRequests.reduce((acc, req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return acc + diff;
      }, 0);
      return `${sum} days`;
    }
    if (clean === "=AVERAGE(DURATION)") {
      if (filteredRequests.length === 0) return "0 days";
      const sum = filteredRequests.reduce((acc, req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return acc + diff;
      }, 0);
      return `${(sum / filteredRequests.length).toFixed(1)} days`;
    }
    if (clean === "=COUNTIF(APPROVED)") {
      const count = filteredRequests.filter((r) => r.status === "Approved").length;
      return `${count} records`;
    }
    if (clean === "=COUNTIF(PENDING)") {
      const count = filteredRequests.filter((r) => r.status === "Pending").length;
      return `${count} records`;
    }
    if (clean === "=COUNTIF(REJECTED)") {
      const count = filteredRequests.filter((r) => r.status === "Rejected").length;
      return `${count} records`;
    }
    return `N/A (Syntax Error)`;
  };

  // Sync selected cell value when requests change
  useEffect(() => {
    if (selectedCell) {
      const req = leaveRequests.find((r) => r.id === selectedCell.reqId);
      if (req) {
        let value = "";
        const emp = employees.find((e) => e.id === req.employeeId);
        switch (selectedCell.colLetter) {
          case "A":
            value = emp?.name || "Unknown";
            break;
          case "B":
            value = `${req.leaveType} Leave`;
            break;
          case "C":
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            value = `${diffDays} days (${req.startDate} to ${req.endDate})`;
            break;
          case "D":
            value = req.appliedOn;
            break;
          case "E":
            value = req.reason;
            break;
          case "F":
            value = req.status;
            break;
          case "G":
            value = req.hodComment || "";
            break;
        }
        setSelectedCellValue(value);
      }
    }
  }, [leaveRequests, selectedCell, employees]);

  if (!currentUser) {
    return (
      <Shell>
        <div className="py-20 text-center text-txt-secondary flex flex-col items-center justify-center gap-4">
          <AlertTriangle size={48} className="text-amber-500 animate-pulse" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm">Please log in to view the history registry.</p>
        </div>
      </Shell>
    );
  }

  const isAdmin = currentUser.role === "Admin";

  // Filter requests based on user role
  const userRequests = isAdmin
    ? leaveRequests
    : leaveRequests.filter((req) => req.employeeId === currentUser.id);

  // Apply search query, filters, and sorting
  const filteredRequests = userRequests
    .filter((req) => {
      const emp = employees.find((e) => e.id === req.employeeId);

      const matchesSearch = isAdmin
        ? emp?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.dutyEventName && req.dutyEventName.toLowerCase().includes(searchQuery.toLowerCase()))
        : req.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.dutyEventName && req.dutyEventName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "All" || req.status === statusFilter;
      const matchesType = typeFilter === "All" || req.leaveType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      const empA = employees.find((e) => e.id === a.employeeId)?.name || "";
      const empB = employees.find((e) => e.id === b.employeeId)?.name || "";

      switch (sortField) {
        case "employee":
          comparison = empA.localeCompare(empB);
          break;
        case "type":
          comparison = a.leaveType.localeCompare(b.leaveType);
          break;
        case "duration":
          const startA = new Date(a.startDate).getTime();
          const endA = new Date(a.endDate).getTime();
          const durationA = endA - startA;
          const startB = new Date(b.startDate).getTime();
          const endB = new Date(b.endDate).getTime();
          const durationB = endB - startB;
          comparison = durationA - durationB;
          break;
        case "applied":
          comparison = a.appliedOn.localeCompare(b.appliedOn);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Calculate Stats
  const totalRequestsCount = userRequests.length;
  const approvedRequestsCount = userRequests.filter((r) => r.status === "Approved").length;
  const pendingRequestsCount = userRequests.filter((r) => r.status === "Pending").length;
  const dutyLeavesCount = userRequests.filter((r) => r.leaveType === "Duty").length;

  // Organization-wide metrics for HOD
  const orgTotalProcessed = approvedRequestsCount + userRequests.filter((r) => r.status === "Rejected").length;
  const approvalRate = orgTotalProcessed > 0
    ? Math.round((approvedRequestsCount / orgTotalProcessed) * 100)
    : 100;

  // Click handler to select cell
  const handleCellSelect = (rowIdx: number, colLetter: string, reqId: string, cellValue: string) => {
    setSelectedCell({ rowIdx, colLetter, reqId });
    setSelectedCellValue(cellValue);
  };

  // Sort toggle handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Excel (.xls) file export with full CSS styling matching the chosen accent
  const handleExportExcel = () => {
    if (filteredRequests.length === 0) {
      alert("No records to export.");
      return;
    }

    // Get active theme colors to style Excel header
    const savedAccent = localStorage.getItem("theme-accent") || "teal";
    let headerColor = "#0d9488"; // default teal
    if (savedAccent === "violet") headerColor = "#8b5cf6";
    else if (savedAccent === "emerald") headerColor = "#059669";
    else if (savedAccent === "sunset") headerColor = "#f43f5e";
    else if (savedAccent === "neon") headerColor = "#06b6d4";

    let rowsHTML = "";
    filteredRequests.forEach((req, idx) => {
      const emp = employees.find((e) => e.id === req.employeeId);
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const statusStyle = req.status === "Approved"
        ? "background-color: #dcfce7; color: #166534;"
        : req.status === "Rejected"
          ? "background-color: #fee2e2; color: #991b1b;"
          : "background-color: #fef3c7; color: #92400e;";

      rowsHTML += `
        <tr>
          <td style="text-align: center; background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: bold; color: #64748b;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: 600;">${emp?.name || "Unknown"}</td>
          <td style="border: 1px solid #cbd5e1;">${req.leaveType} Leave</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${req.startDate} to ${req.endDate}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${diffDays} days</td>
          <td style="border: 1px solid #cbd5e1; text-align: center;">${req.appliedOn}</td>
          <td style="border: 1px solid #cbd5e1; font-style: italic;">${req.reason}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; ${statusStyle}">${req.status}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: 500;">${req.hodComment || ""}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Leave Registry Sheet</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
          th { background-color: ${headerColor}; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; text-align: left; padding: 6px; }
          td { padding: 6px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center; background-color: #475569;">Row</th>
              <th style="width: 160px;">Faculty Member</th>
              <th style="width: 130px;">Leave Classification</th>
              <th style="width: 170px; text-align: center;">Requested Duration</th>
              <th style="width: 70px; text-align: center;">Days</th>
              <th style="width: 90px; text-align: center;">Applied On</th>
              <th style="width: 260px;">Reason Summary</th>
              <th style="width: 100px; text-align: center;">Review Status</th>
              <th style="width: 220px;">HOD Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Leave_Registry_Sheet_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Inline Status cell save trigger
  const handleInlineStatusChange = (reqId: string, newStatus: "Approved" | "Rejected" | "Pending", currentComment?: string) => {
    // If the mock backend requires Approved or Rejected, let standard updates run.
    if (newStatus === "Pending") {
      alert("Demo mode: Cannot set status back to Pending.");
      setEditingStatusId(null);
      return;
    }
    updateLeaveStatus(reqId, newStatus, currentComment);
    setEditingStatusId(null);
    setSelectedCell(null);
  };

  // Inline HOD remarks cell save trigger
  const handleInlineRemarksSave = (reqId: string, status: LeaveRequest["status"]) => {
    updateLeaveStatus(reqId, status === "Pending" ? "Approved" : status, tempRemark);
    setEditingRemarksId(null);
    setSelectedCell(null);
  };

  // Formula bar edit comment trigger
  const handleFormulaBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCell && selectedCell.colLetter === "G" && isAdmin) {
      const req = leaveRequests.find((r) => r.id === selectedCell.reqId);
      if (req) {
        updateLeaveStatus(req.id, req.status === "Pending" ? "Approved" : req.status, selectedCellValue);
        alert("Cell updated successfully!");
        setSelectedCell(null);
      }
    }
  };

  // Render official letterhead template scan for Duty Leaves
  const renderPreviewLetter = (req: LeaveRequest) => {
    const emp = employees.find((e) => e.id === req.employeeId);
    let org = "Indian Institute of Technology, Delhi";
    let reference = "Ref No: IITD/CSE/2026/EX-802";
    let signatory = "Dr. P. K. Gupta (Chairperson, CSE Dept, IITD)";
    let body = `This is to formally request the services of ${emp?.name || "Faculty Member"}, Department of ${emp?.department || "CSE"}, as the External Examiner for the upcoming Practical and Oral Examinations of B.Tech. 8th Semester Projects. The examinations are scheduled to be conducted on campus from ${req.startDate} to ${req.endDate}. Duty leaves and travel allowances are recommended for the examiner as per standard board procedures.`;

    if (req.dutyDocName?.includes("ieee_board")) {
      org = "IEEE Delhi Section Headquarters";
      reference = "Ref No: IEEE/DEL/ADM-103";
      signatory = "Prof. S. R. Sen (Convenor, IEEE Delhi ExeCom)";
      body = `We are pleased to nominate ${emp?.name || "Faculty Member"} to attend the Executive Committee Board Meeting of the IEEE Delhi Section. The delegation meeting is scheduled to be held in Varanasi from ${req.startDate} to ${req.endDate} to finalize the guidelines for the regional symposium. We request that the nominee be treated on Official University Duty.`;
    } else if (req.dutyDocName?.includes("paper_acceptance")) {
      org = "IEEE International Conference on Cognitive Tech";
      reference = "Ref No: IEEE/ICCT-2026/PAPER-924";
      signatory = "Dr. Alok Nath (General Chair, IEEE ICCT-2026)";
      body = `We congratulate ${emp?.name || "Faculty Member"} on the selection of their peer-reviewed paper "Cognitive Edge Computing Frameworks for Academic Portals" for oral presentation at the IEEE ICCT-2026 Conference. We invite the author to present the paper live at the conference venue in Varanasi from ${req.startDate} to ${req.endDate}. Please approve official Duty Leave for the presenter.`;
    } else if (req.dutyDocName?.includes("guest_lecture")) {
      org = "University of Delhi, Faculty of Technology";
      reference = "Ref No: DU/TECH/GL/2026/410";
      signatory = "Dr. Meenakshi Iyer (Dean, Faculty of Tech, DU)";
      body = `We invite ${emp?.name || "Faculty Member"} to deliver an Expert Lecture on "Emerging Trends in Web Infrastructure Layouts" for our postgraduate scholars. The session will take place at the Seminar Auditorium from ${req.startDate} to ${req.endDate}. We request the host academy to approve Duty Leave (DL) for this academic assignment.`;
    }

    return (
      <div
        className="relative overflow-hidden bg-white text-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200/60 font-serif leading-relaxed text-[11px] max-w-md mx-auto"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Animated Scanner Scan Bar Effect */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60 animate-pulse" />

        {/* Diagonal Watermark Stamp */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] transform -rotate-12 pointer-events-none select-none select-all font-sans font-black text-4xl text-emerald-800 border-8 border-double border-emerald-800 p-3 rounded-2xl tracking-widest uppercase">
          VERIFIED
        </div>

        {/* Tilted Stamp Ink Seal */}
        <div className="absolute bottom-[22%] right-[8%] opacity-25 transform -rotate-12 pointer-events-none select-none">
          <div className="border-[3px] border-emerald-600 rounded-full h-16 w-16 flex flex-col items-center justify-center font-bold text-emerald-600 text-[6.5px] leading-tight uppercase p-1">
            <span>OFFICIAL SCAN</span>
            <span className="font-extrabold text-[8px] tracking-wider text-emerald-700">EduTrack ERP</span>
            <span>ACADEMIC</span>
          </div>
        </div>

        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">{org}</h2>
          <p className="text-[9px] font-sans text-slate-400 italic mt-0.5">Academic Affairs & External Engagements</p>
          <div className="flex justify-between text-[8px] font-sans text-slate-400 mt-2 font-semibold">
            <span>{reference}</span>
            <span>Date: {req.appliedOn}</span>
          </div>
        </div>

        <div className="mb-3 font-sans text-[9px]">
          <p className="font-bold text-slate-950">To,</p>
          <p className="font-bold text-slate-900">The Head of Department / Dean</p>
          <p className="text-slate-600">{emp?.department}</p>
          <p className="text-slate-600">EduTime Academy of Sciences</p>
        </div>

        <div className="mb-3 font-sans font-bold text-slate-950 uppercase border-y border-dashed border-slate-200 py-1.5 text-[9px]">
          Subject: Request for Faculty Release on Official Duty.
        </div>

        <div className="mb-4 leading-relaxed font-sans text-slate-700 whitespace-pre-line text-[10px] font-normal">
          {body}
        </div>

        <div className="flex justify-between items-end pt-3 font-sans text-[9px] border-t border-slate-100 relative z-10">
          <div>
            <p className="italic text-slate-400">Scan verified via EduTrack ERP</p>
            <p className="text-[8px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50 w-max shadow-sm shadow-emerald-500/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CERTIFIED ORDER</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-950 font-serif italic text-xs text-brand-indigo/80 select-none pb-0.5">
              {signatory.split(" (")[0]?.replace("Dr. ", "")?.replace("Prof. ", "")}
            </p>
            <p className="font-bold text-slate-950">{signatory.split(" (")[0]}</p>
            <p className="text-slate-500 text-[8px] font-semibold">{signatory.split(" (")[1]?.replace(")", "")}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Shell>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <History size={26} className="text-brand-teal" />
            <span>History Registry Sheet</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {isAdmin
              ? "Spreadsheet grid view of leave requests with inline editing and audit logs."
              : "Spreadsheet view of your leave classifications, durations, and approval status."}
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-bg-surface border border-border-custom hover:bg-bg-base text-txt-primary font-bold text-xs transition-all cursor-pointer shadow-sm shadow-brand-teal/5"
        >
          <Download size={14} className="text-brand-teal" />
          <span>Export to Excel (.xls)</span>
        </button>
      </div>
      {/* Dashboard Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {isAdmin ? (
          <>
            {/* Card 1: Sheet Row Count */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-brand-teal/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-brand-teal/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-txt-secondary flex items-center gap-1.5">
                  <FileText size={12} className="text-brand-teal" />
                  <span>Worksheet Rows</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-txt-primary">{totalRequestsCount}</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">Total logs in active sheet</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                <FileText size={20} />
              </div>
            </div>

            {/* Card 2: Unprocessed Cells */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-amber-500/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pending Cells</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-amber-500">{pendingRequestsCount}</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">Awaiting status decision</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle size={18} />
              </div>
            </div>

            {/* Card 3: Org Approval Rate */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-emerald-500/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>Approval Rate</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-txt-primary">{approvalRate}%</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">Processed cells ratio</p>
              </div>
              <div className="relative h-12 w-12 flex items-center justify-center shrink-0 ml-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="2.5" className="text-border-custom" fill="transparent" />
                  <circle cx="24" cy="24" r="19" stroke="var(--brand-teal)" strokeWidth="3.5" strokeDasharray={119.3} strokeDashoffset={119.3 - (119.3 * approvalRate) / 100} className="transition-all duration-1000 ease-out" fill="transparent" strokeLinecap="round" />
                </svg>
                <span className="absolute text-[9px] font-black text-brand-teal">{approvalRate}%</span>
              </div>
            </div>

            {/* Card 4: Duty Leaves */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-brand-indigo/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-brand-indigo/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-indigo flex items-center gap-1.5">
                  <Briefcase size={12} className="text-brand-indigo" />
                  <span>Duty Leaves (DL)</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-brand-indigo">{dutyLeavesCount}</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">Total off-campus duties</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo shrink-0">
                <Briefcase size={18} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Card 1: Requested Rows */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-brand-teal/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-brand-teal/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-txt-secondary flex items-center gap-1.5">
                  <FileText size={12} className="text-brand-teal" />
                  <span>Requested Rows</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-txt-primary">{totalRequestsCount}</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">Personal registry count</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                <FileText size={20} />
              </div>
            </div>

            {/* Card 2: Approved Leaves */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-emerald-500/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-500" />
                  <span>Approved Leaves</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-emerald-500">{approvedRequestsCount}</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">Authorized grid items</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle size={18} />
              </div>
            </div>

            {/* Card 3: Pending Approvals */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-amber-500/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pending Approvals</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-amber-500">{pendingRequestsCount}</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">Awaiting HOD verification</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle size={18} />
              </div>
            </div>

            {/* Card 4: Duty Leaves */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border border-border-custom/80 shadow-md transition-all hover:shadow-lg hover:border-brand-indigo/30 hover:scale-[1.01] duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-brand-indigo/5 rounded-full blur-xl pointer-events-none" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-indigo flex items-center gap-1.5">
                  <Briefcase size={12} className="text-brand-indigo" />
                  <span>Duty Leaves (DL)</span>
                </p>
                <h3 className="text-2xl font-black mt-2 text-brand-indigo">{dutyLeavesCount}</h3>
                <p className="text-[9px] text-txt-secondary font-semibold mt-1">External engagements</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo shrink-0">
                <Briefcase size={18} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Database Registry Filter Block */}
      <div className="glass-panel p-4 rounded-2xl space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border-custom pb-4 text-xs font-semibold">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 text-txt-secondary" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAdmin ? "Search by name, reason or duty event..." : "Search by reason or duty event..."}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Classification Filter */}
            <div className="flex items-center gap-1.5 text-txt-secondary font-bold w-full sm:w-auto">
              <Filter size={14} className="text-brand-teal" />
              <span className="uppercase tracking-wider mr-1 hidden sm:inline">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto text-[11px] px-3 py-1.5 rounded-lg border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal cursor-pointer font-semibold"
              >
                <option value="All">All Classifications</option>
                <option value="Casual">Casual Leave (CL)</option>
                <option value="Sick">Sick Leave (SL)</option>
                <option value="Annual">Annual Leave</option>
                <option value="Duty">Duty Leave (DL)</option>
                <option value="Maternity/Paternity">Maternity/Paternity</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-txt-secondary font-bold w-full sm:w-auto">
              <span className="uppercase tracking-wider mr-1 hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto text-[11px] px-3 py-1.5 rounded-lg border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal cursor-pointer font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending Decision</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Excel Formula Bar */}
        <div className="relative flex flex-col gap-1 w-full">
          <form onSubmit={handleFormulaBarSubmit} className="flex items-center gap-2 bg-bg-base/60 border border-border-custom rounded-xl p-2 text-xs font-mono select-none">
            <div className="flex items-center justify-center font-bold px-3 py-1 rounded bg-bg-surface border border-border-custom text-brand-teal shrink-0 min-w-[50px] text-center">
              {selectedCell ? `${selectedCell.colLetter}${selectedCell.rowIdx}` : "—"}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setFormulaDropdownOpen(!formulaDropdownOpen)}
                className="font-serif italic font-extrabold text-txt-secondary hover:text-brand-teal px-2 text-sm border-r border-border-custom pr-3 select-none cursor-pointer flex items-center gap-1 hover:bg-bg-surface/50 rounded py-0.5"
                title="Click to view helper formulas"
              >
                <span>fx</span>
                <ChevronDown size={12} className="text-txt-secondary" />
              </button>

              {formulaDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFormulaDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 bg-bg-surface border border-border-custom shadow-xl rounded-2xl z-20 py-2.5 divide-y divide-border-custom animate-scale-in text-left">
                    <div className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-txt-secondary">
                      Spreadsheet Formulas
                    </div>
                    <div className="p-1.5 space-y-0.5 font-sans font-medium text-xs">
                      {FORMULAS.map((f) => (
                        <button
                          key={f.name}
                          type="button"
                          onClick={() => {
                            setSelectedCellValue(f.name);
                            if (selectedCell && selectedCell.colLetter === "G" && isAdmin) {
                              setTempRemark(f.name);
                            }
                            setFormulaDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-bg-base transition-colors flex flex-col gap-0.5 cursor-pointer text-txt-primary"
                        >
                          <span className="font-mono font-bold text-brand-teal text-[11px]">{f.name}</span>
                          <span className="text-[10px] text-txt-secondary">{f.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <input
              type="text"
              value={selectedCellValue}
              onChange={(e) => {
                setSelectedCellValue(e.target.value);
                if (selectedCell && selectedCell.colLetter === "G" && isAdmin) {
                  setTempRemark(e.target.value);
                }
              }}
              readOnly={!selectedCell || selectedCell.colLetter !== "G" || !isAdmin}
              placeholder={
                selectedCell
                  ? (selectedCell.colLetter === "G" && isAdmin ? "Edit HOD Remarks in Formula Bar and click checkmark or press Enter..." : `View Cell Value`)
                  : "Select any cell in the sheet grid to audit its value..."
              }
              className="flex-1 bg-transparent border-0 px-2 py-1 focus:outline-none text-txt-primary font-semibold text-xs"
            />

            {selectedCellValue.startsWith("=") && (
              <div className="ml-2 px-2.5 py-1 rounded bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo font-bold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1.5 animate-scale-in">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-indigo animate-pulse" />
                <span>Result: {evaluateFormula(selectedCellValue)}</span>
              </div>
            )}

            {selectedCell && selectedCell.colLetter === "G" && isAdmin && (
              <button
                type="submit"
                title="Save value to active cell"
                className="h-7 w-7 rounded bg-brand-teal/15 text-brand-teal border border-brand-teal/20 flex items-center justify-center hover:bg-brand-teal hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <CornerDownLeft size={12} />
              </button>
            )}
          </form>
        </div>


        {/* Spreadsheet Worksheet Layout */}
        <div className="overflow-x-auto border border-border-custom rounded-xl bg-bg-surface">
          <table className="w-full border-collapse text-left text-xs font-semibold select-text min-w-[900px] table-fixed">
            <thead>
              <tr className="bg-bg-base border-b border-border-custom font-mono text-center text-txt-secondary text-[10px] select-none h-7">
                <th className="w-10 border-r border-border-custom bg-bg-base select-none"></th>
                {isAdmin && <th className="w-44 border-r border-border-custom text-center">A</th>}
                <th className="w-36 border-r border-border-custom text-center">B</th>
                <th className="w-44 border-r border-border-custom text-center">C</th>
                <th className="w-28 border-r border-border-custom text-center">D</th>
                <th className="w-32 border-r border-border-custom text-center">E</th>
                <th className="w-56 border-r border-border-custom text-center">F</th>
                <th className="w-32 border-r border-border-custom text-center">G</th>
                <th className="w-52 border-r border-border-custom text-center">H</th>
                <th className="w-24 text-center">I</th>
              </tr>

              <tr className="border-b border-border-custom text-txt-secondary text-[10px] uppercase tracking-wider font-extrabold bg-bg-base/40 h-10 select-none">
                <th className="border-r border-border-custom bg-bg-base text-center font-mono">Row</th>

                {isAdmin && (
                  <th
                    onClick={() => handleSort("employee")}
                    className="px-4 border-r border-border-custom cursor-pointer hover:bg-bg-base/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Faculty Member</span>
                      <ArrowUpDown size={12} className="text-txt-secondary" />
                    </div>
                  </th>
                )}

                <th
                  onClick={() => handleSort("type")}
                  className="px-4 border-r border-border-custom cursor-pointer hover:bg-bg-base/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Classification</span>
                    <ArrowUpDown size={12} className="text-txt-secondary" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("duration")}
                  className="px-4 border-r border-border-custom cursor-pointer hover:bg-bg-base/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Requested Duration</span>
                    <ArrowUpDown size={12} className="text-txt-secondary" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("applied")}
                  className="px-4 border-r border-border-custom cursor-pointer hover:bg-bg-base/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Applied On</span>
                    <ArrowUpDown size={12} className="text-txt-secondary" />
                  </div>
                </th>

                <th className="px-4 border-r border-border-custom">Reason Summary</th>

                <th
                  onClick={() => handleSort("status")}
                  className="px-4 border-r border-border-custom cursor-pointer hover:bg-bg-base/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Review Status</span>
                    <ArrowUpDown size={12} className="text-txt-secondary" />
                  </div>
                </th>

                <th className="px-4 border-r border-border-custom">HOD Review Remarks</th>

                <th className="px-4 text-center">Sheet Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-custom font-medium">
              {filteredRequests.map((req, index) => {
                const emp = employees.find((e) => e.id === req.employeeId);
                const rowNum = index + 1;

                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                return (
                  <tr key={req.id} className="hover:bg-bg-base/10 transition-colors select-none text-[11px] h-11 border-b border-border-custom">
                    <td className="bg-bg-base/70 border-r border-border-custom font-mono text-center text-txt-secondary select-none font-bold">
                      {rowNum}
                    </td>

                    {isAdmin && (
                      <td
                        onClick={() => handleCellSelect(rowNum, "A", req.id, emp?.name || "")}
                        className={`px-3.5 border-r border-border-custom truncate transition-all ${selectedCell?.rowIdx === rowNum && selectedCell?.colLetter === "A"
                          ? "outline-2 outline-brand-teal outline-offset-[-2px] bg-brand-teal/5"
                          : ""
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={emp?.avatar} alt="" className="h-5 w-5 rounded-full bg-bg-base shrink-0" />
                          <span className="font-semibold text-txt-primary truncate">{emp?.name}</span>
                        </div>
                      </td>
                    )}

                    <td
                      onClick={() => handleCellSelect(rowNum, "B", req.id, `${req.leaveType} Leave`)}
                      className={`px-4 border-r border-border-custom truncate transition-all ${selectedCell?.rowIdx === rowNum && selectedCell?.colLetter === "B"
                        ? "outline-2 outline-brand-teal outline-offset-[-2px] bg-brand-teal/5"
                        : ""
                        }`}
                    >
                      <span className="text-txt-primary">{req.leaveType} Leave</span>
                      {req.leaveType === "Duty" && req.dutyEventName && (
                        <span className="text-[10px] text-brand-teal block font-semibold truncate">({req.dutyEventName})</span>
                      )}
                    </td>

                    <td
                      onClick={() => handleCellSelect(rowNum, "C", req.id, `${diffDays} days (${req.startDate} to ${req.endDate})`)}
                      className={`px-4 border-r border-border-custom truncate transition-all ${selectedCell?.rowIdx === rowNum && selectedCell?.colLetter === "C"
                        ? "outline-2 outline-brand-teal outline-offset-[-2px] bg-brand-teal/5"
                        : ""
                        }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 text-txt-primary">
                        <span className="truncate">{req.startDate} to {req.endDate}</span>
                        <span className="text-[10px] text-txt-secondary font-bold shrink-0">({diffDays} d)</span>
                      </div>
                    </td>

                    <td
                      onClick={() => handleCellSelect(rowNum, "D", req.id, req.appliedOn)}
                      className={`px-4 border-r border-border-custom truncate text-txt-secondary transition-all ${selectedCell?.rowIdx === rowNum && selectedCell?.colLetter === "D"
                        ? "outline-2 outline-brand-teal outline-offset-[-2px] bg-brand-teal/5"
                        : ""
                        }`}
                    >
                      {req.appliedOn}
                    </td>

                    <td
                      onClick={() => handleCellSelect(rowNum, "E", req.id, req.reason)}
                      className={`px-4 border-r border-border-custom truncate transition-all ${selectedCell?.rowIdx === rowNum && selectedCell?.colLetter === "E"
                        ? "outline-2 outline-brand-teal outline-offset-[-2px] bg-brand-teal/5"
                        : ""
                        }`}
                    >
                      <span className="text-txt-secondary font-normal italic line-clamp-1" title={req.reason}>
                        &quot;{req.reason}&quot;
                      </span>
                    </td>

                    <td
                      onClick={() => handleCellSelect(rowNum, "F", req.id, req.status)}
                      className={`px-3.5 border-r border-border-custom transition-all relative ${selectedCell?.rowIdx === rowNum && selectedCell?.colLetter === "F"
                        ? "outline-2 outline-brand-teal outline-offset-[-2px] bg-brand-teal/5"
                        : ""
                        }`}
                      onDoubleClick={() => isAdmin && setEditingStatusId(req.id)}
                    >
                      {editingStatusId === req.id && isAdmin ? (
                        <div className="flex items-center w-full" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={req.status}
                            onChange={(e) => handleInlineStatusChange(req.id, e.target.value as any, req.hodComment)}
                            onBlur={() => setEditingStatusId(null)}
                            autoFocus
                            className="w-full text-[10px] py-1 border border-border-custom rounded bg-bg-surface text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-teal cursor-pointer font-bold uppercase tracking-wider"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${req.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                            : req.status === "Rejected"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}>
                            {req.status}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingStatusId(req.id); }}
                              className="opacity-0 group-hover:opacity-100 absolute right-2 hover:bg-bg-base p-0.5 rounded text-txt-secondary hover:text-txt-primary cursor-pointer transition-opacity"
                              title="Double click or tap to edit status inline"
                            >
                              <ChevronDown size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td
                      onClick={() => handleCellSelect(rowNum, "G", req.id, req.hodComment || "")}
                      className={`px-4 border-r border-border-custom transition-all relative truncate ${selectedCell?.rowIdx === rowNum && selectedCell?.colLetter === "G"
                        ? "outline-2 outline-brand-teal outline-offset-[-2px] bg-brand-teal/5"
                        : ""
                        }`}
                      onDoubleClick={() => {
                        if (isAdmin) {
                          setEditingRemarksId(req.id);
                          setTempRemark(req.hodComment || "");
                        }
                      }}
                    >
                      {editingRemarksId === req.id && isAdmin ? (
                        <div className="flex items-center gap-1.5 w-full h-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempRemark}
                            onChange={(e) => setTempRemark(e.target.value)}
                            onBlur={() => handleInlineRemarksSave(req.id, req.status)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleInlineRemarksSave(req.id, req.status);
                              if (e.key === "Escape") setEditingRemarksId(null);
                            }}
                            autoFocus
                            className="w-full text-[10px] px-2 py-1 border border-border-custom rounded bg-bg-surface text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-teal font-semibold"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group h-full">
                          <p className="text-txt-secondary font-normal italic truncate pr-4">
                            {req.hodComment || <span className="text-border-custom not-italic font-mono text-[9px]">—</span>}
                          </p>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRemarksId(req.id);
                                setTempRemark(req.hodComment || "");
                              }}
                              className="opacity-0 group-hover:opacity-100 absolute right-2 hover:bg-bg-base px-1.5 py-0.5 border border-border-custom/50 rounded text-[9px] text-txt-secondary hover:text-txt-primary cursor-pointer transition-opacity font-bold uppercase"
                              title="Double click or tap to write remarks inline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-2 py-1 rounded bg-bg-base hover:bg-border-custom/25 border border-border-custom hover:border-txt-secondary/20 text-[9px] text-txt-primary hover:text-brand-teal transition-all cursor-pointer font-bold uppercase tracking-wider"
                      >
                        View Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sheet tab switcher mimic at bottom */}
        <div className="flex items-center border-t border-border-custom pt-4 bg-bg-base/10 px-2 text-[10px] font-mono select-none rounded-b-2xl">
          <div className="flex items-center rounded-t-lg bg-bg-surface border-x border-t border-border-custom px-3 py-1 font-bold text-brand-teal border-b-2 border-b-brand-teal">
            LeaveRegistry_2026
          </div>
          <div className="px-3 py-1 text-txt-secondary font-medium cursor-not-allowed hover:bg-bg-base/30 rounded-t-lg">
            Attendance_Logs
          </div>
          <div className="px-3 py-1 text-txt-secondary font-medium cursor-not-allowed hover:bg-bg-base/30 rounded-t-lg">
            Faculty_Database
          </div>
        </div>
      </div>

      {/* VIEW VERIFICATION MODAL OVERLAY */}
      {
        selectedRequest && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setSelectedRequest(null)}
            />
            <div className="fixed inset-x-4 top-10 bottom-10 md:inset-y-0 md:right-0 md:left-auto md:w-[500px] z-50 bg-bg-surface border-l border-border-custom shadow-2xl p-6 sm:p-8 flex flex-col justify-between h-[90vh] sm:h-screen overflow-y-auto animate-scale-in">
              <div className="space-y-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border-custom pb-4">
                  <div className="flex items-center gap-2 text-brand-teal">
                    <FileText size={18} />
                    <span className="font-extrabold text-xs uppercase tracking-wider">Leave Record Audit Trail</span>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="h-8 w-8 rounded-full hover:bg-bg-base text-txt-secondary flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Leave Basic Details Card */}
                <div className="p-4 rounded-xl bg-bg-base border border-border-custom space-y-3.5 text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-txt-secondary uppercase tracking-wider">Leave Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${selectedRequest.status === "Approved"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                      : selectedRequest.status === "Rejected"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div className="border-t border-border-custom/50 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-txt-secondary uppercase tracking-wider">Applied By</span>
                    <span className="text-txt-primary">
                      {employees.find(e => e.id === selectedRequest.employeeId)?.name || "Unknown"}
                    </span>
                  </div>

                  <div className="border-t border-border-custom/50 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-txt-secondary uppercase tracking-wider">Classification</span>
                    <span className="text-txt-primary">{selectedRequest.leaveType} Leave</span>
                  </div>

                  <div className="border-t border-border-custom/50 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-txt-secondary uppercase tracking-wider">Requested Duration</span>
                    <span className="text-txt-primary flex items-center gap-1">
                      <Calendar size={11} className="text-txt-secondary" />
                      {selectedRequest.startDate} to {selectedRequest.endDate}
                    </span>
                  </div>

                  <div className="border-t border-border-custom/50 pt-3 flex items-center justify-between">
                    <span className="text-[10px] text-txt-secondary uppercase tracking-wider">Submitted Date</span>
                    <span className="text-txt-primary font-medium">{selectedRequest.appliedOn}</span>
                  </div>
                </div>

                {/* Leave Reason Content */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-txt-secondary">Reason / Details Provided</h4>
                  <div className="p-4 rounded-xl bg-bg-base/50 border border-border-custom/75 text-xs text-txt-primary font-medium leading-relaxed italic">
                    &quot;{selectedRequest.reason}&quot;
                  </div>
                </div>

                {/* HOD Review Comments */}
                {selectedRequest.status !== "Pending" && (
                  <div className="space-y-1.5 animate-scale-in">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-txt-secondary">HOD Decision Audit Trail</h4>
                    <div className="p-4 rounded-xl border border-border-custom bg-bg-base/40 text-xs">
                      <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider mb-2 text-txt-secondary">
                        {selectedRequest.status === "Approved" ? (
                          <CheckCircle size={13} className="text-emerald-500" />
                        ) : (
                          <XCircle size={13} className="text-rose-500" />
                        )}
                        <span>Reviewed and {selectedRequest.status.toLowerCase()}</span>
                      </div>
                      {selectedRequest.hodComment ? (
                        <p className="text-txt-primary leading-relaxed font-semibold italic mt-1">
                          &quot;{selectedRequest.hodComment}&quot;
                        </p>
                      ) : (
                        <p className="text-txt-secondary leading-relaxed font-normal italic mt-1">
                          No HOD commentary remarks provided.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Duty Leave Verification Section */}
                {selectedRequest.leaveType === "Duty" && selectedRequest.dutyEventName && (
                  <div className="space-y-3.5 border-t border-border-custom pt-4 animate-fade-in-up">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-teal">
                      <Briefcase size={14} />
                      <span>Official Duty Order details</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-txt-secondary">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-wider">Duty Assignment / Event</p>
                        <p className="text-txt-primary font-bold">{selectedRequest.dutyEventName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-wider">Venue / Location</p>
                        <p className="text-txt-primary font-bold">{selectedRequest.dutyLocation}</p>
                      </div>
                    </div>

                    {selectedRequest.dutyDocName && (
                      <div className="space-y-3.5 pt-1.5">
                        <div className="p-3 border border-brand-teal/20 bg-brand-teal/5 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0 font-semibold">
                            <div className="h-8 w-8 rounded-lg bg-brand-teal/15 text-brand-teal flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-txt-primary truncate text-[10px]">{selectedRequest.dutyDocName}</p>
                              <p className="text-[9px] text-txt-secondary font-medium">Verified PDF scan</p>
                            </div>
                          </div>
                          <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-wider shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Verified
                          </span>
                        </div>

                        {/* Official Invitation Letter Scan */}
                        <div className="mt-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-txt-secondary mb-2 text-center">Simulated Invitation Letter Scan</p>
                          <div className="border border-border-custom rounded-2xl p-1 bg-slate-100 shadow-inner">
                            {renderPreviewLetter(selectedRequest)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full mt-6 py-2.5 rounded-xl border border-border-custom hover:bg-bg-base text-txt-secondary font-bold text-xs transition-colors cursor-pointer"
              >
                Close Registry Viewer
              </button>
            </div>
          </>
        )
      }
    </Shell >
  );
}
