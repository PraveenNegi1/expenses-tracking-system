"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addIncome } from "@/lib/firestore";

export default function IncomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    setLoading(true);
    try {
      await addIncome(user.uid, amount);
      setMessage("Income added successfully!");
      setAmount("");

      // This refreshes server data on dashboard if you go back
      router.refresh(); 

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error adding income. Try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8">Add Income</h1>
      {message && (
        <p className={`mb-4 font-medium ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="number"
          placeholder="Income Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="1"
          disabled={loading}
          className="w-full p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-lg text-lg hover:bg-green-700 disabled:bg-green-400"
        >
          {loading ? "Adding..." : "Add Income"}
        </button>
      </form>

      {/* Optional: Button to go back to dashboard */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}