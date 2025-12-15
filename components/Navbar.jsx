"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold text-blue-600">
          ExpenseTracker
        </Link>
        <div className="flex items-center space-x-2 md:space-x-6 text-sm md:text-base">
          {!user ? (
            <>
              <Link href="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <Link href="/income" className="hover:text-blue-600">Add Income</Link>
              <Link href="/expenses" className="hover:text-blue-600">Add Expense</Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}