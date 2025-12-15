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
import { usePathname } from "next/navigation"; // ← ADD THIS IMPORT

const CATEGORIES = ["Food", "Rent", "Travel", "Shopping", "Bills", "Other"];
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28EFF",
  "#FF6B6B",
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // ← ADD THIS

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // ← CHANGE: Add pathname to dependencies so it re-fetches when navigating back
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
  }, [user, pathname]); // ← This is the key change!

  // ... rest of your code remains exactly the same
  const filteredExpenses = expenses.filter((e) => {
    const date = e.date;
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const filteredIncome = income.filter((i) => {
    const date = i.date;
    return (
      i.date.getMonth() === selectedMonth &&
      i.date.getFullYear() === selectedYear
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

  if (loading || !user) return <p className="text-center mt-10">Loading...</p>;

  return (
    // ... your existing JSX (no changes needed)
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Month Selector */}
      <div className="mb-8">
        <label className="block text-lg font-medium mb-2">Select Month</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="p-3 border rounded-lg text-lg"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <SummaryCard title="Total Income" amount={totalIncome} color="green" />
        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          color="red"
        />
        <SummaryCard title="Balance" amount={balance} color="blue" />
      </div>

      {/* Pie Chart */}
      {categoryData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Expenses by Category</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ amount }) => `₹${amount.toLocaleString()}`}
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
