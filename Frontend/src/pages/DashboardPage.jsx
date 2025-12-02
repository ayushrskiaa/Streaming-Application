import { useAuth } from "../auth/AuthContext.jsx";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Video Processing Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Welcome back,{" "}
            <span className="font-medium text-slate-100">{user?.name}</span>{" "}
            <span className="text-slate-400">({user?.role})</span> – tenant{" "}
            <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-sky-300">
              {user?.tenantId}
            </code>
          </p>
        </div>
      </header>
      <main className="px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl shadow-slate-950/70">
            <h2 className="text-lg font-semibold text-white">Next steps</h2>
            <p className="mt-2 text-sm text-slate-300">
              Upload videos, monitor sensitivity processing, and stream content once the video
              pipeline is implemented.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


