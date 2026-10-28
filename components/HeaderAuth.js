"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
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
    return (
      <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-md"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <Link
          href="/admin"
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
            pathname.startsWith("/admin")
              ? "bg-blue-100 text-blue-900 font-semibold"
              : "text-slate-700 hover:text-blue-900 hover:bg-slate-100"
          }`}
        >
          Admin
        </Link>
        <span className="hidden md:inline-block text-xs text-slate-500 max-w-[150px] truncate">
          {user.email}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/admin"
      className="px-3 py-2 rounded-md text-sm font-medium bg-blue-900 text-white hover:bg-blue-800 transition"
    >
      Admin
    </Link>
  );
}
