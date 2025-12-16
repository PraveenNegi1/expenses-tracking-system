import Nav from "@/components/Navbar";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Expense Tracker",
  description: "Track income and expenses with Firebase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <AuthProvider>
          {/* <Nav /> */}
          <main className="max-w-6xl mx-auto">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}