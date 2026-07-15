import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AttendanceProvider } from "@/context/AttendanceContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApexTime | Modern Employee Attendance & Leave Management",
  description: "A premium, professional, and interactive dashboard for tracking employee attendance, hours, shifts, and leaves in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem("theme");
                if (savedTheme === "dark") {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
                const savedAccent = localStorage.getItem("theme-accent") || "teal";
                document.documentElement.setAttribute("data-accent", savedAccent);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg-base text-txt-primary transition-colors duration-300">
        <AttendanceProvider>
          {children}
        </AttendanceProvider>
      </body>
    </html>
  );
}
