"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/income", label: "Add Income", icon: "💰" },
    { href: "/expenses", label: "Add Expense", icon: "🛒" },
  ];

  const isActive = (href) => pathname === href;

  return (
    <>
      {/* Mobile Hamburger Button - Smaller & Cleaner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label="Toggle menu"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Slimmer & Compact */}
      <aside
        className={`bg-white border-r border-gray-200 text-gray-800 w-56 min-h-screen fixed left-0 top-0 flex flex-col transition-transform duration-300 ease-in-out z-40 shadow-lg
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo - Compact */}
        <div className="p-4 border-b border-gray-200">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="text-xl font-bold text-purple-600"
          >
            ExpenseTracker
          </Link>
        </div>

        {/* Navigation Links - Tighter Spacing */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive(item.href)
                        ? "bg-purple-100 text-purple-700 shadow-sm"
                        : "hover:bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button - Compact */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 shadow-sm"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
