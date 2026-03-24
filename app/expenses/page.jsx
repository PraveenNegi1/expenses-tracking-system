"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  addExpense,
  getTransactions,
  updateExpense,
  deleteExpense,
} from "@/lib/firestore";
import Sidebar from "@/components/Navbar";
import { 
  Plus, Edit2, Trash2, Search, IndianRupee, TrendingUp, Calendar 
} from "lucide-react";

const CATEGORIES = [
  "Food", "Groceries", "Dining Out", "Rent", "Travel", "Transport",
  "Shopping", "Bills", "Utilities", "Mobile Recharge", "Borrow Return",
  "Healthcare", "Insurance", "Education", "Entertainment", "Personal Care",
  "Home Maintenance", "EMI/Loans", "Other",
];

const PAYMENT_METHODS = ["Card", "Online", "Cash"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [loading, setLoading] = useState(false);

  // List states
  const [expenses, setExpenses] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Editing
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState(PAYMENT_METHODS[0]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMethod, setFilterMethod] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [timeFilter, setTimeFilter] = useState("all");

  // Messages
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchExpenses = async () => {
      setFetching(true);
      try {
        const exp = await getTransactions(user.uid, "expenses");
        setExpenses(exp);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    fetchExpenses();
  }, [user, router]);

  // Filtered & Sorted Expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(exp =>
        exp.title?.toLowerCase().includes(term) ||
        exp.category?.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== "All") {
      filtered = filtered.filter(exp => exp.category === filterCategory);
    }

    if (filterMethod !== "All") {
      filtered = filtered.filter(exp => exp.method === filterMethod);
    }

    if (timeFilter === "thisMonth") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(exp => {
        const expDate = exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
        return expDate >= startOfMonth;
      });
    }

    filtered.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);

      if (sortBy === "newest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "high") return b.amount - a.amount;
      if (sortBy === "low") return a.amount - b.amount;
      return 0;
    });

    return filtered;
  }, [expenses, searchTerm, filterCategory, filterMethod, sortBy, timeFilter]);

  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCount = filteredExpenses.length;
  const avgExpense = expenseCount > 0 ? Math.round(totalSpent / expenseCount) : 0;

  // Add, Update, Delete functions (same as before - kept clean)
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    setLoading(true);
    setMessage(""); setError("");

    try {
      await addExpense(user.uid, {
        title: title.trim(),
        category,
        amount: Number(amount),
        method: paymentMethod,
      });

      setMessage("Expense added successfully! 🎉");
      setTitle(""); setAmount(""); setCategory(CATEGORIES[0]); setPaymentMethod(PAYMENT_METHODS[0]);

      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(updated);
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

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = async (id) => {
    if (!editTitle.trim() || !editAmount || Number(editAmount) <= 0) return;

    try {
      await updateExpense(user.uid, id, {
        title: editTitle.trim(),
        amount: Number(editAmount),
        category: editCategory,
        method: editPaymentMethod,
      });

      setMessage("Expense updated successfully!");
      setEditingId(null);

      const updated = await getTransactions(user.uid, "expenses");
      setExpenses(updated);
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
      setExpenses(updated);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete.");
      setTimeout(() => setError(""), 4000);
    }
  };

  if (!user) return null;

  return (
    <div className="md:ml-44 min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-4 md:p-8">
          {/* Header & Stats (same as before) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Expenses</h1>
              <p className="text-gray-600 mt-1">Track every rupee wisely</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 md:mt-0 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>

          {(message || error) && (
            <div className={`mb-6 p-4 rounded-2xl text-center font-medium ${message ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message || error}
            </div>
          )}

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-3xl font-semibold mt-2">₹{totalSpent.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-3xl font-semibold mt-2">{expenseCount}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Average Expense</p>
              <p className="text-3xl font-semibold mt-2">₹{avgExpense}</p>
            </div>
          </div>

          {/* Add Expense Form */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold">Add New Expense</h2>
            </div>

            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Expense title (e.g. Dinner at restaurant)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:border-red-500"
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <span className="absolute left-5 top-4 text-2xl font-bold text-gray-700">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 py-4 text-2xl font-semibold border border-gray-200 rounded-2xl focus:outline-none focus:border-red-500"
                  disabled={loading}
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-red-500"
                disabled={loading}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-red-500"
                disabled={loading}
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <button
                type="submit"
                disabled={loading || !title.trim() || !amount || Number(amount) <= 0}
                className="md:col-span-2 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-4 rounded-2xl text-lg transition-all disabled:opacity-70"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none"
              />
            </div>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-5 py-3 bg-white border border-gray-200 rounded-2xl">
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="px-5 py-3 bg-white border border-gray-200 rounded-2xl">
              <option value="All">All Methods</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="px-5 py-3 bg-white border border-gray-200 rounded-2xl">
              <option value="all">All Time</option>
              <option value="thisMonth">This Month</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-5 py-3 bg-white border border-gray-200 rounded-2xl">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="high">Highest Amount</option>
              <option value="low">Lowest Amount</option>
            </select>
          </div>

          {/* SCROLLABLE TRANSACTIONS SECTION */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-2xl font-semibold text-gray-800">Your Transactions</h2>
              <span className="text-sm text-gray-500">({filteredExpenses.length} expenses)</span>
            </div>

            {/* Scrollable Area */}
            <div className="max-h-[520px] overflow-y-auto custom-scroll">
              {fetching ? (
                <div className="py-20 text-center text-gray-500">Loading your expenses...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <IndianRupee className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No expenses found</p>
                  <p className="text-sm text-gray-500 mt-1">Try changing filters or add a new one</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-6 hover:bg-gray-50 transition-colors group"
                    >
                      {editingId === exp.id ? (
                        // Edit Form (compact)
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-4 py-3 border rounded-2xl"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <span className="absolute left-4 top-3.5">₹</span>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-full pl-10 py-3 border rounded-2xl"
                              />
                            </div>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="px-4 py-3 border rounded-2xl"
                            >
                              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => handleUpdate(exp.id)} className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-medium">Save</button>
                            <button onClick={cancelEdit} className="flex-1 bg-gray-200 py-3 rounded-2xl font-medium">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        // Normal View
                        <div className="flex justify-between items-center">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <IndianRupee className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{exp.title}</h3>
                              <p className="text-sm text-gray-600">
                                {exp.category} • {exp.method}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {exp.date ? new Date(exp.date.toDate ? exp.date.toDate() : exp.date).toLocaleDateString("en-IN", { 
                                  day: 'numeric', month: 'short', year: 'numeric' 
                                }) : "No date"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-red-600">
                                ₹{exp.amount.toLocaleString("en-IN")}
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(exp)}
                                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                              >
                                <Edit2 size={16} /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(exp.id)}
                                className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styling */}
      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}