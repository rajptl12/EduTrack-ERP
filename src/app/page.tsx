"use client";

import React, { useState, useEffect } from "react";
import { useAttendance, AttendanceLog, LectureSchedule } from "@/context/AttendanceContext";
import { Shell } from "@/components/Layout/Shell";
import { 
  Clock, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Network,
  Users,
  CheckCircle,
  FileCheck,
  AlertTriangle,
  Play,
  Square,
  Sparkles,
  BookOpen,
  Wifi,
  X,
  BookOpenCheck,
  CalendarDays,
  Compass,
  Activity,
  Award
} from "lucide-react";

const WEEKLY_TIMETABLE_TEMPLATES: Record<string, { day: string; time: string; subject: string; code: string; room: string }[]> = {
  "EMP-001": [
    { day: "Monday", time: "09:00 - 10:00 AM", subject: "Distributed Systems", code: "CS-401", room: "Block A, LH-2" },
    { day: "Wednesday", time: "09:00 - 10:00 AM", subject: "Distributed Systems", code: "CS-401", room: "Block A, LH-2" },
    { day: "Tuesday", time: "11:15 - 12:15 PM", subject: "Compiler Design", code: "CS-302", room: "Block A, LH-3" },
    { day: "Thursday", time: "11:15 - 12:15 PM", subject: "Compiler Design", code: "CS-302", room: "Block A, LH-3" }
  ],
  "EMP-002": [
    { day: "Monday", time: "09:00 - 10:00 AM", subject: "Web Engineering", code: "CS-201", room: "Block A, LH-1" },
    { day: "Wednesday", time: "09:00 - 10:00 AM", subject: "Web Engineering", code: "CS-201", room: "Block A, LH-1" },
    { day: "Tuesday", time: "11:15 - 12:15 PM", subject: "Design & Analysis of Algorithms", code: "CS-301", room: "Block B, LH-2" },
    { day: "Thursday", time: "11:15 - 12:15 PM", subject: "Design & Analysis of Algorithms", code: "CS-301", room: "Block B, LH-2" }
  ],
  "EMP-003": [
    { day: "Monday", time: "11:15 - 12:15 PM", subject: "Database Management Systems", code: "IT-304", room: "Block B, LH-1" },
    { day: "Wednesday", time: "11:15 - 12:15 PM", subject: "Database Management Systems", code: "IT-304", room: "Block B, LH-1" },
    { day: "Tuesday", time: "02:00 - 03:00 PM", subject: "Human-Computer Interaction", code: "IT-402", room: "Block B, LH-3" },
    { day: "Thursday", time: "02:00 - 03:00 PM", subject: "Human-Computer Interaction", code: "IT-402", room: "Block B, LH-3" }
  ],
  "EMP-004": [
    { day: "Monday", time: "11:15 - 12:15 PM", subject: "Digital Signal Processing", code: "EC-303", room: "Block C, LH-1" },
    { day: "Wednesday", time: "11:15 - 12:15 PM", subject: "Digital Signal Processing", code: "EC-303", room: "Block C, LH-1" },
    { day: "Tuesday", time: "09:00 - 10:00 AM", subject: "Embedded Systems", code: "EC-401", room: "Block C, LH-2" },
    { day: "Thursday", time: "09:00 - 10:00 AM", subject: "Embedded Systems", code: "EC-401", room: "Block C, LH-2" }
  ],
  "EMP-005": []
};

const RFID_TERMINALS = [
  { id: "READER-A", name: "Block A Faculty Reader", location: "Academic Block A, Room 102", ip: "192.168.1.101" },
  { id: "READER-C", name: "Block C ECE Reader", location: "Academic Block C, Room 101", ip: "192.168.1.105" },
  { id: "READER-HQ", name: "Administrative HQ Reader", location: "Administrative HQ Block, Room 101", ip: "192.168.1.201" },
  { id: "READER-GATE", name: "Campus Main Gate Reader", location: "Main Campus Gate, Entrance Gate", ip: "192.168.1.10" }
];

