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
  Legend,
  LineChart,
  Line,
} from "recharts";

const PIE_COLORS = {
  Income: "#3B82F6", // Blue
  Expense: "#EF4444", // Red
  Savings: "#10B981", // Emerald Green
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());

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

  const filteredExpenses = expenses.filter((e) => {
    const date = e.date.toDate ? e.date.toDate() : e.date;
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const filteredIncome = income.filter((i) => {
    const date = i.date.toDate ? i.date.toDate() : i.date;
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSavings = totalIncome - totalExpenses;

  const categoryMap = {};
  filteredExpenses.forEach((e) => {
    const cat = e.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
  });

  const topCategories = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 9);

  const pieData = [
    { name: "Income", value: totalIncome, percentage: 100 },
    {
      name: "Expense",
      value: totalExpenses,
      percentage: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
    },
    {
      name: "Savings",
      value: totalSavings > 0 ? totalSavings : 0,
      percentage: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0,
    },
  ].filter((item) => item.value > 0);

  const dailyExpenseMap = {};
  filteredExpenses.forEach((expense) => {
    const date = expense.date.toDate ? expense.date.toDate() : expense.date;
    const day = date.getDate();
    const key = `Day ${day}`;
    dailyExpenseMap[key] = (dailyExpenseMap[key] || 0) + expense.amount;
  });

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyExpenses = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const key = `Day ${dayNum}`;
    return {
      day: `${new Date(selectedYear, selectedMonth, dayNum).toLocaleString(
        "default",
        { month: "short" }
      )} ${dayNum}`,
      amount: dailyExpenseMap[key] || 0,
    };
  });

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
    "default",
    { month: "long" }
  );

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-2xl font-medium text-gray-400">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-700 w-[78vw] text-gray-100 p-8 md:ml-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-white bg-clip-text ">
          Financial Dashboard
        </h1>
        <p className="text-white mt-2 text-lg">
          Overview for {monthName} {selectedYear}
        </p>
      </div>

      {/* Summary Cards - Industrial Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Total Income */}
        <div className="relative overflow-hidden bg-blue-500 rounded-2xl p-8 shadow-2xl border border-blue-500/30">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <p className="text-blue-200 uppercase text-sm tracking-wider font-semibold">
              Total Income
            </p>
            <p className="text-4xl font-extrabold mt-4">
              ₹{totalIncome.toLocaleString("en-IN")}
            </p>
            <div className="mt-4 flex items-center text-blue-200">
              <span className="text-2xl">📈</span>
              <span className="ml-3 text-sm">Monthly Earnings</span>
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="relative overflow-hidden bg-red-600  rounded-2xl p-8 shadow-2xl border border-red-500/30">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <p className="text-red-200 uppercase text-sm tracking-wider font-semibold">
              Total Expense
            </p>
            <p className="text-4xl font-extrabold mt-4">
              ₹{totalExpenses.toLocaleString("en-IN")}
            </p>
            <div className="mt-4 flex items-center text-red-200">
              <span className="text-2xl">📉</span>
              <span className="ml-3 text-sm">Monthly Spending</span>
            </div>
          </div>
        </div>

        {/* Total Savings */}
        <div className="relative overflow-hidden bg-green-600 rounded-2xl p-8 shadow-2xl border border-emerald-500/30">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <p className="text-emerald-200 uppercase text-sm tracking-wider font-semibold">
              {totalSavings >= 0 ? "Net Savings" : "Deficit"}
            </p>
            <p
              className={`text-4xl font-extrabold mt-4 ${
                totalSavings < 0 ? "text-red-300" : ""
              }`}
            >
              ₹{Math.abs(totalSavings).toLocaleString("en-IN")}
            </p>
            <div className="mt-4 flex items-center text-emerald-200">
              <span className="text-2xl">
                {totalSavings >= 0 ? "💰" : "⚠️"}
              </span>
              <span className="ml-3 text-sm">
                {totalSavings >= 0 ? "Saved this month" : "Overspent"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex justify-end mb-10">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-6 py-4 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}{" "}
              {selectedYear}
            </option>
          ))}
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        {/* Top Expense Sources - Bar Chart */}
        <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-4">
            Top Expense Categories
          </h2>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={topCategories}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={90}
                tick={{ fill: "#9CA3AF", fontSize: 13 }}
              />
              <YAxis
                tick={{ fill: "#9CA3AF" }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  borderRadius: "12px",
                }}
                labelStyle={{ color: "#60A5FA" }}
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />
              <Bar dataKey="amount" fill="#10B981" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Report Overview - Pie Chart */}
        <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-4">
            Financial Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={420}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={160}
                paddingAngle={4}
                label={({ name, percentage }) =>
                  `${name}: ${percentage.toFixed(0)}%`
                }
                labelStyle={{ fill: "#E5E7EB", fontWeight: "bold" }}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  borderRadius: "12px",
                }}
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-gray-300 font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Activity - Line Chart (Full Width) */}
      <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-4">
          Daily Expense Trend
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailyExpenses}>
            <CartesianGrid strokeDasharray="4 4" stroke="#374151" />
            <XAxis
              dataKey="day"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tick={{ fill: "#9CA3AF" }}
              tickFormatter={(value) => `₹${value.toLocaleString("en-IN")}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: "12px",
              }}
              labelStyle={{ color: "#60A5FA" }}
              formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#10B981"
              strokeWidth={4}
              dot={{ fill: "#10B981", r: 6 }}
              activeDot={{ r: 9, stroke: "#34D399", strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
