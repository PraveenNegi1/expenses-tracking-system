"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  addExpense,
  getTransactions,
  updateExpense,
  deleteExpense,
} from "@/lib/firestore";

const CATEGORIES = [
  "Food",
  "Rent",
  "Travel",
  "Shopping",
  "Bills",
  "Borrow Return",
  "Other",
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchExpenses = async () => {
      setFetching(true);
      try {
        const exp = await getTransactions(user.uid, "expenses");
        // Sort by latest first
        setExpenses(
          exp.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    fetchExpenses();
  }, [user, router]);

  const handleAddSubmit = async (e) => {
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

      // Refresh expenses list
      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(
        updated.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
      );

      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("Failed to add expense.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditTitle(expense.title);
    setEditAmount(expense.amount);
    setEditCategory(expense.category);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAmount("");
    setEditCategory("");
  };

  const handleUpdate = async (id) => {
    if (!editTitle.trim() || !editAmount || editAmount <= 0) return;

    try {
      await updateExpense(user.uid, id, {
        title: editTitle.trim(),
        amount: Number(editAmount),
        category: editCategory,
      });

      setMessage("Expense updated successfully!");
      setEditingId(null);

      // Refresh list
      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(
        updated.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
      );

      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("Failed to update expense.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteExpense(user.uid, id);
      setMessage("Expense deleted.");

      // Refresh list
      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(
        updated.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
      );

      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("Failed to delete expense.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const isSuccess = message && !error;

  if (!user) return null;

  return (
    <div className="min-h-screen md:ml-32 bg-amber-100 w-full py-8 px-4">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10">
        {/* Add Expense Form */}
        <div className="w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/50">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800">Add Expense</h1>
              <p className="text-gray-600 mt-2">Track your spending wisely</p>
            </div>

            {(message || error) && (
              <div
                className={`mb-6 p-5 rounded-2xl font-medium text-center transition-all shadow-md border ${
                  isSuccess
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                {message || error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-7">
              <input
                type="text"
                placeholder="Expense Title (e.g., Grocery Shopping)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="w-full px-6 py-5 text-lg bg-gray-50/70 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
              />

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
                  className="w-full pl-14 pr-6 py-6 text-4xl font-semibold text-gray-800 bg-gray-50/70 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="w-full px-6 py-5 text-lg bg-gray-50/70 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all cursor-pointer"
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

              <button
                type="submit"
                disabled={loading || !title || !amount}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xl py-5 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>
        </div>

        {/* Expenses List */}
        <div className="w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center lg:text-left">
            Your Expenses
          </h2>

          {fetching ? (
            <div className="text-center py-10 text-gray-600">
              Loading expenses...
            </div>
          ) : expenses.length === 0 ? (
            <div className="bg-white/80 backdrop-blur rounded-3xl p-10 text-center shadow-lg border border-white/50">
              <p className="text-xl text-gray-600">No expenses added yet.</p>
              <p className="text-gray-500 mt-2">
                Start tracking by adding one!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-screen overflow-y-auto pr-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-white/50 p-6 hover:shadow-xl transition-shadow"
                >
                  {editingId === exp.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-red-500"
                      />
                      <div className="relative">
                        <span className="absolute left-4 top-4 text-2xl font-bold text-gray-700">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 text-2xl font-semibold border rounded-xl focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdate(exp.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          {exp.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {exp.category}
                        </p>
                        <p className="text-3xl font-bold text-red-600 mt-3">
                          ₹{exp.amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {exp.date
                            ? new Date(
                                exp.date.toDate ? exp.date.toDate() : exp.date
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Date not available"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 ml-4">
                        <button
                          onClick={() => startEdit(exp)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center mt-12">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-red-700 hover:text-red-800 font-medium flex items-center mx-auto gap-2 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
