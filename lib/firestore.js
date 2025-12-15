import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const getCollection = (userId, type) => collection(db, "users", userId, type);

export const addIncome = async (userId, amount) =>
  addDoc(getCollection(userId, "income"), {
    amount: Number(amount),
    date: Timestamp.now(),
  });

export const addExpense = async (userId, { title, category, amount }) =>
  addDoc(getCollection(userId, "expenses"), {
    title,
    category,
    amount: Number(amount),
    date: Timestamp.now(),
  });

export const getTransactions = async (userId, type) => {
  const q = query(getCollection(userId, type), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
  }));
};