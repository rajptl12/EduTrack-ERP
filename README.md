# 🎓 EduTrack ERP
### Faculty Attendance & Leave Management System

> A premium, full-featured **Enterprise Resource Planning (ERP) portal** for educational institutions — built to manage faculty attendance, leave requests, lecture schedules, and academic records with a modern, college-grade interface.

---

## 📸 Overview

EduTrack ERP is a **Next.js 16** web application designed for colleges and universities. It provides a role-based portal where **Admins (HOD/Principal)** can manage all faculty data, and **Faculty members** can mark attendance, apply for leave, and view their academic records — all in real time.

---

## ✨ Features

### 🏠 Dashboard (Home)
- **Live Clock & Date** displayed in the header (real-time, updates every second)
- **RFID Check-In / Check-Out** simulation with terminal selection (Block A, Block C)
- **Weekly Timetable** — per-faculty lecture schedule with subject, course code, time, and room
- **Lecture Status Tracker** — mark lectures as Conducted, Cancelled, or Rescheduled
- **Attendance Stats** — On Time, Late, Half Day, Absent counts at a glance
- **Activity Network Graph** — visual node map of faculty attendance connectivity
- **Recent Logs** — latest attendance entries with timestamps and status badges

### 👨‍🏫 Faculty Directory (`/employees`)
- Full faculty profile cards with avatar, department, job title, cabin number, and subjects
- **Admin-only**: Add new faculty members via a slide-in form
- Filter and search faculty by name or department
- View individual faculty status (Active / Inactive)

### 📋 Leave Management (`/leaves`)
- Apply for **Sick, Casual, Annual, Maternity/Paternity, or Duty Leave**
- **Duty Leave** requires event name, venue/location, and an invitation letter document (simulated upload)
- Duty invitation letter rendered as an **official scan preview** with organization letterhead
- Admin sees all leave requests and can **Approve / Reject** with HOD remarks
- Faculty sees only their own leave history

### 📊 Leave History & Spreadsheet Audit (`/history`)
- **Spreadsheet-style table** mimicking Google Sheets / Excel for HOD audit trail
- Inline **status editing** (double-click cell to change Approved/Rejected/Pending)
- Inline **HOD Remarks** editing directly in the table row
- Formula bar to view/edit selected cell content
- **"View Audit"** modal with full leave record detail, duty order verification, and official letter preview
- Sheet tab switcher UI (LeaveRegistry, Attendance_Logs, Faculty_Database)

### 📅 Attendance Records (`/records`)
- Full attendance log table for all faculty
- Filter by employee, date range, and status
- Export-ready layout for reporting

### 🔔 Notifications
- Bell icon in header shows **pending leave requests** requiring action
- Real-time badge count with pulse animation

### 🎨 Theming
- **Light / Dark mode** toggle (persisted via localStorage)
- **5 Accent colour themes**: Teal Aurora, Royal Amethyst, Emerald Breeze, Sunset Glow, Cyber Neon
- Theme and accent preferences saved across sessions

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.2.10 | React framework with App Router |
| **React** | 19.2.4 | UI library |
| **TypeScript** | ^5 | Type safety |
| **Tailwind CSS** | ^4 | Utility-first styling |
| **Lucide React** | ^1.23.0 | Icon library |
| **Turbopack** | (bundled) | Fast dev server bundler |

> **No database** — all state is managed via React Context (`AttendanceContext`) with `localStorage` persistence for theme preferences. This makes it fully client-side and deployable without a backend.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rajptl12/EduTrack-ERP.git

# 2. Navigate into the project directory
cd EduTrack-ERP

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 👥 User Roles

The system supports two roles, switchable via the **Sandbox Controls** panel (bottom-right corner):

| Role | Access Level |
|---|---|
| **Admin** (HOD / Principal) | Full access — view all faculty, approve/reject leaves, edit HOD remarks, manage employees |
| **Employee** (Faculty) | Restricted access — view own dashboard, apply for leave, check in/out |

### Demo Personas (pre-loaded)

| Name | Role | Department |
|---|---|---|
| Dr. Ananya Sharma | Admin | Computer Science |
| Prof. Rohan Mehta | Employee | Computer Science |
| Dr. Priya Nair | Employee | Information Technology |
| Prof. Arjun Patel | Employee | Electronics & Comm. |
| Ms. Sneha Kulkarni | Employee | Computer Science |

> Switch between personas using the **Sandbox Controls** panel at the bottom-right of the screen.

---

## 📁 Project Structure

```
EduTrack-ERP/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard (Home)
│   │   ├── employees/page.tsx    # Faculty Directory
│   │   ├── leaves/page.tsx       # Leave Management
│   │   ├── history/page.tsx      # Leave History & Audit
│   │   ├── records/page.tsx      # Attendance Records
│   │   ├── layout.tsx            # Root layout & theme script
│   │   └── globals.css           # Global CSS & design tokens
│   ├── components/
│   │   └── Layout/
│   │       ├── Header.tsx        # Top navigation bar with college branding & live clock
│   │       ├── Sidebar.tsx       # Collapsible navigation sidebar
│   │       ├── Shell.tsx         # Page shell wrapper (header + sidebar + content)
│   │       └── SandboxControls.tsx  # Persona switcher (demo mode)
│   └── context/
│       └── AttendanceContext.tsx # Global state — employees, logs, leaves, lectures
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config (via postcss)
└── README.md
```

---

## 🎓 College Branding

The header features:
- **EduTrack Institute** emblem with a GraduationCap icon
- **Department of Administration & Staff Management** tagline
- **Live real-time clock** (HH:MM:SS + full date) in the centre
- User profile with name and role displayed on the right

---

## 🧩 Key Design Decisions

- **No backend required** — ideal for demos, college projects, and prototypes
- **Role-based UI** — components conditionally render based on `currentUser.role`
- **Sandbox Persona Switcher** — allows testing both Admin and Employee workflows without login
- **Official Duty Letter Preview** — renders a realistic invitation letter scan with watermark stamp for Duty leave verification
- **Spreadsheet UI** — HOD can audit and edit leave records in a familiar grid interface

---

## 📜 License

This project is built for academic/educational demonstration purposes.

---

## 👨‍💻 Author

**Raj** — [@rajptl12](https://github.com/rajptl12)

> Built with ❤️ for **EduTrack Institute** — *Dept. of Administration & Staff Management*
