"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderAuth from "./HeaderAuth";
import { CalendarIcon, PolyLogo, MenuIcon, XIcon, ShieldCheckIcon, LogOutIcon } from "./Icons";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 print:hidden shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-18 items-center">
          {/* Logo & Institution Branding */}
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3.5 group min-w-0">
            <PolyLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 tracking-tight leading-tight group-hover:text-blue-900 transition-colors truncate">
                Examination Timetable
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-900/80 uppercase tracking-wider truncate">
                Akwa Ibom Poly &bull; Ikot Osurua
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link
              href="/timetables"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                pathname === "/timetables"
                  ? "bg-blue-50 text-blue-900 font-bold border border-blue-200/60"
                  : "text-slate-600 hover:text-blue-900 hover:bg-slate-50"
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-blue-800" />
              <span>Notice Board Timetables</span>
            </Link>
            <HeaderAuth />
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900/50 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6 text-slate-900" />
              ) : (
                <MenuIcon className="w-6 h-6 text-slate-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <Link
            href="/timetables"
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
              pathname === "/timetables"
                ? "bg-blue-50 text-blue-950 font-black border border-blue-200/60"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-blue-800" />
            <span>Notice Board Timetables</span>
          </Link>

          {user ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="px-4 py-1.5 text-xs text-slate-500 font-medium truncate">
                Signed in: <span className="font-bold text-slate-700">{user.email}</span>
              </div>
              <Link
                href="/admin"
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                  pathname.startsWith("/admin")
                    ? "bg-blue-900 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
                <span>Admin Committee Portal</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition"
              >
                <LogOutIcon className="w-4 h-4 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/"
                className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-900 text-white shadow-xs"
              >
                <ShieldCheckIcon className="w-4 h-4 text-amber-300" />
                <span>Admin Committee Login</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
