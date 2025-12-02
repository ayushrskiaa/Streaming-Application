import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [role, setRole] = useState("editor");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({ name, email, password, tenantId, role });
      navigate("/dashboard");
    } catch {
      // error is already handled in context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-900/80">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Start uploading and reviewing videos
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">
              Tenant / Organisation ID
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
              placeholder="e.g., company1"
            />
            <p className="text-xs text-slate-500 mt-1">Users with the same tenant ID can collaborate</p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-200">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            >
              <option value="viewer">Viewer - Read-only access</option>
              <option value="editor">Editor - Upload & manage videos</option>
              <option value="admin">Admin - Full system access</option>
            </select>
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-400 hover:to-emerald-400 disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}


