// lib/firestore.js

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const getCollection = (userId, type) => collection(db, "users", userId, type);

// Add Income
export const addIncome = async (userId, amount) =>
  addDoc(getCollection(userId, "income"), {
    amount: Number(amount),
    date: Timestamp.now(),
  });

// Add Expense
export const addExpense = async (userId, { title, category, amount }) =>
  addDoc(getCollection(userId, "expenses"), {
    title: title.trim(),
    category,
    amount: Number(amount),
    date: Timestamp.now(),
  });

// Get All Transactions (Income or Expenses)
export const getTransactions = async (userId, type) => {
  const q = query(getCollection(userId, type), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // Safely convert Firestore Timestamp to JS Date
    date: doc.data().date ? doc.data().date.toDate() : new Date(),
  }));
};

// Update an Expense (or Income)
export const updateExpense = async (userId, expenseId, data) => {
  const expenseRef = doc(db, "users", userId, "expenses", expenseId);
  await updateDoc(expenseRef, {
    ...data,
    amount: Number(data.amount),
    updatedAt: Timestamp.now(),
  });
};

// You can also make a generic update if you plan to edit income later
export const updateTransaction = async (userId, type, id, data) => {
  const ref = doc(db, "users", userId, type, id);
  await updateDoc(ref, {
    ...data,
    amount: data.amount ? Number(data.amount) : undefined,
    updatedAt: Timestamp.now(),
  });
};

// Delete an Expense
export const deleteExpense = async (userId, expenseId) => {
  const expenseRef = doc(db, "users", userId, "expenses", expenseId);
  await deleteDoc(expenseRef);
};

// Generic delete (useful if you add delete for income later)
export const deleteTransaction = async (userId, type, id) => {
  const ref = doc(db, "users", userId, type, id);
  await deleteDoc(ref);
};
