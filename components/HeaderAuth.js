"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheckIcon, LogOutIcon } from "./Icons";

export default function HeaderAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
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
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  if (loading) {
    return <div className="h-8 w-24 bg-slate-200/60 animate-pulse rounded-lg"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3">
        <Link
          href="/admin"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
            pathname.startsWith("/admin")
              ? "bg-blue-900 text-white shadow-sm"
              : "text-slate-700 hover:text-blue-900 hover:bg-slate-100"
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
          <span>Admin Portal</span>
        </Link>
        <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs uppercase">
            {user.email?.[0] || "A"}
          </div>
          <span className="text-xs text-slate-600 max-w-[140px] truncate font-medium">
            {user.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200/80 transition"
          title="Sign out from admin session"
        >
          <LogOutIcon className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/admin"
      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-900 hover:bg-blue-800 text-white shadow-sm hover:shadow transition"
    >
      <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
      <span>Admin Login</span>
    </Link>
  );
}
