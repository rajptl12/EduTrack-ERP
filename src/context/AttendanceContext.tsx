"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Employee";
  jobTitle: string;
  department: string;
  avatar: string;
  joinDate: string;
  status: "Active" | "Inactive";
  cabinNumber?: string;
  subjects?: string;
  contactNo?: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM:SS
  checkOutTime: string | null; // HH:MM:SS
  status: "On Time" | "Late" | "Half Day" | "Absent";
  notes?: string;
  ipAddress: string;
  location: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: "Sick" | "Casual" | "Annual" | "Maternity/Paternity" | "Duty";
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  appliedOn: string; // YYYY-MM-DD
  dutyEventName?: string;
  dutyLocation?: string;
  dutyDocName?: string;
  hodComment?: string;
}

export interface LectureSchedule {
  id: string;
  facultyId: string;
  subject: string;
  courseCode: string;
  semester: string;
  time: string; // e.g. "09:00 - 10:00 AM"
  room: string;
  status: "Scheduled" | "Conducted" | "Cancelled" | "Rescheduled";
  date: string; // YYYY-MM-DD
}

interface AttendanceContextType {
  employees: Employee[];
  attendanceLogs: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  lectures: LectureSchedule[];
  currentUser: Employee | null;
  loading: boolean;
  checkIn: (employeeId: string, notes?: string, location?: string, ipAddress?: string) => void;
  checkOut: (employeeId: string) => void;
  requestLeave: (
    employeeId: string,
    leaveType: LeaveRequest["leaveType"],
    startDate: string,
    endDate: string,
    reason: string,
    dutyEventName?: string,
    dutyLocation?: string,
    dutyDocName?: string
  ) => void;
  updateLeaveStatus: (leaveId: string, status: "Approved" | "Rejected", comment?: string) => void;
  addEmployee: (employee: Omit<Employee, "id" | "joinDate" | "status">) => void;
  switchUser: (employeeId: string) => void;
  conductLecture: (lectureId: string) => void;
  cancelLecture: (lectureId: string) => void;
  rescheduleLecture: (lectureId: string, newTime: string, newRoom: string) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// Initial Mock Employees
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    name: "Dr. Keshav Sharma",
    email: "keshav.cse@edu.in",
    role: "Admin",
    jobTitle: "HOD & Professor",
    department: "Computer Science & Engineering",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Keshav&backgroundType=gradientLinear&fontSize=42",
    joinDate: "2020-07-15",
    status: "Active",
    cabinNumber: "Block A, Room 402",
    subjects: "Distributed Systems, Compiler Design",
    contactNo: "+91 98765 43210"
  },
  {
    id: "EMP-002",
    name: "Prof. Raj Kumar",
    email: "raj.cse@edu.in",
    role: "Employee",
    jobTitle: "Associate Professor",
    department: "Computer Science & Engineering",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Raj&backgroundType=gradientLinear&fontSize=42",
    joinDate: "2021-08-10",
    status: "Active",
    cabinNumber: "Block A, Room 405",
    subjects: "Web Engineering, Design & Analysis of Algorithms",
    contactNo: "+91 98123 45678"
  },
  {
    id: "EMP-003",
    name: "Dr. Priya Patel",
    email: "priya.it@edu.in",
    role: "Employee",
    jobTitle: "Assistant Professor",
    department: "Information Technology",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Priya&backgroundType=gradientLinear&fontSize=42",
    joinDate: "2022-01-18",
    status: "Active",
    cabinNumber: "Block B, Room 201",
    subjects: "Database Management Systems, Human-Computer Interaction",
    contactNo: "+91 99543 21098"
  },
  {
    id: "EMP-004",
    name: "Dr. Amit Sharma",
    email: "amit.ece@edu.in",
    role: "Employee",
    jobTitle: "Professor",
    department: "Electronics & Communication",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Amit&backgroundType=gradientLinear&fontSize=42",
    joinDate: "2019-03-01",
    status: "Active",
    cabinNumber: "Block C, Room 104",
    subjects: "Digital Signal Processing, Embedded Systems",
    contactNo: "+91 97765 12345"
  },
  {
    id: "EMP-005",
    name: "Prof. Sunita Rao",
    email: "sunita.dean@edu.in",
    role: "Admin",
    jobTitle: "Dean of Academics",
    department: "Office of Academic Affairs",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Sunita&backgroundType=gradientLinear&fontSize=42",
    joinDate: "2018-02-20",
    status: "Active",
    cabinNumber: "Admin Block, Room 102",
    subjects: "N/A",
    contactNo: "+91 96543 87621"
  },
];

