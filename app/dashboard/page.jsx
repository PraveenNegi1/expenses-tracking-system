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

// Custom colors specifically for the Report Overview pie chart
const PIE_COLORS = {
  Income: "#3B82F6",    // Blue-500
  Expense: "#EF4444",   // Red-500
  Savings: "#10B981",   // Green-500
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

  // Top expense sources by category
  const categoryMap = {};
  filteredExpenses.forEach((e) => {
    const cat = e.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
  });

  const topCategories = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 9);

  // Pie chart data with assigned colors
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

  // === REAL DAILY EXPENSE DATA ===
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
      day: `${new Date(selectedYear, selectedMonth, dayNum).toLocaleString("default", { month: "short" })} ${dayNum}`,
      amount: dailyExpenseMap[key] || 0,
    };
  });

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-medium text-gray-600">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 ml-28 min-h-screen bg-gray-50 w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Income</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{totalIncome.toLocaleString("en-IN")}
              </p>
            </div>
          
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Expense</p>
              <p className="text-3xl font-bold">
                ₹{totalExpenses.toLocaleString("en-IN")}
              </p>
            </div>
           
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Savings</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{totalSavings.toLocaleString("en-IN")}
              </p>
            </div>
          
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex justify-end mb-8">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="bg-white rounded-xl shadow px-6 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}{" "}
              {selectedYear}
            </option>
          ))}
        </select>
      </div>

      {/* Top Expense Sources - Vertical Bars */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Top Expense Sources
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topCategories}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
              labelStyle={{ fontWeight: "bold" }}
            />
            <Bar dataKey="amount" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Section: Pie + Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Overview Pie Chart - Now with DISTINCT COLORS */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Report Overview
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={5}
                label={({ percentage }) => `${percentage.toFixed(0)}%`}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PIE_COLORS[entry.name]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Activity Line Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Expense Activity
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dailyExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(value) => `₹${value.toLocaleString("en-IN")}`}
              />
              <Tooltip
                formatter={(value) =>
                  `₹${Number(value).toLocaleString("en-IN")}`
                }
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}