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
import Sidebar from "@/components/Navbar";

const CATEGORIES = [
  "Food",
  "Rent",
  "Travel",
  "Shopping",
  "Bills",
  "Borrow Return",
  "Other",
];

const PAYMENT_METHODS = ["Card", "Online", "Cash"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState(
    PAYMENT_METHODS[0]
  );

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchExpenses = async () => {
      setFetching(true);
      try {
        const exp = await getTransactions(user.uid, "expenses");
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

  // Check if all required fields are filled
  const isAddFormValid =
    title.trim() !== "" &&
    amount !== "" &&
    Number(amount) > 0 &&
    category &&
    paymentMethod;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!isAddFormValid) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await addExpense(user.uid, {
        title: title.trim(),
        category,
        amount: Number(amount),
        method: paymentMethod, // Save payment method
      });

      setMessage("Expense added!");
      setTitle("");
      setAmount("");
      setCategory(CATEGORIES[0]);
      setPaymentMethod(PAYMENT_METHODS[0]);

      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(
        updated.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
      );

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to add expense.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditTitle(expense.title);
    setEditAmount(expense.amount);
    setEditCategory(expense.category || CATEGORIES[0]);
    setEditPaymentMethod(expense.method || PAYMENT_METHODS[0]);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const isEditFormValid =
    editTitle.trim() !== "" &&
    editAmount !== "" &&
    Number(editAmount) > 0 &&
    editCategory &&
    editPaymentMethod;

  const handleUpdate = async (id) => {
    if (!isEditFormValid) return;

    try {
      await updateExpense(user.uid, id, {
        title: editTitle.trim(),
        amount: Number(editAmount),
        category: editCategory,
        method: editPaymentMethod,
      });

      setMessage("Expense updated!");
      setEditingId(null);

      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(
        updated.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
      );

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to update.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;

    try {
      await deleteExpense(user.uid, id);
      setMessage("Expense deleted.");

      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(
        updated.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
      );

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete.");
      setTimeout(() => setError(""), 4000);
    }
  };

  if (!user) return null;

  return (
    <div className="md:ml-44">
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />

        <div className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Add Expense
            </h1>
            <p className="text-gray-600 text-sm mt-1">Track your spending</p>
          </div>

          {(message || error) && (
            <div
              className={`mb-5 p-3 rounded-lg text-center text-sm font-medium shadow-sm border ${
                message
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              {message || error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Expense title (e.g. Lunch)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />

              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl font-bold text-gray-700">
                  ₹
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 text-2xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* New Payment Method Field */}
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={loading || !isAddFormValid}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>

          {/* Expenses List */}
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Your Expenses
          </h2>

          {fetching ? (
            <p className="text-center text-gray-600 py-8">Loading...</p>
          ) : expenses.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-gray-600">No expenses yet.</p>
              <p className="text-sm text-gray-500 mt-1">Add one above!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3 p-4">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {editingId === exp.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-lg">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-lg font-medium"
                            />
                          </div>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          {/* Edit Payment Method */}
                          <select
                            value={editPaymentMethod}
                            onChange={(e) =>
                              setEditPaymentMethod(e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(exp.id)}
                              disabled={!isEditFormValid}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {exp.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {exp.category} • {exp.method || "Card"}
                            </p>
                            <p className="text-xl font-bold text-red-600 mt-1">
                              ₹{exp.amount.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {exp.date
                                ? new Date(
                                    exp.date.toDate
                                      ? exp.date.toDate()
                                      : exp.date
                                  ).toLocaleDateString("en-IN")
                                : "No date"}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 text-right">
                            <button
                              onClick={() => startEdit(exp)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 mx-auto"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
