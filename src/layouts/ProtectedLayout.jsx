import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Fingerprint,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import useAdminAuthorization from "../services/useAdminAuthorization";

const HOME_URL = "https://project-management-system-sall.vercel.app";

function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1018] px-5 text-white">
      <section className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
          <ShieldCheck size={27} className="text-slate-200" />
        </div>

        <h1 className="mt-5 text-lg font-semibold tracking-tight">
          Admin Control Centre
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Verifying your identity and access permissions...
        </p>

        <div
          role="status"
          aria-label="Verifying access"
          className="mt-7 size-6 animate-spin rounded-full border-2 border-white/10 border-t-slate-300"
        />

        <p className="mt-5 text-xs text-slate-600">
          Please wait while we verify your session.
        </p>
      </section>
    </main>
  );
}

function RestrictedAccess() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1018] px-4 py-8 text-white sm:px-8 lg:px-12">
      {/* Subtle background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <section className="relative w-full max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <ShieldCheck size={23} className="text-slate-200" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-white">
                Project Management
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Administration / Access control
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-md border border-red-400/20 bg-red-400/[0.06] px-3 py-2">
            <span className="size-1.5 rounded-full bg-red-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
              Restricted area
            </span>
          </div>
        </header>

        {/* Main content */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111925] shadow-2xl shadow-black/20">
          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            {/* Primary message */}
            <div className="p-6 sm:p-10 lg:p-12">
              <div className="flex size-12 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/[0.07] text-red-400">
                <ShieldAlert size={25} strokeWidth={1.8} />
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
                Error 403 · Forbidden
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
                Access denied
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                This administrative control centre is reserved for authorized
                personnel. Your account does not currently have the permissions
                required to continue.
              </p>

              {/* Home CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={HOME_URL}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#111925]"
                >
                  <ArrowLeft size={16} />
                  Return to Home
                  <ArrowUpRight size={15} />
                </a>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Think this is an error? Contact your system administrator to
                request access.
              </p>
            </div>

            {/* Security information */}
            <aside className="border-t border-white/10 bg-black/[0.12] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Security notice
              </p>

              <div className="mt-6 flex items-start gap-3">
                <LockKeyhole
                  size={19}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Authorized access only
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Administrative resources are protected by server-side
                    permission checks. Signing in alone does not grant
                    administrator privileges.
                  </p>
                </div>
              </div>

              <div className="my-7 border-t border-white/[0.08]" />

              <div className="flex items-start gap-3">
                <Fingerprint
                  size={19}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Access monitoring
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Unauthorized access attempts may be recorded and reviewed
                    where security logging is enabled.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <ShieldCheck size={15} className="text-slate-400" />
                  Protected administrative resources
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Access is granted only to accounts approved by the system
                  administrator.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>Project Management System</span>
          <span>Administrator access control</span>
        </footer>
      </section>
    </main>
  );
}

function VerificationError() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1018] px-5 py-10 text-white">
      <section className="w-full max-w-md rounded-xl border border-amber-400/20 bg-[#111925] p-7 sm:p-9">
        <div className="flex size-12 items-center justify-center rounded-lg border border-amber-400/15 bg-amber-400/[0.07] text-amber-300">
          <AlertTriangle size={24} />
        </div>

        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Verification unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          We couldn't verify your administrator permissions. Access remains
          blocked until the authorization service responds successfully.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 sm:w-auto"
        >
          Retry verification
        </button>

        <a
          href={HOME_URL}
          className="mt-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          Return to Home
        </a>
      </section>
    </main>
  );
}

export default function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { status } = useAdminAuthorization();

  if (!isLoaded || status === "checking") {
    return <AuthLoading />;
  }

  if (!isSignedIn || status === "signed-out") {
    return <Navigate to="/admin/sign-in" replace />;
  }

  if (status === "unauthorized") {
    return <RestrictedAccess />;
  }

  if (status === "error") {
    return <VerificationError />;
  }

  return <AdminLayout />;
}
