"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

      // Successful login
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setErrorMessage(
        "Unable to connect to the authentication server. Please check your internet connection or Supabase settings."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Administrator Login</h1>
        <p className="text-sm text-slate-600 mt-1">
          Time Table &amp; Class Allocation Committee Access
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 text-sm bg-red-50 text-red-800 border border-red-200 rounded-lg flex items-start space-x-2"
        >
          <span className="font-semibold text-red-900">Error:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-medium rounded-lg text-sm transition shadow-sm"
        >
          {isLoading ? "Signing in..." : "Sign In to Admin Portal"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-800 transition"
        >
          &larr; Back to Public Timetables
        </Link>
      </div>
    </div>
  );
}