export default function Dashboard() {
  const { 
    currentUser, 
    employees, 
    attendanceLogs, 
    leaveRequests, 
    lectures,
    checkIn, 
    checkOut, 
    conductLecture,
    cancelLecture,
    rescheduleLecture,
    loading 
  } = useAttendance();

  const [currentTime, setCurrentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);

  // Layout View Switcher
  const [scheduleView, setScheduleView] = useState<"list" | "weekly">("list");

  // Interactive RFID State
  const [selectedReaderId, setSelectedReaderId] = useState("READER-A");

  // HOD Faculty Auditor State
  const [auditedFacultyId, setAuditedFacultyId] = useState("");

  // Reschedule inline state
  const [reschedulingLecId, setReschedulingLecId] = useState<string | null>(null);
  const [newTime, setNewTime] = useState("");
  const [newRoom, setNewRoom] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Set default audited faculty on user load
  useEffect(() => {
    if (currentUser) {
      setAuditedFacultyId(currentUser.id);
    }
  }, [currentUser]);

  // Update Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync today's log for the active user
  useEffect(() => {
    if (currentUser && attendanceLogs.length > 0) {
      const log = attendanceLogs.find(
        (l) => l.employeeId === currentUser.id && l.date === todayStr
      );
      setTodayLog(log || null);
    } else {
      setTodayLog(null);
    }
  }, [currentUser, attendanceLogs, todayStr]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // --- STATS CALCULATION FOR ADMIN (HOD / DEAN) ---
  const activeFaculty = employees.filter(e => e.status === "Active").length;
  
  // Today's Checkins
  const todayLogs = attendanceLogs.filter(l => l.date === todayStr);
  const checkedInToday = todayLogs.filter(l => l.checkInTime !== "00:00:00").length;
  const lateToday = todayLogs.filter(l => l.status === "Late").length;
  const onTimeToday = todayLogs.filter(l => l.status === "On Time").length;
  
  // Today's Lectures
  const todayLectures = lectures.filter(l => l.date === todayStr);
  const conductedLecturesToday = todayLectures.filter(l => l.status === "Conducted").length;
  const scheduledLecturesToday = todayLectures.length;
  const classConductionRateToday = scheduledLecturesToday > 0 
    ? Math.round((conductedLecturesToday / scheduledLecturesToday) * 100) 
    : 100;

  // Leave requests pending
  const pendingLeaves = leaveRequests.filter(r => r.status === "Pending").length;
  const onTimeRate = Math.round((onTimeToday / (checkedInToday || 1)) * 100);

  // --- PERSONAL STATS CALCULATION FOR FACULTY ---
  const myLogs = attendanceLogs.filter((l) => l.employeeId === currentUser.id);
  const myPresentLogs = myLogs.filter((l) => l.checkInTime !== "00:00:00");
  const myOnTimeLogs = myPresentLogs.filter((l) => l.status === "On Time");
  const myLateLogs = myPresentLogs.filter((l) => l.status === "Late");
  
  // My attendance rate
  const myAttendanceRate = Math.round((myPresentLogs.length / (myLogs.length || 1)) * 100);
  
  // My class conduction rate (historical)
  const myAllLectures = lectures.filter(l => l.facultyId === currentUser.id);
  const myPastLectures = myAllLectures.filter(l => l.date <= todayStr);
  const myConductedLectures = myPastLectures.filter(l => l.status === "Conducted");
  const myConductionRate = myPastLectures.length > 0 
    ? Math.round((myConductedLectures.length / myPastLectures.length) * 100) 
    : 100;
  
  // My leave requests approved
  const myApprovedLeaves = leaveRequests.filter(
    (r) => r.employeeId === currentUser.id && r.status === "Approved"
  );
  const myApprovedLeaveDays = myApprovedLeaves.reduce((acc, curr) => {
    const start = new Date(curr.startDate);
    const end = new Date(curr.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return acc + diffDays;
  }, 0);
  const myRemainingLeaves = Math.max(0, 15 - myApprovedLeaveDays);

  // My Duty Leaves logged
  const myDutyLeaves = myApprovedLeaves.filter(r => r.leaveType === "Duty");
  const myDutyLeaveDays = myDutyLeaves.reduce((acc, curr) => {
    const start = new Date(curr.startDate);
    const end = new Date(curr.endDate);
    return acc + Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, 0);

  // Audited schedules
  const currentAuditedFaculty = employees.find(e => e.id === auditedFacultyId) || currentUser;
  const auditedTodaySchedules = lectures.filter(l => l.facultyId === currentAuditedFaculty.id && l.date === todayStr);

  // --- GENERATING DATA FOR GRAPH (LAST 5 WORKING DAYS) ---
  const getLast5WorkingDaysData = () => {
    const data = [];
    let daysFound = 0;
    let i = 0;
    
    while (daysFound < 5 && i < 20) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dStr = date.toISOString().split("T")[0];
        const dayLogs = attendanceLogs.filter(l => l.date === dStr);
        const dayCheckedIn = dayLogs.filter(l => l.checkInTime !== "00:00:00").length;
        const dayOnTime = dayLogs.filter(l => l.status === "On Time").length;
        const label = date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
        const rate = dayCheckedIn > 0 ? Math.round((dayOnTime / dayCheckedIn) * 100) : 0;
        data.unshift({ label, rate, count: dayCheckedIn });
        daysFound++;
      }
      i++;
    }
    return data;
  };

  const chartData = getLast5WorkingDaysData();

  // --- QUICK ACTION HANDLERS ---
  const handleCheckIn = () => {
    const terminal = RFID_TERMINALS.find(t => t.id === selectedReaderId) || RFID_TERMINALS[0];
    checkIn(currentUser.id, notes, terminal.location, terminal.ip);
    setNotes("");
  };

  const handleCheckOut = () => {
    checkOut(currentUser.id);
  };

  const handleRescheduleSubmit = (lecId: string) => {
    if (!newTime || !newRoom) {
      alert("Please fill in both new time and room.");
      return;
    }
    rescheduleLecture(lecId, newTime, newRoom);
    setReschedulingLecId(null);
    setNewTime("");
    setNewRoom("");
  };

  // Get active coordinate zone for Swiped block dynamically
  const getLocatorLocation = () => {
    if (!todayLog || todayLog.checkInTime === "00:00:00" || todayLog.checkOutTime) {
      return { x: 235, y: 155, name: "Main Campus Gate" };
    }
    
    const loc = todayLog.location || "";
    if (loc.includes("Block A")) {
      return { x: 90, y: 55, name: "Academic Block A" };
    } else if (loc.includes("Block C")) {
      return { x: 370, y: 55, name: "Academic Block C" };
    } else if (loc.includes("Administrative") || loc.includes("HQ")) {
      return { x: 230, y: 65, name: "Administrative HQ Block" };
    }
    
    // Fallback depending on department
    if (currentUser.department.includes("Computer") || currentUser.department.includes("Information")) {
      return { x: 90, y: 55, name: "Academic Block A" };
    } else if (currentUser.department.includes("Electronics")) {
      return { x: 370, y: 55, name: "Academic Block C" };
    } else {
      return { x: 230, y: 65, name: "Administrative HQ Block" };
    }
  };

  const locator = getLocatorLocation();

  // Timetable helpers
  const slots = ["09:00 - 10:00 AM", "11:15 - 12:15 PM", "02:00 - 03:00 PM"];
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const auditedTimetable = WEEKLY_TIMETABLE_TEMPLATES[currentAuditedFaculty.id] || [];

  return (
    <Shell>
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-slate-900 dark:text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            Welcome back, {currentUser.name} <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-semibold">
            {currentUser.role === "Admin" 
              ? `Academic Dashboard • Head of Department Panel (${currentUser.department})` 
              : `Faculty Portal • ${currentUser.jobTitle} - ${currentUser.department}`}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-bg-surface px-4 py-2.5 rounded-2xl border border-border-custom shadow-sm text-sm">
          <Calendar size={16} className="text-brand-teal" />
          <span className="font-semibold text-txt-primary">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {currentUser.role === "Admin" ? (
          <>
            {/* KPI 1: Active Faculty & Staff */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Active Faculty</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">{activeFaculty}</h3>
                <span className="text-[11px] text-brand-teal font-medium">Departments Configured</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                <Users size={22} />
              </div>
            </div>

            {/* KPI 2: Faculty Swipe Attendance Rate */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Present Today</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">
                  {checkedInToday} <span className="text-xs font-medium text-txt-secondary">/ {activeFaculty}</span>
                </h3>
                <span className="text-[11px] text-brand-teal font-medium">
                  {Math.round((checkedInToday / activeFaculty) * 100) || 0}% Swipe Rate
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <UserCheck size={22} />
              </div>
            </div>

            {/* KPI 3: Class Conduction Rate Today */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Lectures Conducted</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">
                  {conductedLecturesToday} <span className="text-xs font-medium text-txt-secondary">/ {scheduledLecturesToday}</span>
                </h3>
                <span className={`text-[11px] font-medium ${classConductionRateToday > 80 ? "text-emerald-500" : "text-amber-500"}`}>
                  {classConductionRateToday}% Conduction Rate
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <BookOpen size={22} />
              </div>
            </div>

            {/* KPI 4: Leaves Pending */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Duty & Leave Requests</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">{pendingLeaves}</h3>
                <span className="text-[11px] text-brand-indigo font-medium">
                  Awaiting HOD Review
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <FileCheck size={22} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* KPI 1: My Swipe Attendance Rate */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Swipe Attendance</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">{myAttendanceRate}%</h3>
                <span className="text-[11px] text-brand-teal font-medium">University Target: 90%</span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                <UserCheck size={22} />
              </div>
            </div>

            {/* KPI 2: My Class Conduction Rate */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Class Conduction</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">{myConductionRate}%</h3>
                <span className="text-[11px] text-brand-indigo font-medium">
                  {myConductedLectures.length} of {myPastLectures.length} classes taken
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                <BookOpenCheck size={22} />
              </div>
            </div>

            {/* KPI 3: My Swipe Summary */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Swipe Summary</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">
                  {myPresentLogs.length} <span className="text-xs font-medium text-txt-secondary">Days Present</span>
                </h3>
                <span className="text-[11px] text-amber-500 font-medium">
                  {myLateLogs.length} late swipe arrivals
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Clock size={22} />
              </div>
            </div>

            {/* KPI 4: My Leave & Duty Balance */}
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Leave Balance</span>
                <h3 className="text-2xl font-extrabold text-txt-primary">{myRemainingLeaves} Days</h3>
                <span className="text-[11px] text-brand-indigo font-medium">
                  15 annual allocated days
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Calendar size={22} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Check-in widget, Class Schedules, Graph) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Check-In / Check-Out Widget & Campus Radar Map */}
          <div className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-txt-primary">Daily Attendance Portal</h2>
                <p className="text-xs text-txt-secondary mt-0.5">Faculty RFID/Swipe simulation with Geofence verification.</p>
              </div>
              <div className="flex items-center gap-2 bg-bg-base border border-border-custom px-3.5 py-1.5 rounded-xl font-mono text-base font-semibold tracking-wider text-txt-primary shadow-inner">
                <Clock size={16} className="text-brand-teal animate-pulse-slow" />
                <span>{currentTime || "00:00:00"}</span>
              </div>
            </div>

            {/* RADAR MAP CONTAINER & TERMINAL DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              
              {/* Terminal Screen (Col: 2) */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="p-4 rounded-xl bg-bg-base border border-border-custom space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-txt-secondary">RFID Swipe Terminal</p>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        todayLog?.checkOutTime 
                          ? "bg-txt-secondary" 
                          : todayLog?.checkInTime 
                          ? "bg-brand-teal animate-pulse" 
                          : "bg-rose-500 animate-pulse"
                      }`} />
                      <span className="text-xs font-extrabold text-txt-primary uppercase tracking-wide">
                        {todayLog?.checkOutTime 
                          ? "Clocked Out for Today" 
                          : todayLog?.checkInTime 
                          ? `Active Swipe: ${todayLog.status}` 
                          : "Not Swiped In Today"}
                      </span>
                    </div>
                    {todayLog && (
                      <div className="space-y-1 text-xs text-txt-secondary border-t border-border-custom/50 pt-2 mt-2">
                        <p>Terminal AP: <span className="font-semibold text-txt-primary">{todayLog.location.split(", ")[0]}</span></p>
                        <p>Swipe-In: <span className="font-semibold text-txt-primary">{todayLog.checkInTime}</span></p>
                        {todayLog.checkOutTime && (
                          <p>Swipe-Out: <span className="font-semibold text-txt-primary">{todayLog.checkOutTime}</span></p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-txt-secondary pt-3 border-t border-border-custom/50">
                    <div className="flex justify-between font-semibold">
                      <span>Wifi Geofence:</span>
                      <span className="font-bold text-emerald-500 flex items-center gap-0.5">
                        <Wifi size={10} /> Active
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Current Zone:</span>
                      <span className="font-bold text-txt-primary truncate max-w-[110px]" title={locator.name}>
                        {locator.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Radar Live Map Screen (Col: 3) */}
              <div className="md:col-span-3 h-52 rounded-xl border border-border-custom relative overflow-hidden bg-[#050811] flex items-center justify-center p-3 shadow-inner">
                {/* Radar Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-950/20 via-transparent to-transparent pointer-events-none z-0" />
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,24,38,0.3)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(18,24,38,0.3)_1px,_transparent_1px)] bg-[size:15px_15px] pointer-events-none" />
                
                {/* Radar Sweep Effect */}
                <div className="absolute h-40 w-40 rounded-full border border-teal-500/10 flex items-center justify-center z-0">
                  <div className="h-28 w-28 rounded-full border border-teal-500/5 flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full border border-teal-500/5" />
                  </div>
                  <div className="absolute top-0 bottom-0 left-1/2 right-1/2 w-0.5 h-40 bg-gradient-to-t from-transparent to-brand-teal/40 origin-center animate-spin-slow pointer-events-none" />
                </div>

                {/* Simulated Campus Layout Vector Map */}
                <svg className="w-full h-full opacity-60 z-0 absolute inset-0 p-2" viewBox="0 0 460 200">
                  <rect x="30" y="30" width="120" height="50" rx="4" fill="none" stroke="var(--brand-teal)" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="90" y="60" fill="var(--brand-teal)" fontSize="9" fontWeight="bold" textAnchor="middle">ACADEMIC BLOCK A</text>
                  
                  <rect x="175" y="40" width="110" height="50" rx="4" fill="none" stroke="var(--brand-indigo)" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="230" y="70" fill="var(--brand-indigo)" fontSize="9" fontWeight="bold" textAnchor="middle">ADMIN HQ BLOCK</text>

                  <rect x="310" y="30" width="120" height="50" rx="4" fill="none" stroke="var(--brand-teal)" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="370" y="60" fill="var(--brand-teal)" fontSize="9" fontWeight="bold" textAnchor="middle">ACADEMIC BLOCK C</text>

                  <path d="M 210,150 L 260,150 L 260,170 L 210,170 Z" fill="none" stroke="#64748b" strokeWidth="1" />
                  <text x="235" y="162" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">MAIN GATE</text>

                  <line x1="90" y1="80" x2="230" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="230" y1="90" x2="230" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                  <line x1="370" y1="80" x2="230" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
                </svg>

                {/* Radar Sonar Blip Indicator */}
                <div 
                  className="absolute z-10 transition-all duration-700 ease-out"
                  style={{ left: `${(locator.x / 460) * 100}%`, top: `${(locator.y / 200) * 100}%` }}
                >
                  <span className="absolute flex h-5 w-5 -mt-2.5 -ml-2.5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-teal shadow-md shadow-brand-teal/40" />
                  </span>
                  <div className="absolute left-3 -top-2 px-2 py-0.5 rounded bg-brand-teal/90 text-white text-[8px] uppercase tracking-wide font-extrabold whitespace-nowrap z-20 shadow-md">
                    {todayLog && todayLog.checkInTime !== "00:00:00" && !todayLog.checkOutTime ? "Active AP" : "Away"}
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 text-[8px] font-bold text-txt-secondary tracking-widest uppercase flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded border border-border-custom/30 backdrop-blur-sm z-10">
                  <Compass size={8} className="animate-spin-slow" />
                  <span>GPS Simulation</span>
                </div>
              </div>

            </div>

            {/* Checkin Button, Reader Select, and notes */}
            {!todayLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select RFID Terminal */}
                  <div className="space-y-1.5 font-bold text-txt-secondary text-xs">
                    <label htmlFor="rfidReader" className="uppercase tracking-wider">Select RFID Swipe Terminal *</label>
                    <select
                      id="rfidReader"
                      value={selectedReaderId}
                      onChange={(e) => setSelectedReaderId(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium cursor-pointer"
                    >
                      {RFID_TERMINALS.map(term => (
                        <option key={term.id} value={term.id}>
                          {term.name} ({term.ip})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes input */}
                  <div className="space-y-1.5 font-bold text-txt-secondary text-xs">
                    <label htmlFor="notes" className="uppercase tracking-wider">Swipe Remarks / Notes (Optional)</label>
                    <input
                      type="text"
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Lab setup, exam invigilation..."
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-border-custom bg-transparent text-txt-primary placeholder-txt-secondary focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-indigo hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-brand-teal/10 hover:shadow-xl hover:shadow-brand-teal/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play size={14} fill="white" />
                  <span>Swipe RFID Card (Clock In)</span>
                </button>
              </div>
            )}

            {todayLog && !todayLog.checkOutTime && (
              <button
                onClick={handleCheckOut}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square size={12} fill="white" />
                <span>Swipe RFID Card (Clock Out)</span>
              </button>
            )}

            {todayLog && todayLog.checkOutTime && (
              <div className="py-4 bg-brand-teal/5 border border-brand-teal/20 rounded-xl text-center animate-scale-in">
                <p className="text-xs font-extrabold text-brand-teal flex items-center justify-center gap-1.5">
                  <CheckCircle size={14} />
                  <span>Academic Shift Completed for Today!</span>
                </p>
                <p className="text-[10px] text-txt-secondary mt-1 font-semibold">Swiped Out Terminal: {todayLog.location.split(", ")[0]} • Logs saved.</p>
              </div>
            )}
          </div>

          {/* Today's Classes & Weekly Timetable Grid */}
          <div className="glass-panel p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-txt-primary">
                  {currentUser.role === "Admin" ? "Faculty Timetable Schedules Auditing" : "Class Schedules & Lectures"}
                </h2>
                <p className="text-xs text-txt-secondary mt-0.5">
                  {currentUser.role === "Admin" 
                    ? "Audit weekly schedules and today class conduction status logs across faculty members."
                    : "Track scheduled lectures, check off conducted classes, and update lecture halls."}
                </p>
              </div>

              {/* Toggle for Schedule view */}
              <div className="flex bg-bg-base border border-border-custom rounded-xl p-1 self-start sm:self-center">
                <button
                  onClick={() => setScheduleView("list")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    scheduleView === "list"
                      ? "bg-bg-surface text-brand-teal shadow"
                      : "text-txt-secondary hover:text-txt-primary"
                  }`}
                >
                  <BookOpenCheck size={14} />
                  <span>Today</span>
                </button>
                <button
                  onClick={() => setScheduleView("weekly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    scheduleView === "weekly"
                      ? "bg-bg-surface text-brand-teal shadow"
                      : "text-txt-secondary hover:text-txt-primary"
                  }`}
                >
                  <CalendarDays size={14} />
                  <span>Weekly Grid</span>
                </button>
              </div>
            </div>

            {/* HOD AUDITOR FACULTY SELECTOR (ONLY ADMIN VIEW) */}
            {currentUser.role === "Admin" && (
              <div className="mb-6 p-4 rounded-xl border border-border-custom/80 bg-bg-base/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-indigo uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>HOD Department Faculty Auditor</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <label htmlFor="auditedFaculty" className="block text-[10px] text-txt-secondary font-bold uppercase">Select Faculty to Audit</label>
                    <select
                      id="auditedFaculty"
                      value={auditedFacultyId}
                      onChange={(e) => setAuditedFacultyId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-border-custom bg-bg-surface text-txt-primary focus:outline-none focus:ring-1 focus:ring-brand-indigo font-bold cursor-pointer"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.jobTitle} - {emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-bg-base border border-border-custom/50 rounded-xl px-4 py-2 text-center flex flex-col justify-center min-w-[120px] shadow-sm">
                    <span className="text-[9px] text-txt-secondary font-bold uppercase tracking-wider">Swipe status</span>
                    <span className={`text-[10px] font-extrabold uppercase mt-0.5 inline-block ${
                      attendanceLogs.some(l => l.employeeId === auditedFacultyId && l.date === todayStr && l.checkInTime !== "00:00:00" && !l.checkOutTime)
                        ? "text-emerald-500"
                        : "text-slate-400"
                    }`}>
                      {attendanceLogs.some(l => l.employeeId === auditedFacultyId && l.date === todayStr && l.checkInTime !== "00:00:00" && !l.checkOutTime)
                        ? "On Campus"
                        : "Away"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW A: SCHEDULE CHECKLIST (TODAY LIST VIEW) */}
            {scheduleView === "list" && (
              <div className="space-y-4">
                {auditedTodaySchedules.length > 0 ? (
                  auditedTodaySchedules.map((lec) => {
                    const faculty = employees.find(e => e.id === lec.facultyId);
                    const isRescheduling = reschedulingLecId === lec.id;
                    
                    return (
                      <div 
                        key={lec.id} 
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          lec.status === "Conducted" 
                            ? "bg-emerald-500/5 border-emerald-500/20" 
                            : lec.status === "Cancelled" 
                            ? "bg-rose-500/5 border-rose-500/20" 
                            : lec.status === "Rescheduled"
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-bg-base border-border-custom"
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-border-custom/50 text-txt-secondary px-2 py-0.5 rounded">
                              {lec.courseCode}
                            </span>
                            <span className="text-xs font-extrabold text-txt-primary">{lec.subject}</span>
                            <span className="text-[10px] text-txt-secondary font-semibold">({lec.semester})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-txt-secondary">
                            <div className="flex items-center gap-1 font-semibold">
                              <Clock size={12} className="text-brand-teal" />
                              <span>{lec.time}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold">
                              <MapPin size={12} className="text-brand-teal" />
                              <span>{lec.room}</span>
                            </div>
                            {faculty && (
                              <div className="flex items-center gap-1.5 font-bold text-txt-primary text-[10px]">
                                <span>• Lecturer: {faculty.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status and Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            lec.status === "Conducted"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : lec.status === "Cancelled"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : lec.status === "Rescheduled"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-border-custom text-txt-secondary"
                          }`}>
                            {lec.status}
                          </span>

                          {currentUser.role !== "Admin" && lec.status === "Scheduled" && !isRescheduling && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => conductLecture(lec.id)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Conducted
                              </button>
                              <button
                                onClick={() => cancelLecture(lec.id)}
                                className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => setReschedulingLecId(lec.id)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Reschedule
                              </button>
                            </div>
                          )}

                          {isRescheduling && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-bg-surface p-2 border border-border-custom rounded-xl z-10 shadow-lg">
                              <input
                                type="text"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                placeholder="e.g. 03:00 - 04:00 PM"
                                className="text-[10px] px-2 py-1 border border-border-custom rounded bg-transparent text-txt-primary font-semibold"
                              />
                              <input
                                type="text"
                                value={newRoom}
                                onChange={(e) => setNewRoom(e.target.value)}
                                placeholder="Room, e.g. LH-4"
                                className="text-[10px] px-2 py-1 border border-border-custom rounded bg-transparent text-txt-primary font-semibold"
                              />
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => handleRescheduleSubmit(lec.id)}
                                  className="px-2 py-1 bg-brand-teal text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setReschedulingLecId(null)}
                                  className="px-2 py-1 bg-border-custom text-txt-secondary rounded text-[10px] cursor-pointer"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 border border-dashed border-border-custom rounded-2xl flex flex-col items-center justify-center gap-2 text-txt-secondary">
                    <BookOpen size={24} className="text-border-custom animate-pulse" />
                    <span className="text-xs font-semibold">No lectures scheduled for {currentAuditedFaculty.name} today.</span>
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: WEEKLY TIMETABLE CALENDAR GRID */}
            {scheduleView === "weekly" && (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[650px] border border-border-custom rounded-2xl overflow-hidden bg-bg-base/40">
                  {/* Grid Headers */}
                  <div className="grid grid-cols-6 border-b border-border-custom bg-bg-base text-[10px] uppercase font-bold tracking-wider text-txt-secondary text-center py-3">
                    <div>Time Slot</div>
                    {weekDays.map(day => (
                      <div key={day} className={new Date().toLocaleDateString("en-US", { weekday: "long" }) === day ? "text-brand-teal font-extrabold animate-pulse" : ""}>
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Grid Rows */}
                  <div className="divide-y divide-border-custom text-xs">
                    {slots.map(slot => (
                      <div key={slot} className="grid grid-cols-6 items-stretch min-h-[75px]">
                        {/* Slot label */}
                        <div className="flex items-center justify-center bg-bg-base/60 text-[9px] font-bold text-txt-secondary text-center p-2 border-r border-border-custom">
                          {slot}
                        </div>
                        {/* Days slots */}
                        {weekDays.map(day => {
                          const scheduledClass = auditedTimetable.find(c => c.day === day && c.time === slot);
                          return (
                            <div key={day} className="p-2 border-r border-border-custom flex items-center justify-center text-center">
                              {scheduledClass ? (
                                <div className="p-2.5 rounded-xl bg-brand-teal/10 border border-brand-teal/25 text-brand-teal w-full flex flex-col gap-1 items-center hover:scale-[1.03] transition-all">
                                  <span className="text-[8px] font-black uppercase bg-brand-teal/15 text-brand-teal px-1.5 py-0.5 rounded leading-none">
                                    {scheduledClass.code}
                                  </span>
                                  <p className="font-extrabold text-[9px] leading-tight text-txt-primary truncate max-w-full">
                                    {scheduledClass.subject}
                                  </p>
                                  <span className="text-[8px] font-bold text-txt-secondary">
                                    Room {scheduledClass.room.split(",")[1] || scheduledClass.room}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[9px] text-border-custom font-semibold italic">Free</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* SVG Attendance Rate Trend Graph */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-txt-primary">Department Attendance Trends</h2>
                <p className="text-xs text-txt-secondary mt-0.5">Average punctuality and presence over the last 5 teaching days.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-teal">
                <Sparkles size={14} />
                <span>Academic Insights Active</span>
              </div>
            </div>

            {/* Custom SVG Responsive Line/Bar Chart */}
            <div className="w-full h-48 bg-bg-base border border-border-custom rounded-xl p-4 relative flex flex-col justify-between">
              
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 grid grid-rows-4 p-4 pointer-events-none">
                <div className="border-b border-border-custom/50 w-full" />
                <div className="border-b border-border-custom/50 w-full" />
                <div className="border-b border-border-custom/50 w-full" />
                <div className="w-full" />
              </div>

              {/* Custom SVG Vector Visuals */}
              <svg className="w-full h-32 mt-2" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-teal)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--brand-teal)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                <path
                  d={`M ${chartData.map((d, index) => `${20 + index * 115},${100 - d.rate * 0.8}`).join(" L ")}`}
                  fill="none"
                  stroke="var(--brand-teal)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d={`M 20,110 L ${chartData.map((d, index) => `${20 + index * 115},${100 - d.rate * 0.8}`).join(" L ")} L ${20 + (chartData.length - 1) * 115},110 Z`}
                  fill="url(#gradient)"
                />

                {chartData.map((d, index) => (
                  <g key={index}>
                    <circle
                      cx={20 + index * 115}
                      cy={100 - d.rate * 0.8}
                      r="5"
                      fill="var(--brand-teal)"
                      stroke="var(--bg-surface)"
                      strokeWidth="2.5"
                    />
                    <text
                      x={20 + index * 115}
                      y={85 - d.rate * 0.8}
                      fontSize="9"
                      fontWeight="bold"
                      fill="var(--brand-teal)"
                      textAnchor="middle"
                    >
                      {d.rate}%
                    </text>
                  </g>
                ))}
              </svg>

              <div className="flex justify-between px-2 text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">
                {chartData.map((d, index) => (
                  <span key={index}>{d.label}</span>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Faculty Profile Summary & Bulletins */}
        <div className="space-y-6">
          
          {/* Active Profile Dossier & Month Analytics */}
          <div className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-brand-indigo/10 rounded-full blur-2xl pointer-events-none" />
            
            <h2 className="text-sm font-bold text-txt-primary mb-4 flex items-center gap-1.5 border-b border-border-custom pb-2">
              <Award size={14} className="text-brand-indigo" />
              <span>Academic Dossier</span>
            </h2>

            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-12 w-12 rounded-xl bg-bg-base p-0.5 border border-border-custom"
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-txt-primary truncate">{currentUser.name}</h4>
                <p className="text-[10px] font-bold text-brand-teal truncate">{currentUser.jobTitle}</p>
                <p className="text-[10px] text-txt-secondary truncate mt-0.5">{currentUser.department}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-txt-secondary font-semibold mb-5">
              <div className="flex justify-between">
                <span>Cabin Office:</span>
                <span className="font-bold text-txt-primary">{currentUser.cabinNumber || "Admin Block"}</span>
              </div>
              <div className="flex justify-between">
                <span>Core Subjects:</span>
                <span className="font-bold text-txt-primary text-right max-w-[150px] truncate" title={currentUser.subjects}>
                  {currentUser.subjects || "Management"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Contact Ext:</span>
                <span className="font-bold text-txt-primary">{currentUser.contactNo || "N/A"}</span>
              </div>
            </div>

            {/* MONTH-TO-DATE STATS PANEL */}
            <div className="bg-bg-base/70 border border-border-custom/50 rounded-xl p-3.5 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-txt-secondary flex items-center gap-1.5">
                <Activity size={12} className="text-brand-teal" />
                <span>Month-to-Date Performance</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-xs text-txt-secondary border-t border-border-custom/30 pt-2.5 font-bold">
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400">Class Conduction</span>
                  <p className="font-extrabold text-txt-primary mt-0.5">{myConductionRate}%</p>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400">Hours Logged</span>
                  <p className="font-extrabold text-txt-primary mt-0.5">
                    {currentUser.role === "Admin" ? "160 hrs" : `${myPresentLogs.length * 8} hrs`}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400">Duty Leaves</span>
                  <p className="font-extrabold text-brand-teal mt-0.5">{myDutyLeaveDays} DL Used</p>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-400">Avg Swipe Delay</span>
                  <p className="font-extrabold text-txt-primary mt-0.5">
                    {myLateLogs.length > 0 ? `${Math.round(Math.random() * 8 + 4)} mins` : "0 mins"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Swipe Logs */}
          <div className="glass-panel p-6 flex flex-col h-[340px] overflow-hidden">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-txt-primary">Live RFID Terminal Activity</h2>
              <p className="text-xs text-txt-secondary mt-0.5">Real-time check-ins from campus classrooms and gates.</p>
            </div>

            {/* List Feed Container */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {attendanceLogs.length > 0 ? (
                attendanceLogs
                  .filter((log) => log.checkInTime !== "00:00:00")
                  .slice(0, 5)
                  .map((log) => {
                    const emp = employees.find((e) => e.id === log.employeeId);
                    
                    return (
                      <div 
                        key={log.id} 
                        className="flex items-start gap-3 p-3 rounded-xl bg-bg-base/40 hover:bg-bg-base border border-border-custom transition-all text-xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={emp?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${log.employeeId}`}
                          alt={emp?.name || "User"}
                          className="h-8 w-8 rounded-full bg-bg-base border border-border-custom"
                        />

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-txt-primary truncate">
                            {emp?.name || "Unknown"}
                          </p>
                          <div className="flex items-center gap-1.5 text-txt-secondary mt-0.5">
                            <span>AP:</span>
                            <span className="font-medium text-txt-primary truncate max-w-[110px]" title={log.location}>
                              {log.location.split(", ")[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-txt-secondary">
                            <span>In:</span>
                            <span className="font-medium text-txt-primary">{log.checkInTime}</span>
                          </div>
                          {log.checkOutTime && (
                            <div className="flex items-center gap-1.5 text-txt-secondary">
                              <span>Out:</span>
                              <span className="font-medium text-txt-primary">{log.checkOutTime}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Tag */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            log.status === "On Time"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                              : log.status === "Late"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-455"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-455"
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-[9px] text-txt-secondary">{log.date}</span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-txt-secondary py-12">
                  <AlertTriangle size={24} className="text-border-custom" />
                  <span className="text-xs">No logs recorded today</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Bulletin Feed */}
          <div className="glass-panel p-6 flex flex-col h-[280px] overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-brand-indigo/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="mb-4">
              <h2 className="text-sm font-bold text-txt-primary flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand-indigo" />
                <span>Academic Board Announcements</span>
              </h2>
              <p className="text-[11px] text-txt-secondary mt-0.5">Notices regarding calendar modifications and meetings.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              
              <div className="p-3 rounded-xl bg-bg-base/30 hover:bg-bg-base border border-border-custom transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-txt-primary">External Audit Preparation</span>
                  <span className="text-[9px] bg-brand-indigo/10 text-brand-indigo font-bold px-2 py-0.5 rounded-full">Notice</span>
                </div>
                <p className="text-txt-secondary leading-relaxed font-normal">
                  All HODs are requested to update lab registers, course files, and conduction charts by Friday for the upcoming NAAC Academic Audit.
                </p>
                <span className="block text-[9px] text-txt-secondary mt-1.5 font-semibold">Posted by Dr. Keshav Sharma • 1 day ago</span>
              </div>

              <div className="p-3 rounded-xl bg-bg-base/30 hover:bg-bg-base border border-border-custom transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-txt-primary">End Semester Duty List</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-655 font-bold px-2 py-0.5 rounded-full">Exams</span>
                </div>
                <p className="text-txt-secondary leading-relaxed font-normal">
                  The invigilation duties list for July end semester exams has been uploaded. Please submit Duty Leave (DL) requests for dates assigned off-campus.
                </p>
                <span className="block text-[9px] text-txt-secondary mt-1.5 font-semibold">Posted by Dean Academics • 2 days ago</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </Shell>
  );
}
