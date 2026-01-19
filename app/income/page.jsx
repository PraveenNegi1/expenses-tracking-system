"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  addIncome,
  updateTransaction,
  deleteTransaction,
} from "@/lib/firestore";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Sidebar from "@/components/Navbar";

export default function IncomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [incomes, setIncomes] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Edit modal state
  const [editingIncome, setEditingIncome] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const incomesRef = collection(db, "users", user.uid, "income");
    const q = query(incomesRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
        }));
        setIncomes(data);
        setHistoryLoading(false);
      },
      (error) => {
        console.error("Error fetching incomes:", error);
        setHistoryLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, router]);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    setLoading(true);
    setMessage("");

    try {
      await addIncome(user.uid, parseFloat(amount));

      setMessage("Income added successfully!");
      setAmount("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error adding income.");
      console.error(error);
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setEditAmount(income.amount.toString());
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editAmount || editAmount <= 0) return;

    setEditLoading(true);
    setMessage("");

    try {
      await updateTransaction(user.uid, "income", editingIncome.id, {
        amount: parseFloat(editAmount),
      });

      setMessage("Income updated successfully!");
      setEditingIncome(null);
      setEditAmount("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error updating income.");
      console.error(error);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (incomeId) => {
    if (!confirm("Are you sure you want to delete this income record?")) return;

    setMessage("");

    try {
      await deleteTransaction(user.uid, "income", incomeId);
      setMessage("Income deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error deleting income.");
      console.error(error);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!user) return null;

  return (
    <div className="md:ml-44">
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />

        <div className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Add Income
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Enter your income amount
            </p>
          </div>

          {message && (
            <div
              className={`mb-5 p-3 rounded-lg text-center text-sm font-medium shadow-sm border ${
                message.includes("success")
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
            <form onSubmit={handleAddIncome} className="space-y-4">
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
                  className="w-full pl-12 pr-4 py-3.5 text-2xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !amount}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Income"}
              </button>
            </form>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Income History
          </h2>

          {historyLoading ? (
            <p className="text-center text-gray-600 py-8">Loading history...</p>
          ) : incomes.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-gray-600">No income records yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Add your first income above!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-5 font-medium text-gray-700">
                        Date
                      </th>
                      <th className="py-3 px-5 font-medium text-gray-700 text-right">
                        Amount
                      </th>
                      <th className="py-3 px-5 font-medium text-gray-700 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map((income) => (
                      <tr
                        key={income.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-5 text-gray-800">
                          {formatDate(income.date)}
                        </td>
                        <td className="py-3 px-5 text-right font-medium text-green-700">
                          ₹{income.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            onClick={() => handleEdit(income)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(income.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

      {editingIncome && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Edit Income
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xl font-bold text-gray-700">
                  ₹
                </span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  className="w-full pl-12 pr-4 py-3 text-xl border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingIncome(null);
                    setEditAmount("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
