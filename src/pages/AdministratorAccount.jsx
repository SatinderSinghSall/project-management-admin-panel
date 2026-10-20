import { useClerk, useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Fingerprint,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
}

function InfoRow({ icon: Icon, label, value, last = false }) {
  return (
    <div
      className={`flex items-start gap-3 px-5 py-4 sm:px-6 ${last ? "" : "border-b border-slate-100"}`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}

export default function AdministratorAccount() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const fullName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Administrator";
  const email = user?.primaryEmailAddress?.emailAddress || "Not available";
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A";
  const primaryEmailVerified =
    user?.primaryEmailAddress?.verification?.status === "verified";

  return (
    <div className="min-w-0 space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Administration / Account
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Administrator account<span className="text-violet-600">.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review your administrator profile and account security information.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </header>

      {!isLoaded ? (
        <section
          aria-label="Loading administrator account"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex animate-pulse items-center gap-4">
            <div className="size-16 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-3 w-56 max-w-full rounded bg-slate-100" />
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-violet-600" />
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex min-w-0 items-center gap-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={`${fullName} profile`}
                    className="size-16 shrink-0 rounded-2xl object-cover ring-4 ring-violet-50"
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700 ring-4 ring-violet-50">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-bold tracking-tight text-slate-900">
                      {fullName}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle2 size={12} />
                      Signed in
                    </span>
                  </div>
                  <p className="mt-1 break-all text-sm text-slate-500">
                    {email}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Administrator profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openUserProfile()}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
              >
                Manage account <ChevronRight size={16} />
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <UserRound size={19} />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Profile information
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Details provided by your authentication profile
                    </p>
                  </div>
                </div>
              </div>
              <InfoRow
                icon={CircleUserRound}
                label="Full name"
                value={fullName}
              />
              <InfoRow icon={Mail} label="Primary email" value={email} />
              <InfoRow
                icon={ShieldCheck}
                label="Email verification"
                value={
                  primaryEmailVerified
                    ? "Verified"
                    : user?.primaryEmailAddress
                      ? "Not verified"
                      : "Not available"
                }
              />
              <InfoRow
                icon={CalendarDays}
                label="Account created"
                value={formatDate(user?.createdAt)}
                last
              />
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck size={19} />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Account security
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Current authentication status
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Authentication session
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your administrator session is currently active.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Fingerprint size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Authentication provider
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Sign-in and profile details are managed by Clerk.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Clock3 size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Session management
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Use Manage account to access the authentication provider's
                      available account settings.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs leading-5 text-slate-500">
                    Access to admin features should also be enforced by your
                    backend. This page displays profile and session information;
                    it does not grant administrator permissions.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
