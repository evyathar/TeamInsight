"use client";

/*
  Lecturer Login Page
  ==================
  This page allows a lecturer to log into the system.

  Course alignment:
  - Next.js App Router
  - React Function Component
  - React Hooks (useState)
  - Tailwind CSS (required by course)
  - Fetch API for client-server communication

  Flow:
  UI (form) -> API (/api/lecturer/login) -> response -> navigation
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LecturerLoginPage() {
  /*
    Router is used for client-side navigation
    after successful login
  */
  const router = useRouter();

  /*
    State variables (React Hooks):
    - email, password: controlled inputs
    - error: error message from server
    - loading: indicates request in progress
  */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /*
    Form submit handler
    -------------------
    Sends POST request to backend login API
  */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lecturer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Successful login -> navigate to dashboard
      router.push("/lecturer/dashboard");
    } catch {
      setError("Server error");
      setLoading(false);
    }
  }

  /*
    UI rendering using Tailwind CSS
    -------------------------------
    Minimal, clean, and consistent design
    suitable for all lecturer pages
  */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg"
      >
        <h1 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Lecturer Login
        </h1>
        <p className="text-center text-gray-600 mb-6">Welcome back!</p>

        {/* Email input */}
        <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {/* Password input */}
        <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {/* Error message */}
        {error && (
          <div className="text-red-600 text-sm mb-3 text-center bg-red-50 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Link to registration */}
        <div className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/lecturer/register" className="text-purple-600 hover:underline font-medium">
            Create one here
          </Link>
        </div>
      </form>
    </div>
  );
}
