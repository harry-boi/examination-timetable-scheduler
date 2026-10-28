import "./globals.css";
import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import { CalendarIcon, PolyLogo } from "@/components/Icons";

export const metadata = {
  title: "Examination Timetable System - Akwa Ibom State Polytechnic",
  description: "Official Examination Timetable Scheduling and Conflict Detection System for Akwa Ibom State Polytechnic, Ikot Osurua",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50/70 text-slate-900 selection:bg-blue-900 selection:text-white">
        {/* Institutional Top Accent Ribbon */}
        <div className="h-1 bg-gradient-to-r from-blue-900 via-indigo-700 to-amber-500 print:hidden" />

        {/* Global Navigation Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 print:hidden shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-18 items-center">
              {/* Institution Emblem and Name */}
              <Link href="/" className="flex items-center space-x-3.5 group">
                <PolyLogo className="w-10 h-10 group-hover:scale-105 transition-transform" />
                <div className="flex flex-col">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight group-hover:text-blue-900 transition-colors">
                    Examination Timetable System
                  </span>
                  <span className="text-[11px] font-semibold text-blue-900/80 uppercase tracking-wider">
                    Akwa Ibom State Polytechnic &bull; Ikot Osurua
                  </span>
                </div>
              </Link>

              {/* Navigation Actions */}
              <nav className="flex items-center space-x-1 sm:space-x-3">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition"
                >
                  Home
                </Link>
                <Link
                  href="/timetables"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition"
                >
                  <CalendarIcon className="w-4 h-4 text-blue-800" />
                  <span>Timetables</span>
                </Link>
                <HeaderAuth />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {children}
        </main>

        {/* Academic Footer */}
        <footer className="bg-white border-t border-slate-200/90 py-8 print:hidden text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <PolyLogo className="w-6 h-6 text-xs" />
              <div>
                <p className="font-bold text-slate-800">
                  Time Table and Class Allocation Committee
                </p>
                <p>Akwa Ibom State Polytechnic, Ikot Osurua, Nigeria</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="font-medium text-slate-700">
                Web-based Examination Scheduling &amp; Conflict Detection Engine
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Class-level allocation matching polytechnic guidelines
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
