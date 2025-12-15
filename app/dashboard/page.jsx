"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/firestore";
import SummaryCard from "@/components/SummaryCard";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { usePathname } from "next/navigation";

const CATEGORIES = ["Food", "Rent", "Travel", "Shopping", "Bills", "Other"];
const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
  }, [user, pathname]);

  const filteredExpenses = expenses.filter((e) => {
    const date = e.date;
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const filteredIncome = income.filter((i) => {
    const date = i.date;
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const categoryData = CATEGORIES.map((cat) => ({
    category: cat,
    amount: filteredExpenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((item) => item.amount > 0);

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
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            Expense Dashboard
          </h1>
          <p className="text-lg text-gray-600">Track your finances with ease</p>
        </div>

        {/* Month Selector */}
        <div className="flex justify-center mb-10">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-lg font-medium px-5 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-300 bg-gray-50 cursor-pointer transition"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}{" "}
                  {selectedYear}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="transform hover:scale-105 transition duration-300">
            <SummaryCard
              title="Total Income"
              amount={totalIncome}
              color="green"
              icon="💰"
            />
          </div>
          <div className="transform hover:scale-105 transition duration-300">
            <SummaryCard
              title="Total Expenses"
              amount={totalExpenses}
              color="red"
              icon="🛒"
            />
          </div>
          <div className="transform hover:scale-105 transition duration-300">
            <SummaryCard
              title="Current Balance"
              amount={balance}
              color={balance >= 0 ? "blue" : "red"}
              icon={balance >= 0 ? "💎" : "⚠️"}
            />
          </div>
        </div>

        {/* Pie Chart Section */}
        {categoryData.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Expenses by Category
            </h2>
            <ResponsiveContainer width="100%" height={450}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  innerRadius={60}
                  paddingAngle={5}
                  label={({ amount }) => `₹${amount.toLocaleString()}`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${Number(value).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "#f8fafc",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-lg font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
            <p className="text-2xl text-gray-500 font-medium">
              No expenses recorded for this month yet.
            </p>
            <p className="mt-4 text-lg text-gray-400">
              Start adding expenses to see beautiful insights!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
