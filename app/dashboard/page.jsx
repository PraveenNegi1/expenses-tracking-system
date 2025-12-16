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
import Sidebar from "@/components/Navbar";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [showAllTransactions, setShowAllTransactions] = useState(false);

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

  const allTransactions = [
    ...filteredIncome.map((t) => ({
      ...t,
      type: "income",
      description: "Income Added",
    })),
    ...filteredExpenses.map((t) => ({
      ...t,
      type: "expense",
      description: t.title || "Expense",
    })),
  ];

  allTransactions.sort((a, b) => {
    const dateA = a.date.toDate ? a.date.toDate() : a.date;
    const dateB = b.date.toDate ? b.date.toDate() : b.date;
    return dateB - dateA;
  });

  const recentTxns = allTransactions.slice(0, 5);
  const displayedTxns = showAllTransactions ? allTransactions : recentTxns;

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

  const userName = user?.displayName || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-gray-50 justify-evenly  lg:ml-44 flex">
      <Sidebar />

      <div className="flex-1  p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Hello {userName}!
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage your finances easily.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
              {userName[0].toUpperCase()}
            </div>
            <span className="text-gray-700 text-sm font-medium hidden md:block">
              {userName}
            </span>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mb-6">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
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
            { label: "Balance", value: totalBalance },
            { label: "Income", value: totalIncome },
            { label: "Expense", value: totalExpenses },
            { label: "Savings", value: totalSavings },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <p className="text-gray-600 text-xs mb-1">{card.label}</p>
              <p className="text-xl font-bold text-gray-800">
                ₹{card.value.toLocaleString("en-IN")}
              </p>
              <p className="text-gray-500 text-xs mt-1">{monthName}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Money Flow</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={moneyFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="Income" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expense" fill="#E0E7FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Budget Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={budgetData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  label={({ name }) => name}
                  labelStyle={{ fontSize: "12px" }}
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
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-xs">Total Expenses</p>
              <p className="text-xl font-bold text-gray-800">
                ₹{totalExpenses.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Transactions - With Scroll After 10 Items */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              Recent Transactions
            </h2>
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="text-purple-600 hover:underline text-xs font-medium"
            >
              {showAllTransactions ? "Show Less" : "See All →"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-96 overflow-y-auto">
              {" "}
              {/* Scroll after ~10 rows */}
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500 text-xs border-b border-gray-200 sticky top-0 bg-white">
                  <tr>
                    <th className="pb-2">DATE</th>
                    <th className="pb-2">AMOUNT</th>
                    <th className="pb-2">DESC</th>
                    <th className="pb-2">METHOD</th>
                    <th className="pb-2">CAT</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {displayedTxns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-gray-500 text-xs"
                      >
                        No transactions this month
                      </td>
                    </tr>
                  ) : (
                    displayedTxns.map((txn, i) => {
                      const date = txn.date.toDate
                        ? txn.date.toDate()
                        : txn.date;
                      return (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-3 text-xs">
                            {date.toLocaleDateString("en-IN").slice(0, -5)}
                          </td>
                          <td
                            className={`py-3 font-medium text-xs ${
                              txn.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {txn.type === "income" ? "+" : "-"}₹
                            {txn.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 text-xs">
                            {txn.description.slice(0, 18)}
                            {txn.description.length > 18 ? "..." : ""}
                          </td>
                          <td className="py-3 text-xs">
                            {(txn.method || "Card").slice(0, 10)}
                          </td>
                          <td className="py-3 text-xs">
                            {(txn.category || "—").slice(0, 12)}
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
