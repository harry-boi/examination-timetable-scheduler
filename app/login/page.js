"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PolyLogo, ShieldCheckIcon, AlertTriangleIcon } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="max-w-md mx-auto my-8 sm:my-16">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200/90 relative overflow-hidden">
        {/* Top accent gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 to-indigo-600" />

        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex justify-center mb-1">
            <PolyLogo className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Committee Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Sign in to manage examination timetables and hall allocations.
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
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 focus:border-transparent transition-all"
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
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 focus:border-transparent transition-all"
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

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-blue-900 transition inline-flex items-center space-x-1"
          >
            <span>&larr;</span>
            <span>Return to Public Timetable Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
