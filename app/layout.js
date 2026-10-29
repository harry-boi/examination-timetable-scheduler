import "./globals.css";
import Navbar from "@/components/Navbar";
import { PolyLogo } from "@/components/Icons";

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

        {/* Responsive Navbar */}
        <Navbar />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
          {children}
        </main>

        {/* Academic Footer */}
        <footer className="bg-white border-t border-slate-200/90 py-6 sm:py-8 print:hidden text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <PolyLogo className="w-6 h-6 text-xs shrink-0" />
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
