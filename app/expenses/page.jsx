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
  const [message, setMessage] = useState(""); // e.g., "Expense added successfully!"
  const [error, setError] = useState("");     // e.g., "Failed to add expense"
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || amount <= 0) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await addExpense(user.uid, { title, category, amount: Number(amount) });

      setMessage("Expense added successfully!");
      setTitle("");
      setAmount("");

      // Helps dashboard refresh data when you go back
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to add expense. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8">Add Expense</h1>

      {/* Success Alert */}
      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">
          <strong>✓ Success:</strong> {message}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg">
          <strong>✗ Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          placeholder="Expense Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
          className="w-full p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        />
        <input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="1"
          disabled={loading}
          className="w-full p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
          className="w-full p-4 text-lg border rounded-lg disabled:opacity-50"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-4 rounded-lg text-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          {loading ? "Adding Expense..." : "Add Expense"}
        </button>
      </form>

      {/* Optional: Quick link back to dashboard */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-600 hover:underline text-lg"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}