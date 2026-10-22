import { useAuth } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import ProtectedLayout from "./layouts/ProtectedLayout";

import SignInPage from "./pages/SignInPage";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import WorkspacesPage from "./pages/Workspaces";
import ProjectsPage from "./pages/Projects";
import TasksPage from "./pages/Tasks";
import CommentsPage from "./pages/Comments";
import DatabaseExplorerPage from "./pages/DatabaseExplorer";
import AdministratorAccountPage from "./pages/AdministratorAccount";

function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        {/* Security icon */}
        <div className="flex size-14 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
          <ShieldCheck size={26} strokeWidth={1.8} />
        </div>

        {/* Heading */}
        <h1 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
          Admin Portal
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Verifying your access permissions
        </p>

        {/* Loader */}
        <div className="mt-7 flex flex-col items-center gap-4">
          <div
            className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600"
            role="status"
            aria-label="Checking session"
          />

          <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/5 animate-loading-bar rounded-full bg-violet-600" />
          </div>
        </div>

        {/* Session status */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-600">
            Checking your session...
          </span>
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-400">
          Please wait while we securely verify your session.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Dedicated admin sign-in page */}
      <Route path="/admin/sign-in" element={<SignInPage />} />

      {/* Protected admin portal */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="database" element={<DatabaseExplorerPage />} />
        <Route path="/account" element={<AdministratorAccountPage />} />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
