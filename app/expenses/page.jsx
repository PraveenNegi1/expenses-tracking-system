"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addExpense } from "@/lib/firestore";

const CATEGORIES = ["Food", "Rent", "Travel", "Shopping", "Bills", "Other"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || amount <= 0) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await addExpense(user.uid, {
        title: title.trim(),
        category,
        amount: Number(amount),
      });

      setMessage("Expense added successfully!");
      setTitle("");
      setAmount("");
      setCategory(CATEGORIES[0]);

      router.refresh();

      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to add expense. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = message && !error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Glass Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Add Expense</h1>
            <p className="text-gray-600 mt-2">Track your spending wisely</p>
          </div>

          {/* Success / Error Message */}
          {(message || error) && (
            <div
              className={`mb-6 p-5 rounded-2xl font-medium text-center transition-all duration-500 shadow-md border ${
                isSuccess
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              {isSuccess ? (
                <svg
                  className="w-7 h-7 mx-auto mb-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7 mx-auto mb-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {message || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Expense Title (e.g., Grocery Shopping)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
              className="w-full px-6 py-5 text-lg bg-gray-50/70 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all placeholder-gray-500 disabled:opacity-60"
            />

            {/* Amount Input with ₹ Prefix */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-700">₹</span>
              </div>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                step="0.01"
                disabled={loading}
                className="w-full pl-14 pr-6 py-6 text-4xl font-semibold text-gray-800 bg-gray-50/70 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all disabled:opacity-60"
              />
            </div>

            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="w-full px-6 py-5 text-lg bg-gray-50/70 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all disabled:opacity-60 cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 1.5rem center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "1.5em",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !title || !amount}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xl py-5 rounded-2xl shadow-lg hover:shadow-xl hover:from-red-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding Expense...
                </>
              ) : (
                "Add Expense"
              )}
            </button>
          </form>

          {/* Back to Dashboard */}
          <div className="mt-10 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-red-700 hover:text-red-800 font-medium flex items-center mx-auto gap-2 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
