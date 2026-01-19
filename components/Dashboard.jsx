"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Filter states
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterMinAmount, setFilterMinAmount] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const inc = await getTransactions(user.uid, "income");
        const exp = await getTransactions(user.uid, "expenses");
        setIncome(inc);
        setExpenses(exp);
      };
      fetchData();
    }
  }, [user]);

  const filteredIncome = income.filter((i) => {
    const date = i.date.toDate ? i.date.toDate() : i.date;
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const filteredExpenses = expenses.filter((e) => {
    const date = e.date.toDate ? e.date.toDate() : e.date;
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBalance = totalIncome - totalExpenses;
  const totalSavings = totalBalance > 0 ? totalBalance : 0;

  const categoryMap = {};
  filteredExpenses.forEach((e) => {
    const cat = e.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
  });

  const budgetData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = [
    "#8B5CF6",
    "#EC4899",
    "#10B981",
    "#F59E0B",
    "#3B82F6",
    "#EF4444",
  ];

  const getMoneyFlowData = () => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth - i, 1);
      const monthShort = date.toLocaleString("default", { month: "short" });

      const monthIncome = income
        .filter((t) => {
          const d = t.date.toDate ? t.date.toDate() : t.date;
          return (
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        })
        .reduce((s, t) => s + t.amount, 0);

      const monthExpenses = expenses
        .filter((t) => {
          const d = t.date.toDate ? t.date.toDate() : t.date;
          return (
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        })
        .reduce((s, t) => s + t.amount, 0);

      data.push({
        month: monthShort,
        Income: monthIncome,
        Expense: monthExpenses,
      });
    }
    return data;
  };

  const moneyFlowData = getMoneyFlowData();

  const getMonthlyExpensesData = () => {
    const data = [];
    let maxExpense = 0;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth - i, 1);
      const monthShort = date.toLocaleString("default", { month: "short" });

      const monthExpenseTotal = expenses
        .filter((t) => {
          const d = t.date.toDate ? t.date.toDate() : t.date;
          return (
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        })
        .reduce((s, t) => s + t.amount, 0);

      if (monthExpenseTotal > maxExpense) maxExpense = monthExpenseTotal;

      data.push({ month: monthShort, expenses: monthExpenseTotal });
    }

    return data
      .map((item, index, arr) => {
        if (index === arr.length - 1) return { ...item, diff: null };
        const prev = arr[index + 1].expenses;
        const diff = item.expenses - prev;
        return {
          ...item,
          diff,
          diffText:
            diff > 0
              ? `+₹${Math.abs(diff).toLocaleString("en-IN")} more`
              : diff < 0
              ? `₹${Math.abs(diff).toLocaleString("en-IN")} less`
              : "Same",
          isHighest: item.expenses === maxExpense,
        };
      })
      .reverse();
  };

  const monthlyExpensesData = getMonthlyExpensesData();

  const allTransactions = [
    ...filteredIncome.map((t) => ({
      ...t,
      type: "income",
      description: "Income Added",
      method: t.method || "—",
    })),
    ...filteredExpenses.map((t) => ({
      ...t,
      type: "expense",
      description: t.title || "Expense",
      method: t.method || "—",
    })),
  ];

  allTransactions.sort((a, b) => {
    const dateA = a.date.toDate ? a.date.toDate() : a.date;
    const dateB = b.date.toDate ? b.date.toDate() : b.date;
    return dateB - dateA;
  });

  const filteredTransactions = allTransactions.filter((txn) => {
    const date = txn.date.toDate ? txn.date.toDate() : txn.date;
    const txnDateStr = date.toISOString().split("T")[0];

    if (filterMethod !== "all") {
      const txnMethod = (txn.method || "").toLowerCase().trim();
      if (filterMethod === "card" && !txnMethod.includes("card")) return false;
      if (filterMethod === "online" && !txnMethod.includes("online"))
        return false;
      if (filterMethod === "cash" && txnMethod !== "cash") return false;
    }

    if (filterMinAmount && txn.amount <= 200) return false;
    if (filterDateFrom && txnDateStr < filterDateFrom) return false;
    if (filterDateTo && txnDateStr > filterDateTo) return false;

    return true;
  });

  const recentTxns = filteredTransactions.slice(0, 5);
  const displayedTxns = showAllTransactions ? filteredTransactions : recentTxns;

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
    "default",
    { month: "long" }
  );

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-medium text-gray-600">Loading...</div>
      </div>
    );
  }

  // Display name logic
  let displayName = "User";
  if (user?.displayName) displayName = user.displayName.trim();
  else if (user?.email) {
    const namePart = user.email.split("@")[0];
    displayName =
      namePart
        .split(/[\.\_\-\d]/)
        .filter((p) => p.length > 0)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ") || "User";
  }

  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen  bg-gray-50 ">
      {/* Main Dashboard Content */}
      <div className="flex-1 w-[90vw] ">
        <div className="p-4 md:p-6 lg:p-8   ">
          {/* Header & Profile */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Hello {displayName}!
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your finances easily.
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
              >
                <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg">
                  {avatarInitial}
                </div>
                <span className="text-gray-700 font-medium hidden md:block">
                  {displayName}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showProfileDropdown && (
                <>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7"
                        />
                      </svg>
                      Log out
                    </button>
                  </div>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Month Selector */}
          <div className="mb-6">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}{" "}
                  {selectedYear}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Balance",
                value: totalBalance,
                color: totalBalance >= 0 ? "text-green-600" : "text-red-600",
              },
              { label: "Income", value: totalIncome, color: "text-green-600" },
              { label: "Expense", value: totalExpenses, color: "text-red-600" },
              {
                label: "Savings",
                value: totalSavings,
                color: "text-purple-600",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <p className="text-gray-600 text-sm">{card.label}</p>
                <p className={`text-2xl font-bold mt-2 ${card.color}`}>
                  ₹{card.value.toLocaleString("en-IN")}
                </p>
                <p className="text-gray-500 text-xs mt-2">{monthName}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Money Flow */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Money Flow (Last 12 Months)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moneyFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                  <Bar dataKey="Income" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Expense" fill="#EF4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Expense Categories
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={budgetData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    label={({ name }) => name}
                    labelStyle={{ fontSize: "12px", fontWeight: "500" }}
                  >
                    {budgetData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <p className="text-gray-600 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Expenses Trend */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Monthly Expenses Trend
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyExpensesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
                        <p className="font-semibold">{data.month}</p>
                        <p className="text-lg font-bold text-red-600">
                          ₹{data.expenses.toLocaleString("en-IN")}
                        </p>
                        {data.diffText && (
                          <p className="text-xs text-gray-600 mt-1">
                            {data.diffText} than prev
                          </p>
                        )}
                        {data.isHighest && (
                          <p className="text-xs font-medium text-orange-600 mt-1">
                            Highest this year
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="expenses" radius={[8, 8, 0, 0]}>
                  {monthlyExpensesData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isHighest ? "#DC2626" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 text-center mt-4">
              Last 12 months • Dark red = Highest spending month
            </p>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-lg font-bold text-gray-800">
                Recent Transactions
              </h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Methods</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="cash">Cash</option>
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.checked)}
                    className="rounded"
                  />
                  <span>Above ₹200</span>
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {showAllTransactions ? "Show Less" : "See All →"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500 border-b sticky top-0 bg-white">
                  <tr>
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Amount</th>
                    <th className="text-left py-3">Description</th>
                    <th className="text-left py-3">Method</th>
                    <th className="text-left py-3">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTxns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    displayedTxns.map((txn, i) => {
                      const date = txn.date.toDate
                        ? txn.date.toDate()
                        : txn.date;
                      return (
                        <tr key={i} className="border-b">
                          <td className="py-4">
                            {date.toLocaleDateString("en-IN")}
                          </td>
                          <td
                            className={`py-4 font-semibold ${
                              txn.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {txn.type === "income" ? "+" : "-"}₹
                            {txn.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-4">{txn.description}</td>
                          <td className="py-4 text-gray-600">{txn.method}</td>
                          <td className="py-4 text-gray-600">
                            {txn.category || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
