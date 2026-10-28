"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/admin" },
    { name: "Departments", href: "/admin/departments" },
    { name: "Classes", href: "/admin/classes" },
    { name: "Courses", href: "/admin/courses" },
    { name: "Halls", href: "/admin/halls" },
    { name: "Timetables", href: "/admin/timetables" },
    { name: "Settings", href: "/admin/settings" },
  ];

  return (
    <div className="bg-white border-b border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
      <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? "bg-blue-900 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