// Initial Mock Attendance Logs (for past 7 days to show analytics)
const getPastDateStr = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

const generateMockLogs = (): AttendanceLog[] => {
  const logs: AttendanceLog[] = [];
  const employees = INITIAL_EMPLOYEES;

  // Generate logs for past 10 days (excluding weekends)
  for (let i = 10; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = date.toISOString().split("T")[0];

    employees.forEach((emp) => {
      // Skip sometimes to simulate absenteeism/leaves
      const roll = Math.random();
      if (roll > 0.92) {
        // Absent
        logs.push({
          id: `ATT-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          date: dateStr,
          checkInTime: "00:00:00",
          checkOutTime: "00:00:00",
          status: "Absent",
          notes: "Unexcused absence",
          ipAddress: "N/A",
          location: "Unknown",
        });
        return;
      }
      if (roll > 0.85) {
        // On Leave
        return;
      }

      // Check-in times
      let checkInTime = "08:45:10";
      let status: AttendanceLog["status"] = "On Time";

      if (Math.random() > 0.75) {
        // Late (after 09:00:00)
        const hour = "09";
        const minute = String(Math.floor(Math.random() * 45) + 1).padStart(2, "0");
        const second = String(Math.floor(Math.random() * 60)).padStart(2, "0");
        checkInTime = `${hour}:${minute}:${second}`;
        status = "Late";
      } else {
        // On Time (between 08:30:00 and 08:59:59)
        const minute = String(Math.floor(Math.random() * 30) + 30).padStart(2, "0");
        const second = String(Math.floor(Math.random() * 60)).padStart(2, "0");
        checkInTime = `08:${minute}:${second}`;
      }

      // Check-out times
      const checkoutHour = Math.random() > 0.85 ? "17" : "18";
      const checkoutMinute = String(Math.floor(Math.random() * 60)).padStart(2, "0");
      const checkoutSecond = String(Math.floor(Math.random() * 60)).padStart(2, "0");
      const checkOutTime = `${checkoutHour}:${checkoutMinute}:${checkoutSecond}`;

      logs.push({
        id: `ATT-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        checkInTime,
        checkOutTime,
        status,
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        location: "New Delhi, India",
      });
    });
  }

  return logs;
};

const generateMockLectures = (): LectureSchedule[] => {
  const lectures: LectureSchedule[] = [];
  const employees = INITIAL_EMPLOYEES;
  const subjectsPool: Record<string, { code: string; subject: string; semester: string; room: string }[]> = {
    "EMP-001": [
      { code: "CS-401", subject: "Distributed Systems", semester: "VII Semester", room: "Block A, LH-2" },
      { code: "CS-302", subject: "Compiler Design", semester: "V Semester", room: "Block A, LH-3" }
    ],
    "EMP-002": [
      { code: "CS-201", subject: "Web Engineering", semester: "III Semester", room: "Block A, LH-1" },
      { code: "CS-301", subject: "Design & Analysis of Algorithms", semester: "V Semester", room: "Block B, LH-2" }
    ],
    "EMP-003": [
      { code: "IT-304", subject: "Database Management Systems", semester: "V Semester", room: "Block B, LH-1" },
      { code: "IT-402", subject: "Human-Computer Interaction", semester: "VII Semester", room: "Block B, LH-3" }
    ],
    "EMP-004": [
      { code: "EC-303", subject: "Digital Signal Processing", semester: "V Semester", room: "Block C, LH-1" },
      { code: "EC-401", subject: "Embedded Systems", semester: "VII Semester", room: "Block C, LH-2" }
    ],
    "EMP-005": [] // Admin staff / Dean of Academics doesn't teach lectures
  };

  const times = ["09:00 - 10:00 AM", "11:15 - 12:15 PM", "02:00 - 03:00 PM"];

  // Generate logs for past 10 days (excluding weekends)
  for (let i = 10; i >= 0; i--) { // include today (0)
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = date.toISOString().split("T")[0];

    employees.forEach((emp) => {
      const classes = subjectsPool[emp.id] || [];
      classes.forEach((c, cIdx) => {
        // Decide status based on how old the lecture is
        let status: LectureSchedule["status"] = "Scheduled";
        if (i > 0) {
          // Past days
          const roll = Math.random();
          if (roll > 0.94) {
            status = "Cancelled";
          } else if (roll > 0.88) {
            status = "Rescheduled";
          } else {
            status = "Conducted";
          }
        } else {
          // Today, initially Scheduled
          status = "Scheduled";
        }

        lectures.push({
          id: `LEC-${emp.id}-${dateStr}-${cIdx}`,
          facultyId: emp.id,
          subject: c.subject,
          courseCode: c.code,
          semester: c.semester,
          time: times[cIdx % times.length],
          room: c.room,
          status,
          date: dateStr
        });
      });
    });
  }

  return lectures;
};

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "LV-101",
    employeeId: "EMP-002",
    leaveType: "Sick",
    startDate: getPastDateStr(4),
    endDate: getPastDateStr(4),
    status: "Approved",
    reason: "Severe migraine, doctor advised bed rest.",
    appliedOn: getPastDateStr(5),
  },
  {
    id: "LV-102",
    employeeId: "EMP-003",
    leaveType: "Duty",
    startDate: getPastDateStr(-5), // future leave
    endDate: getPastDateStr(-8),
    status: "Pending",
    reason: "Invited as External Examiner for Practical Exams at IIT Delhi.",
    appliedOn: getPastDateStr(1),
    dutyEventName: "External Practical Examination Duty",
    dutyLocation: "IIT Delhi, Hauz Khas"
  },
  {
    id: "LV-103",
    employeeId: "EMP-004",
    leaveType: "Casual",
    startDate: getPastDateStr(-1),
    endDate: getPastDateStr(-1),
    status: "Pending",
    reason: "Personal work at the university administrative block.",
    appliedOn: getPastDateStr(0),
  },
  {
    id: "LV-104",
    employeeId: "EMP-002",
    leaveType: "Duty",
    startDate: getPastDateStr(2),
    endDate: getPastDateStr(1),
    status: "Approved",
    reason: "Presented a research paper at the IEEE International Conference on Computing.",
    appliedOn: getPastDateStr(3),
    dutyEventName: "IEEE Conference paper presentation",
    dutyLocation: "Varanasi, India"
  }
];

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [lectures, setLectures] = useState<LectureSchedule[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load from local storage
  useEffect(() => {
    const localEmployees = localStorage.getItem("att_employees");
    const localLogs = localStorage.getItem("att_logs");
    const localLeaves = localStorage.getItem("att_leaves");
    const localUser = localStorage.getItem("att_curr_user");
    const localLectures = localStorage.getItem("att_lectures");

    if (localEmployees) setEmployees(JSON.parse(localEmployees));
    else localStorage.setItem("att_employees", JSON.stringify(INITIAL_EMPLOYEES));

    if (localLogs) {
      setAttendanceLogs(JSON.parse(localLogs));
    } else {
      const generated = generateMockLogs();
      setAttendanceLogs(generated);
      localStorage.setItem("att_logs", JSON.stringify(generated));
    }

    if (localLeaves) setLeaveRequests(JSON.parse(localLeaves));
    else localStorage.setItem("att_leaves", JSON.stringify(INITIAL_LEAVE_REQUESTS));

    if (localLectures) {
      setLectures(JSON.parse(localLectures));
    } else {
      const generatedLecs = generateMockLectures();
      setLectures(generatedLecs);
      localStorage.setItem("att_lectures", JSON.stringify(generatedLecs));
    }

    if (localUser) {
      const foundUser = JSON.parse(localUser);
      // Double check the user still exists
      const verified = (localEmployees ? JSON.parse(localEmployees) : INITIAL_EMPLOYEES).find(
        (e: Employee) => e.id === foundUser.id
      );
      setCurrentUser(verified || INITIAL_EMPLOYEES[0]);
    } else {
      setCurrentUser(INITIAL_EMPLOYEES[0]);
      localStorage.setItem("att_curr_user", JSON.stringify(INITIAL_EMPLOYEES[0]));
    }

    setLoading(false);
  }, []);

  // Save changes to localStorage helper
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Check In Function
  const checkIn = (employeeId: string, notes?: string, location?: string, ipAddress?: string) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    // Determine status (Late if after 09:00:00)
    const threshold = new Date();
    threshold.setHours(9, 0, 0);
    const status = now > threshold ? "Late" : "On Time";

    // Prevent double check-in
    const alreadyCheckedIn = attendanceLogs.some(
      (log) => log.employeeId === employeeId && log.date === today && log.checkInTime !== "00:00:00"
    );

    if (alreadyCheckedIn) {
      alert("You have already checked in for today!");
      return;
    }

    const newLog: AttendanceLog = {
      id: `ATT-${employeeId}-${today}-${Date.now()}`,
      employeeId,
      date: today,
      checkInTime: timeStr,
      checkOutTime: null,
      status,
      notes,
      ipAddress: ipAddress || "192.168.1.105", // Mock IP
      location: location || "New Delhi, India (Web App Check-In)",
    };

    const updatedLogs = [newLog, ...attendanceLogs];
    setAttendanceLogs(updatedLogs);
    saveToStorage("att_logs", updatedLogs);
  };

  // Check Out Function
  const checkOut = (employeeId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    const todayLogIndex = attendanceLogs.findIndex(
      (log) => log.employeeId === employeeId && log.date === today && log.checkOutTime === null
    );

    if (todayLogIndex === -1) {
      alert("No active check-in found for today, or you have already checked out.");
      return;
    }

    const updatedLogs = [...attendanceLogs];
    updatedLogs[todayLogIndex] = {
      ...updatedLogs[todayLogIndex],
      checkOutTime: timeStr,
    };

    setAttendanceLogs(updatedLogs);
    saveToStorage("att_logs", updatedLogs);
  };

  // Leave Request Function
  const requestLeave = (
    employeeId: string,
    leaveType: LeaveRequest["leaveType"],
    startDate: string,
    endDate: string,
    reason: string,
    dutyEventName?: string,
    dutyLocation?: string,
    dutyDocName?: string
  ) => {
    const newRequest: LeaveRequest = {
      id: `LV-${Date.now()}`,
      employeeId,
      leaveType,
      startDate,
      endDate,
      status: "Pending",
      reason,
      appliedOn: new Date().toISOString().split("T")[0],
      dutyEventName,
      dutyLocation,
      dutyDocName,
    };

    const updatedLeaves = [newRequest, ...leaveRequests];
    setLeaveRequests(updatedLeaves);
    saveToStorage("att_leaves", updatedLeaves);
  };

  // Update Leave Status (Admin Approval)
  const updateLeaveStatus = (leaveId: string, status: "Approved" | "Rejected", comment?: string) => {
    const updatedLeaves = leaveRequests.map((req) => {
      if (req.id === leaveId) {
        return { ...req, status, hodComment: comment };
      }
      return req;
    });

    setLeaveRequests(updatedLeaves);
    saveToStorage("att_leaves", updatedLeaves);
  };

  // Add Employee Function (Admin)
  const addEmployee = (employeeData: Omit<Employee, "id" | "joinDate" | "status">) => {
    const nextIdNumber = employees.length + 1;
    const newId = `EMP-${String(nextIdNumber).padStart(3, "0")}`;

    const newEmployee: Employee = {
      ...employeeData,
      id: newId,
      joinDate: new Date().toISOString().split("T")[0],
      status: "Active",
    };

    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    saveToStorage("att_employees", updatedEmployees);
  };

  // Switch Active User Simulator
  const switchUser = (employeeId: string) => {
    const foundUser = employees.find((emp) => emp.id === employeeId);
    if (foundUser) {
      setCurrentUser(foundUser);
      saveToStorage("att_curr_user", foundUser);
    }
  };

  // Class / Lecture Conduction Handlers
  const conductLecture = (lectureId: string) => {
    const updated = lectures.map((lec) => {
      if (lec.id === lectureId) {
        return { ...lec, status: "Conducted" as const };
      }
      return lec;
    });
    setLectures(updated);
    saveToStorage("att_lectures", updated);
  };

  const cancelLecture = (lectureId: string) => {
    const updated = lectures.map((lec) => {
      if (lec.id === lectureId) {
        return { ...lec, status: "Cancelled" as const };
      }
      return lec;
    });
    setLectures(updated);
    saveToStorage("att_lectures", updated);
  };

  const rescheduleLecture = (lectureId: string, newTime: string, newRoom: string) => {
    const updated = lectures.map((lec) => {
      if (lec.id === lectureId) {
        return { ...lec, status: "Rescheduled" as const, time: newTime, room: newRoom };
      }
      return lec;
    });
    setLectures(updated);
    saveToStorage("att_lectures", updated);
  };

  return (
    <AttendanceContext.Provider
      value={{
        employees,
        attendanceLogs,
        leaveRequests,
        lectures,
        currentUser,
        loading,
        checkIn,
        checkOut,
        requestLeave,
        updateLeaveStatus,
        addEmployee,
        switchUser,
        conductLecture,
        cancelLecture,
        rescheduleLecture,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
};

