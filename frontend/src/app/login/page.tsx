"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { AuthService } from "@/lib/authService";
import { setAuth } from "@/store/authSlice";
import { RootState } from "@/store/store";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card bg-base-100 w-full max-w-md border border-base-300 p-8 shadow-lg">
          <h1 className="mb-3 text-2xl font-bold">Already logged in</h1>
          <p className="mb-6 opacity-80">
            You already have an active staff session.
          </p>

          <div className="flex flex-col gap-3">
            <button
              className="btn btn-primary"
              onClick={() => router.push("/manager")}
            >
              Go to manager page
            </button>
            <button
              className="btn btn-outline"
              onClick={() => router.push("/")}
            >
              Go to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login({ email, password });

      dispatch(
        setAuth({
          user: {
            email: response.email,
            name: response.name,
            role: response.role,
          },
          accessToken: response.accessToken,
        }),
      );

      toast.success("Login successful");
      router.push("/manager");
    } catch {
      setError("Invalid email or password");
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card bg-base-100 w-full max-w-md border border-base-300 p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold">Staff Login</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            className="input input-bordered w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? "btn-disabled" : ""}`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}
      </div>
    </div>
  );
}
