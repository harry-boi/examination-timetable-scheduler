"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PolyLogo, ShieldCheckIcon, AlertTriangleIcon, CalendarIcon, ArrowRightIcon } from "@/components/Icons";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already logged in, redirect straight to admin dashboard
  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.replace("/admin");
        } else {
          setCheckingAuth(false);
        }
      });
    } catch {
      setCheckingAuth(false);
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMessage(
            "Invalid email or password. Please verify your credentials and try again."
          );
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the authentication server. Please check your network connection."
      );
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-6 sm:my-16 px-2 sm:px-0">
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200/90 relative overflow-hidden">
        {/* Top accent gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 to-indigo-600" />

        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex justify-center mb-1">
            <PolyLogo className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Committee Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Time Table &amp; Class Allocation Committee
            <br />
            <span className="font-semibold text-slate-800">Akwa Ibom State Polytechnic, Ikot Osurua</span>
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 text-xs sm:text-sm bg-rose-50 text-rose-900 border border-rose-200 rounded-xl flex items-start space-x-2.5 animate-in fade-in"
          >
            <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authentication Failed:</span> {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@akwaibompoly.edu.ng"
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl text-sm transition shadow-sm hover:shadow flex items-center justify-center space-x-2"
            >
              <ShieldCheckIcon className="w-4 h-4 text-amber-300" />
              <span>{isLoading ? "Authenticating..." : "Sign In to Admin Portal"}</span>
            </button>
          </div>
        </form>

        {/* Student Notice Board Quick Navigation */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium">
            Student or invigilator checking examination schedules?
          </p>
          <Link
            href="/timetables"
            className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-50 hover:bg-blue-50 text-blue-950 border border-slate-200/80 hover:border-blue-200 rounded-xl text-xs font-bold transition shadow-2xs group"
          >
            <CalendarIcon className="w-4 h-4 text-blue-900" />
            <span>View Student &amp; Notice Board Timetables</span>
            <ArrowRightIcon className="w-3.5 h-3.5 text-blue-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
