import "./globals.css";
import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";

export const metadata = {
  title: "Examination Timetable System - Akwa Ibom State Polytechnic",
  description: "Web-based Examination Timetable Scheduling and Conflict Detection System for Akwa Ibom State Polytechnic, Ikot Osurua",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {/* Header & Navigation */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-3">
                <Link href="/" className="flex flex-col">
                  <span className="font-bold text-lg sm:text-xl text-blue-900 tracking-tight">
                    Examination Timetable System
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Akwa Ibom State Polytechnic, Ikot Osurua
                  </span>
                </Link>
              </div>

              <nav className="flex items-center space-x-1 sm:space-x-4">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition"
                >
                  Home
                </Link>
                <Link
                  href="/timetables"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition"
                >
                  Timetables
                </Link>
                <HeaderAuth />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 gap-2">
            <p>
              Examination Timetable Scheduling &amp; Conflict Detection System
            </p>
            <p>
              Akwa Ibom State Polytechnic, Ikot Osurua
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
