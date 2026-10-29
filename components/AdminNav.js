"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  BuildingIcon,
  UsersIcon,
  BookOpenIcon,
  LayersIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "./Icons";

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/admin", icon: <ShieldCheckIcon className="w-4 h-4" /> },
    { name: "Timetables", href: "/admin/timetables", icon: <CalendarIcon className="w-4 h-4" /> },
    { name: "Departments", href: "/admin/departments", icon: <LayersIcon className="w-4 h-4" /> },
    { name: "Classes", href: "/admin/classes", icon: <UsersIcon className="w-4 h-4" /> },
    { name: "Courses", href: "/admin/courses", icon: <BookOpenIcon className="w-4 h-4" /> },
    { name: "Halls", href: "/admin/halls", icon: <BuildingIcon className="w-4 h-4" /> },
    { name: "Settings", href: "/admin/settings", icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white border-b border-slate-200 -mx-3.5 sm:-mx-6 lg:-mx-8 px-3.5 sm:px-6 lg:px-8 mb-6 sm:mb-8 sticky top-16 sm:top-18 z-30 shadow-2xs print:hidden">
      <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 sm:py-2.5 touch-pan-x scrollbar-none">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
