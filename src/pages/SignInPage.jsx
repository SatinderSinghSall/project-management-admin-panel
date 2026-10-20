import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Fingerprint,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

const securityFeatures = [
  "Restricted to authorized administrators",
  "Protected by secure authentication",
  "Access governed by server-side permissions",
];

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50/80 p-6">
        <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-8 py-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          {/* Security icon */}
          <div className="flex size-14 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-700">
            <ShieldCheck size={26} strokeWidth={1.8} />
          </div>

          {/* Heading */}
          <h1 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
            Admin Portal
          </h1>

          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Preparing your secure workspace
          </p>

          {/* Loading indicator */}
          <div className="mt-7 flex flex-col items-center gap-4">
            <div
              className="size-6 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-violet-600"
              role="status"
              aria-label="Loading"
            />

            <div
              className="h-1 w-44 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Initializing admin portal"
              aria-valuetext="Loading"
            >
              <div className="h-full w-2/5 animate-loading-bar rounded-full bg-violet-600" />
            </div>
          </div>

          {/* Status */}
          <div className="mt-5 flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5">
            <p className="text-[11px] font-medium tracking-wide text-slate-500">
              Initializing secure access
            </p>
          </div>

          <p className="mt-6 text-[11px] text-slate-400">
            Please wait while we prepare your session.
          </p>
        </div>
      </main>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#f6f7fb] text-slate-900">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[480px] rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute -bottom-52 -right-36 size-[560px] rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.07]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 py-4 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 sm:size-11">
              <span className="text-lg font-extrabold">P</span>
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold tracking-tight text-slate-900 sm:text-sm">
                Project Management System
              </p>
              <p className="mt-1 text-[9px] font-semibold tracking-[0.13em] text-slate-500 sm:text-[10px] sm:tracking-[0.16em]">
                ADMINISTRATION PORTAL
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 sm:flex">
            <span className="text-[10px] font-medium text-slate-600">
              Secure access gateway
            </span>
          </div>
        </header>

        {/* Main content */}
        <div className="grid flex-1 grid-cols-1 items-center gap-9 py-8 sm:gap-11 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:gap-12 lg:py-12 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.9fr)] xl:gap-16 xl:py-14 2xl:gap-24">
          {/* Left: Portal information */}
          <section className="mx-auto w-full max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 sm:mb-7">
              <ShieldCheck size={14} className="text-violet-600" />
              <span className="text-[9px] font-bold tracking-[0.1em] text-violet-700 sm:text-[10px] sm:tracking-[0.12em]">
                PRIVATE ADMINISTRATIVE ACCESS
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl xl:text-6xl 2xl:text-7xl">
              Your platform.
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Under control.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8">
              Welcome to the administration portal for your Project Management
              System. Manage users, workspaces, projects, tasks, and platform
              records through one centralized interface.
            </p>

            <div className="mt-7 space-y-4 sm:mt-9">
              {securityFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <CheckCircle2 size={15} />
                  </span>

                  <span className="text-xs font-medium text-slate-700 sm:text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Security notice */}
            <div className="mt-8 flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 sm:mt-10 sm:gap-4 sm:p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 sm:size-10">
                <ShieldAlert size={20} />
              </div>

              <div>
                <h2 className="text-xs font-bold text-amber-950">
                  Authorized personnel only
                </h2>

                <p className="mt-2 text-[11px] leading-5 text-amber-900/80 sm:text-xs sm:leading-6">
                  This portal is restricted to approved administrators.
                  Authentication and access attempts may be logged and reviewed
                  for security purposes. Unauthorized access is prohibited.
                </p>
              </div>
            </div>
          </section>

          {/* Right: Wider sign-in card */}
          <section className="mx-auto w-full min-w-0 max-w-[560px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-300/25 sm:rounded-3xl">
              <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-9 xl:px-10">
                {/* Card heading */}
                <div className="mb-6 flex items-center justify-between gap-3 sm:mb-7">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100 sm:size-12 sm:rounded-2xl">
                    <LockKeyhole size={23} />
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                    <Fingerprint size={13} />
                    Verified sign-in
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Admin sign in
                </h2>

                <p className="mt-2 max-w-md text-xs leading-6 text-slate-500 sm:text-sm">
                  Authenticate with your registered account to continue. Only
                  approved administrator accounts can access protected
                  resources.
                </p>

                {/* Clerk sign-in form */}
                <div className="mt-7 w-full min-w-0 sm:mt-8">
                  <SignIn
                    routing="hash"
                    appearance={{
                      layout: {
                        socialButtonsPlacement: "top",
                        socialButtonsVariant: "blockButton",
                      },
                      variables: {
                        colorPrimary: "#6d5ce8",
                        colorText: "#1e293b",
                        colorTextSecondary: "#64748b",
                        colorInputBackground: "#ffffff",
                        colorInputText: "#1e293b",
                        borderRadius: "0.75rem",
                        fontFamily:
                          "Inter, ui-sans-serif, system-ui, sans-serif",
                      },
                      elements: {
                        rootBox: "w-full max-w-none",
                        cardBox: "w-full max-w-none shadow-none",
                        card: "w-full max-w-none border-0 bg-transparent p-0 shadow-none",
                        headerTitle: "text-lg font-bold tracking-tight",
                        headerSubtitle: "text-xs leading-5",
                        socialButtons: "w-full",
                        socialButtonsBlockButton:
                          "min-h-12 w-full rounded-xl border-slate-200 text-sm font-semibold hover:bg-slate-50",
                        form: "w-full",
                        formFieldLabel:
                          "mb-1.5 text-xs font-semibold text-slate-700",
                        formFieldInput:
                          "min-h-12 w-full rounded-xl border-slate-200 text-sm shadow-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100",
                        formButtonPrimary:
                          "min-h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold shadow-md shadow-violet-600/20 hover:bg-violet-700",
                        footerActionText: "text-xs text-slate-500",
                        footerActionLink:
                          "text-xs font-semibold text-violet-700 hover:text-violet-800",
                        dividerLine: "bg-slate-200",
                        dividerText: "text-xs text-slate-400",
                        identityPreview:
                          "rounded-xl border border-slate-200 bg-slate-50",
                        formFieldErrorText: "text-xs text-rose-600",
                        alert: "rounded-xl text-xs",
                      },
                    }}
                  />
                </div>

                {/* Security explanation */}
                <div className="mt-6 flex items-start gap-3 border-t border-slate-100 pt-5 sm:mt-7 sm:pt-6">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <p className="text-[10px] leading-5 text-slate-500 sm:text-[11px] sm:leading-6">
                    Signing in authenticates your identity but does not
                    automatically grant administrator permissions. Access is
                    checked by the backend.
                  </p>
                </div>
              </div>

              {/* Card footer */}
              <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 text-center sm:px-8 lg:px-10">
                <p className="text-[10px] leading-5 text-slate-500">
                  Project Management System
                  <span className="mx-2 text-slate-300">•</span>
                  Restricted portal
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-slate-400 sm:mt-5">
              <LockKeyhole size={12} className="shrink-0" />
              <span>Secure authentication provided by Clerk</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex flex-col gap-2 border-t border-slate-200/80 py-5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Project Management System</span>
          <span>Administrative access is subject to authorization.</span>
        </footer>
      </div>
    </main>
  );
}
