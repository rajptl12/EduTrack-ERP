"use client";

import React, { useState } from "react";
import { useAttendance, LeaveRequest } from "@/context/AttendanceContext";
import { Shell } from "@/components/Layout/Shell";
import {
  CalendarRange,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  History,
  Sparkles,
  Inbox,
  Briefcase,
  MapPin,
  FileText,
  Trash2,
  Paperclip,
  ExternalLink,
  Loader2,
  FileTextIcon,
  X
} from "lucide-react";

// Pre-defined simulated files
const MOCK_DOCUMENTS = [
  { name: "external_examiner_invite_IITD.pdf", size: "142 KB", desc: "IIT Delhi Board of Studies invite letter" },
  { name: "ieee_board_meeting_invitation.pdf", size: "215 KB", desc: "IEEE Delhi Section Nomination" },
  { name: "paper_acceptance_ieee_varanasi.jpg", size: "438 KB", desc: "IEEE ICCT 2026 conference schedule" },
  { name: "guest_lecture_invite_du.pdf", size: "188 KB", desc: "Delhi University Expert lecture invite" }
];

export default function LeaveManagement() {
  const {
    currentUser,
    employees,
    leaveRequests,
    requestLeave,
    updateLeaveStatus
  } = useAttendance();

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Duty Leave specific inputs
  const [dutyEventName, setDutyEventName] = useState("");
  const [dutyLocation, setDutyLocation] = useState("");
  const [dutyDocName, setDutyDocName] = useState("");
  const [dutyDocSize, setDutyDocSize] = useState("");

  // Document uploader animation states
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Document preview modal state
  const [previewingRequest, setPreviewingRequest] = useState<LeaveRequest | null>(null);

  // HOD Decision comments dictionary state
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const handleDocSelect = (doc: typeof MOCK_DOCUMENTS[0]) => {
    setShowDocSelector(false);
    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            setDutyDocName(doc.name);
            setDutyDocSize(doc.size);
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleDocRemove = () => {
    setDutyDocName("");
    setDutyDocSize("");
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!startDate || !endDate || !reason) {
      alert("Please fill out all request details.");
      return;
    }

    if (leaveType === "Duty" && (!dutyEventName || !dutyLocation || !dutyDocName)) {
      alert("Please specify duty details and upload a simulated invitation order.");
      return;
    }

    // Verify start date is before end date
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      alert("Start date cannot be after the end date!");
      return;
    }

    requestLeave(
      currentUser.id,
      leaveType,
      startDate,
      endDate,
      reason,
      leaveType === "Duty" ? dutyEventName : undefined,
      leaveType === "Duty" ? dutyLocation : undefined,
      leaveType === "Duty" ? dutyDocName : undefined
    );

    // Reset Form
    setStartDate("");
    setEndDate("");
    setReason("");
    setDutyEventName("");
    setDutyLocation("");
    setDutyDocName("");
    setDutyDocSize("");
    alert("Leave request submitted successfully!");
  };

  // Filter requests
  const pendingRequests = leaveRequests.filter(req => req.status === "Pending");
  const processedRequests = leaveRequests.filter(req => req.status !== "Pending");

  // Current user's requests
  const myRequests = leaveRequests.filter(req => req.employeeId === currentUser?.id);

  // Render the Preview Letter template in modal
  const renderPreviewLetter = (req: LeaveRequest) => {
    const emp = employees.find(e => e.id === req.employeeId);

    // Choose document text based on document name
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
      <div className="bg-white text-slate-800 p-8 rounded-xl max-w-lg mx-auto shadow-2xl border border-slate-200 font-serif leading-relaxed text-xs">
        {/* Letterhead Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">{org}</h2>
          <p className="text-[10px] font-sans text-slate-500 italic mt-0.5">Faculty of Science & Academic Affairs Directorate</p>
          <div className="flex justify-between text-[9px] font-sans text-slate-400 mt-3 font-semibold uppercase">
            <span>{reference}</span>
            <span>Date: {req.appliedOn}</span>
          </div>
        </div>

        {/* Receiver */}
        <div className="mb-4 font-sans text-[10px]">
          <p className="font-bold text-slate-950">To,</p>
          <p className="font-bold text-slate-900">The Head of Department / Dean</p>
          <p className="text-slate-655">{emp?.department}</p>
          <p className="text-slate-655">EduTime Academy of Sciences</p>
        </div>

        {/* Subject */}
        <div className="mb-4 font-sans font-bold text-slate-950 uppercase border-y border-dashed border-slate-200 py-2">
          Subject: Official Invitation for Academic Duty Leave - Request for Faculty Release.
        </div>

        {/* Body Text */}
        <div className="mb-6 leading-relaxed font-sans text-slate-700 whitespace-pre-line text-[11px] font-normal">
          {body}
        </div>

        {/* Closing */}
        <div className="flex justify-between items-end pt-4 font-sans text-[10px] border-t border-slate-100">
          <div>
            <p className="italic text-slate-400">Scan & verified via EduTrack ERP</p>
            <p className="text-[8px] font-bold text-emerald-500 mt-1 flex items-center gap-1 uppercase">
              <CheckCircle size={10} /> Certified Attachment
            </p>
          </div>
          <div className="text-right">
            <div className="h-6 w-16 bg-slate-100 border border-slate-200/50 rounded flex items-center justify-center text-[7px] text-slate-400 italic mb-1 font-bold uppercase">
              SEAL
            </div>
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
      <div className="mb-8 text-slate-900 dark:text-white">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Leave & Duty Portal
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Apply for academic leave cycles, submit off-campus Duty Leaves (DL), and track processing updates.
        </p>
      </div>

      {/* Main Page Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Column 1: Request Leave Form */}
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle size={18} className="text-teal-500" />
                <span>Apply for Leave / DL</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Submit request details for HOD review.</p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs font-semibold text-slate-400">

              <div className="space-y-1.5 font-semibold text-txt-secondary">
                <label htmlFor="leaveType" className="uppercase tracking-wider">Leave Classification</label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => { setLeaveType(e.target.value as LeaveRequest["leaveType"]); handleDocRemove(); }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal transition-all font-medium cursor-pointer"
                >
                  <option value="Casual">Casual Leave (CL)</option>
                  <option value="Sick">Sick Leave (SL)</option>
                  <option value="Annual">Annual / Summer Vacation</option>
                  <option value="Duty">Duty Leave (DL - Off Campus)</option>
                  <option value="Maternity/Paternity">Maternity/Paternity Leave</option>
                </select>
              </div>

              {/* Duty Leave specific fields */}
              {leaveType === "Duty" && (
                <div className="space-y-4 border-l-2 border-brand-teal pl-3 mt-3 animate-fade-in-up">
                  <div className="space-y-1.5">
                    <label htmlFor="dutyEvent" className="uppercase tracking-wider text-brand-teal">Duty Assignment / Event *</label>
                    <input
                      type="text"
                      id="dutyEvent"
                      required
                      value={dutyEventName}
                      onChange={(e) => setDutyEventName(e.target.value)}
                      placeholder="e.g. Practical Examiner, IEEE Conference Chair"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="dutyLoc" className="uppercase tracking-wider text-brand-teal">Duty Location / Venue *</label>
                    <input
                      type="text"
                      id="dutyLoc"
                      required
                      value={dutyLocation}
                      onChange={(e) => setDutyLocation(e.target.value)}
                      placeholder="e.g. IIT Delhi, Hauz Khas"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary focus:outline-none font-medium"
                    />
                  </div>

                  {/* DOCUMENT UPLOADER SIMULATOR */}
                  <div className="space-y-2 mt-2">
                    <label className="block uppercase tracking-wider text-brand-teal">Duty Invite / Order Letter *</label>

                    {!dutyDocName && !uploading && (
                      <button
                        type="button"
                        onClick={() => setShowDocSelector(true)}
                        className="w-full py-4 border-2 border-dashed border-border-custom hover:border-brand-teal hover:bg-brand-teal/5 transition-all rounded-xl flex flex-col items-center justify-center gap-1.5 text-txt-secondary cursor-pointer text-center"
                      >
                        <Paperclip size={18} className="text-brand-teal" />
                        <span className="text-[10px] font-bold">Attach Invite Letter / Order</span>
                        <span className="text-[9px] font-normal text-slate-400">PDF/JPG (Simulated Upload)</span>
                      </button>
                    )}

                    {uploading && (
                      <div className="p-3 border border-border-custom bg-bg-base/60 rounded-xl space-y-2 text-[10px] font-bold">
                        <div className="flex justify-between items-center text-txt-secondary">
                          <span className="flex items-center gap-1.5">
                            <Loader2 size={12} className="animate-spin text-brand-teal" />
                            <span>Uploading document...</span>
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1 bg-border-custom rounded-full overflow-hidden">
                          <div className="h-full bg-brand-teal transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    {dutyDocName && (
                      <div className="p-3 border border-brand-teal/20 bg-brand-teal/5 rounded-xl flex items-center justify-between gap-3 animate-scale-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-brand-teal/15 text-brand-teal flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-txt-primary truncate text-[10px]">{dutyDocName}</p>
                            <p className="text-[9px] text-txt-secondary font-medium">{dutyDocSize}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDocRemove}
                          className="h-7 w-7 rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Remove Attachment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    {/* Quick Mock Doc Selector Panel */}
                    {showDocSelector && (
                      <div className="p-3 border border-border-custom bg-bg-surface rounded-xl space-y-2 animate-scale-in shadow-xl">
                        <div className="flex items-center justify-between text-[10px] border-b border-border-custom pb-1.5 mb-1 text-txt-secondary">
                          <span>Select simulated file to attach</span>
                          <button type="button" onClick={() => setShowDocSelector(false)} className="text-rose-500 font-bold hover:underline cursor-pointer">
                            Close
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {MOCK_DOCUMENTS.map((doc) => (
                            <button
                              key={doc.name}
                              type="button"
                              onClick={() => handleDocSelect(doc)}
                              className="w-full p-2 hover:bg-bg-base border border-border-custom rounded-lg text-left transition-all cursor-pointer flex flex-col gap-0.5"
                            >
                              <span className="font-bold text-txt-primary text-[10px] truncate">{doc.name}</span>
                              <span className="text-[9px] text-txt-secondary font-medium truncate">{doc.desc} ({doc.size})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="start" className="uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    id="start"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary focus:outline-none [color-scheme:light] dark:[color-scheme:dark] font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="end" className="uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    id="end"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary focus:outline-none [color-scheme:light] dark:[color-scheme:dark] font-medium"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label htmlFor="reason" className="uppercase tracking-wider">Reason / Description</label>
                <textarea
                  id="reason"
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your request in detail..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-855 dark:text-slate-200 placeholder-slate-455 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-teal-500/10 transition-all cursor-pointer active:scale-95 text-center mt-2"
              >
                Submit Request
              </button>

            </form>
          </div>
        </div>

        {/* Column 2 & 3: Admin Approval Queue / Personal Logs */}
        <div className="lg:col-span-2 space-y-8">

          {/* HOD Approval Dashboard Panel */}
          {currentUser?.role === "Admin" && (
            <div className="glass-panel p-6 rounded-2xl">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Inbox size={18} className="text-indigo-500" />
                    <span>HOD Approval Inbox</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Approve or reject leave logs and official Duty Leaves.</p>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-550 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {pendingRequests.length} Pending Review
                </span>
              </div>

              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => {
                    const emp = employees.find(e => e.id === req.employeeId);
                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl bg-bg-base/40 border border-border-custom flex flex-col sm:flex-row justify-between gap-4 text-xs font-semibold"
                      >
                        <div className="space-y-2 flex-1">

                          {/* Profile details */}
                          <div className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={emp?.avatar}
                              alt={emp?.name}
                              className="h-8 w-8 rounded-lg bg-bg-base border border-border-custom"
                            />
                            <div>
                              <p className="font-semibold text-txt-primary">{emp?.name}</p>
                              <p className="text-[10px] text-txt-secondary font-medium">{emp?.jobTitle} • {req.leaveType} Leave</p>
                            </div>
                          </div>

                          {/* Duty Leave specific summary badge & document view link */}
                          {req.leaveType === "Duty" && req.dutyEventName && (
                            <div className="p-2.5 bg-brand-teal/5 border border-brand-teal/20 text-brand-teal rounded-lg space-y-1.5">
                              <div className="flex items-center gap-1.5 font-bold">
                                <Briefcase size={12} />
                                <span>Duty: {req.dutyEventName}</span>
                              </div>
                              <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-semibold text-txt-secondary">
                                <span className="flex items-center gap-1">
                                  <MapPin size={10} />
                                  <span>Location: {req.dutyLocation}</span>
                                </span>
                                {req.dutyDocName && (
                                  <button
                                    onClick={() => setPreviewingRequest(req)}
                                    className="flex items-center gap-1 text-brand-teal hover:underline cursor-pointer border border-brand-teal/20 px-2 py-0.5 rounded bg-brand-teal/10"
                                  >
                                    <FileTextIcon size={10} />
                                    <span>Verify Invite</span>
                                    <ExternalLink size={8} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Reason */}
                          <p className="text-txt-secondary bg-bg-base/70 p-2.5 rounded-lg border border-border-custom/50 italic font-normal text-xs leading-relaxed">
                            &quot;{req.reason}&quot;
                          </p>

                          {/* Dates */}
                          <div className="flex items-center gap-1 text-[10px] text-txt-secondary font-bold">
                            <Calendar size={12} />
                            <span>Requested Duration: {req.startDate} to {req.endDate}</span>
                          </div>

                          {/* HOD Review Remarks Area */}
                          <div className="space-y-1.5 pt-1">
                            <label htmlFor={`hod-remark-${req.id}`} className="block text-[9px] uppercase tracking-wider text-txt-secondary">HOD Review Remarks (Optional)</label>
                            <textarea
                              id={`hod-remark-${req.id}`}
                              value={remarks[req.id] || ""}
                              onChange={(e) => setRemarks({ ...remarks, [req.id]: e.target.value })}
                              placeholder="e.g. Alternate lecture arrangements verified. Approved."
                              className="w-full text-xs p-2 rounded-lg border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-1 focus:ring-brand-teal focus:border-brand-teal font-medium"
                              rows={2}
                            />
                          </div>

                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                          <button
                            onClick={() => {
                              updateLeaveStatus(req.id, "Approved", remarks[req.id]);
                              setRemarks({ ...remarks, [req.id]: "" });
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                          >
                            <CheckCircle size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              updateLeaveStatus(req.id, "Rejected", remarks[req.id]);
                              setRemarks({ ...remarks, [req.id]: "" });
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-md shadow-rose-500/10 cursor-pointer"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 border border-dashed border-border-custom rounded-xl text-center text-txt-secondary flex flex-col items-center justify-center gap-2 font-normal">
                    <CheckCircle size={24} className="text-emerald-500" />
                    <span>No pending leave or duty requests!</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Leave History Log list */}
          <div className="glass-panel p-6 rounded-2xl">

            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History size={18} className="text-teal-500" />
                <span>{currentUser?.role === "Admin" ? "Academic Leave Audit Registry" : "My Personal Time Off & Duty History"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Archive log of all finalized leave cycles.</p>
            </div>

            <div className="space-y-3.5">

              {/* Table check */}
              {(currentUser?.role === "Admin" ? processedRequests : myRequests).length > 0 ? (
                (currentUser?.role === "Admin" ? processedRequests : myRequests).map((req) => {
                  const emp = employees.find(e => e.id === req.employeeId);

                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-bg-base/40 border border-border-custom flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-txt-primary">
                            {currentUser?.role === "Admin" ? emp?.name : `${req.leaveType} Leave`}
                          </span>
                          {currentUser?.role === "Admin" && (
                            <span className="text-[10px] bg-bg-base text-txt-secondary font-bold px-2 py-0.5 rounded border border-border-custom">
                              {req.leaveType}
                            </span>
                          )}
                        </div>

                        {req.leaveType === "Duty" && req.dutyEventName && (
                          <div className="text-[10px] text-brand-teal font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>Duty: {req.dutyEventName}</span>
                            <span>•</span>
                            <span className="text-txt-secondary font-medium">Location: {req.dutyLocation}</span>
                            {req.dutyDocName && (
                              <button
                                onClick={() => setPreviewingRequest(req)}
                                className="flex items-center gap-0.5 text-brand-teal hover:underline cursor-pointer ml-1 font-extrabold text-[9px] bg-brand-teal/10 px-1.5 py-0.5 rounded border border-brand-teal/20"
                              >
                                <span>Attached doc</span>
                                <ExternalLink size={7} />
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-[10px] text-txt-secondary">
                          <Calendar size={11} />
                          <span>{req.startDate} to {req.endDate}</span>
                        </div>
                        {req.reason && (
                          <p className="text-[10px] font-normal text-txt-secondary line-clamp-1 italic max-w-sm">
                            &quot;{req.reason}&quot;
                          </p>
                        )}
                        {req.hodComment && (
                          <div className="mt-2 p-2 bg-bg-base border border-border-custom rounded-lg text-[10px] leading-relaxed text-txt-secondary font-medium">
                            <span className={`font-bold ${req.status === "Approved" ? "text-emerald-500" : "text-rose-500"}`}>
                              HOD Remark:
                            </span>{" "}
                            &quot;{req.hodComment}&quot;
                          </div>
                        )}
                      </div>

                      {/* Status Tag */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider self-end sm:self-center ${req.status === "Approved"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                        : req.status === "Rejected"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                        {req.status}
                      </span>

                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <AlertTriangle size={24} className="mx-auto text-slate-350 dark:text-slate-800 mb-2 animate-pulse" />
                  <span>No leave logs recorded.</span>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* VIEW VERIFICATION MODAL OVERLAY */}
      {previewingRequest && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setPreviewingRequest(null)}
          />
          <div className="fixed inset-x-4 top-10 bottom-10 md:inset-y-0 md:right-0 md:left-auto md:w-[500px] z-50 bg-bg-surface border-l border-border-custom shadow-2xl p-6 sm:p-8 flex flex-col justify-between h-[90vh] sm:h-screen overflow-y-auto animate-scale-in">
            <div className="space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border-custom pb-4">
                <div className="flex items-center gap-2 text-brand-teal">
                  <FileText size={18} />
                  <span className="font-extrabold text-xs uppercase tracking-wider">Duty Leave Document Auditor</span>
                </div>
                <button
                  onClick={() => setPreviewingRequest(null)}
                  className="h-8 w-8 rounded-full hover:bg-bg-base text-txt-secondary flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1 text-center font-sans">
                <p className="text-xs text-txt-secondary">Attached Invitation Scan:</p>
                <strong className="text-txt-primary text-xs break-all">{previewingRequest.dutyDocName}</strong>
              </div>

              {/* RENDER THE LETTER SCAN PREVIEW */}
              <div className="border border-border-custom rounded-2xl p-2 bg-slate-100 shadow-inner">
                {renderPreviewLetter(previewingRequest)}
              </div>
            </div>

            <button
              onClick={() => setPreviewingRequest(null)}
              className="w-full mt-6 py-2.5 rounded-xl border border-border-custom hover:bg-bg-base text-txt-secondary font-bold text-xs transition-colors cursor-pointer"
            >
              Close Verification Viewer
            </button>
          </div>
        </>
      )}

    </Shell>
  );
}
