import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";

import {
  Activity,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  LayoutDashboard,
  LogOut,
  LoaderCircle,
  MessageSquare,
  PanelsTopLeft,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

const groups = [
  {
    title: "OVERVIEW",

    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }],
  },

  {
    title: "MANAGEMENT",

    items: [
      { label: "Users", to: "/users", icon: Users },

      { label: "Workspaces", to: "/workspaces", icon: Boxes },

      { label: "Projects", to: "/projects", icon: PanelsTopLeft },

      { label: "Tasks", to: "/tasks", icon: ClipboardList },

      { label: "Comments", to: "/comments", icon: MessageSquare },
    ],
  },

  {
    title: "SYSTEM",

    items: [{ label: "Data explorer", to: "/database", icon: Database }],
  },
];

export default function Sidebar({
  collapsed,

  onToggleCollapse,

  mobileOpen,

  onCloseMobile,
}) {
  const [expandedGroups, setExpandedGroups] = useState({
    OVERVIEW: true,

    MANAGEMENT: true,

    SYSTEM: true,
  });

  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  const [signingOut, setSigningOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const { user, isLoaded } = useUser();

  const { signOut } = useClerk();

  const navigate = useNavigate();

  const fullName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Administrator";

  const email = user?.primaryEmailAddress?.emailAddress || "";

  const initials =
    fullName

      .split(/\s+/)

      .filter(Boolean)

      .slice(0, 2)

      .map((part) => part[0])

      .join("")

      .toUpperCase() || "A";

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await signOut({ redirectUrl: "/admin/sign-in" });
    } catch (error) {
      console.error("Unable to sign out:", error);

      setSigningOut(false);
    }
  }

  return (
    <>
      {/* Mobile overlay */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 cursor-pointer bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}

      <aside
        aria-label="Admin sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-dvh min-h-0 flex-col",

          "overflow-hidden border-r border-slate-200 bg-white",

          "text-slate-600 shadow-sm",

          "transition-[width,transform] duration-200 ease-in-out",

          collapsed ? "w-[76px]" : "w-[270px]",

          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",

          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}

        <div
          className={`flex h-[76px] shrink-0 items-center border-b border-slate-200 ${
            collapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          <NavLink
            to="/"
            onClick={onCloseMobile}
            title={collapsed ? "Orbit Admin" : undefined}
            className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 via-violet-500 to-indigo-600 text-lg font-extrabold text-white shadow-md shadow-violet-200">
              O
            </span>

            {!collapsed && (
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                  Orbit Admin
                </span>

                <span className="text-[9px] font-semibold tracking-[0.2em] text-slate-400">
                  CONTROL CENTER
                </span>
              </span>
            )}
          </NavLink>

          {!collapsed && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
              className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Workspace card */}

        <div className="shrink-0 px-3 pt-4">
          <button
            type="button"
            onClick={() => setWorkspaceOpen((value) => !value)}
            aria-expanded={workspaceOpen}
            title={collapsed ? "Admin workspace" : undefined}
            className={`flex min-h-[58px] w-full cursor-pointer items-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 ring-1 ring-violet-200/70">
              <ShieldCheck size={19} />
            </span>

            {!collapsed && (
              <>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-xs font-semibold text-slate-800">
                    Admin workspace
                  </span>

                  <span className="truncate text-[10px] text-slate-500">
                    Platform management
                  </span>
                </span>

                <ChevronDown
                  size={15}
                  className={`shrink-0 text-slate-400 transition-transform ${
                    workspaceOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {workspaceOpen && !collapsed && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />

                <p className="text-xs font-semibold text-slate-800">
                  Restricted access
                </p>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Admin permissions are verified by the backend.
              </p>
            </div>
          )}
        </div>

        {/* Independently scrollable navigation */}

        <nav
          aria-label="Main navigation"
          className="min-h-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-6 [scrollbar-color:#d8dce7_transparent] [scrollbar-width:thin]"
        >
          {groups.map((group) => (
            <section key={group.title}>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((current) => ({
                      ...current,

                      [group.title]: !current[group.title],
                    }))
                  }
                  aria-expanded={expandedGroups[group.title]}
                  className="mb-2 flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-1 text-[9px] font-bold tracking-[0.17em] text-slate-400 transition hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  {group.title}

                  <ChevronDown
                    size={13}
                    className={`transition-transform ${
                      expandedGroups[group.title] ? "" : "-rotate-90"
                    }`}
                  />
                </button>
              )}

              {(collapsed || expandedGroups[group.title]) && (
                <div className="space-y-1">
                  {group.items.map(({ label, to, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      title={collapsed ? label : undefined}
                      onClick={() => {
                        onCloseMobile();

                        setProfileOpen(false);
                      }}
                      className={({ isActive }) =>
                        [
                          "group relative flex min-h-11 cursor-pointer items-center rounded-xl",

                          "text-xs font-medium transition-colors duration-150",

                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",

                          collapsed ? "justify-center px-2" : "gap-3 px-3",

                          isActive
                            ? "bg-violet-100 text-violet-800 shadow-sm shadow-violet-100"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        ].join(" ")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-violet-500" />
                          )}

                          <Icon
                            size={19}
                            strokeWidth={1.8}
                            className={`shrink-0 transition-colors ${
                              isActive
                                ? "text-violet-600"
                                : "text-slate-400 group-hover:text-slate-700"
                            }`}
                          />

                          {!collapsed && (
                            <span className="min-w-0 flex-1 truncate">
                              {label}
                            </span>
                          )}

                          {!collapsed && isActive && (
                            <span className="size-1.5 shrink-0 rounded-full bg-violet-500" />
                          )}

                          {collapsed && (
                            <span className="pointer-events-none absolute left-[calc(100%+10px)] z-[60] whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 opacity-0 shadow-xl transition group-hover:opacity-100">
                              {label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </section>
          ))}
        </nav>

        {/* Fixed bottom section */}

        <div className="relative z-10 mt-auto shrink-0 border-t border-slate-200 bg-white p-3">
          {!collapsed && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Activity size={16} />
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Protected
                </span>
              </div>

              <p className="mt-3 text-[11px] font-semibold text-slate-800">
                Secure administration
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Server-enforced access control
              </p>
            </div>
          )}

          {/* Administrator profile */}

          <div className="relative">
            {profileOpen && (
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-10 cursor-pointer"
              />
            )}

            {profileOpen && (
              <div
                className={`absolute bottom-full z-20 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ${
                  collapsed ? "left-[calc(100%+8px)] w-64" : "inset-x-0"
                }`}
              >
                <div className="border-b border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-full object-cover ring-2 ring-violet-100"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {initials}
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {fullName}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                    <ShieldCheck size={12} />
                    Signed in
                  </div>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile();
                      navigate("/account");
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <UserRound size={16} className="text-slate-400" />
                    <span>Administrator account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogoutConfirmOpen(true)}
                    disabled={signingOut}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut
                      size={16}
                      className={signingOut ? "animate-pulse" : ""}
                    />

                    <span>{signingOut ? "Signing out..." : "Sign out"}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-label="Open administrator profile menu"
              title={collapsed ? fullName : undefined}
              className={`flex min-h-[54px] w-full cursor-pointer items-center rounded-xl border border-slate-200 bg-white p-2 transition hover:border-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${
                collapsed ? "justify-center" : "gap-3"
              }`}
            >
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="size-9 shrink-0 rounded-full object-cover ring-2 ring-violet-100"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white ring-2 ring-violet-100">
                  {isLoaded ? initials : "A"}
                </span>
              )}

              {!collapsed && (
                <>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                    <span className="truncate text-[11px] font-semibold text-slate-800">
                      {isLoaded ? fullName : "Loading profile..."}
                    </span>

                    <span className="truncate text-[10px] text-slate-500">
                      {email || "Administrator"}
                    </span>
                  </span>

                  <ChevronDown
                    size={15}
                    className={`shrink-0 text-slate-400 transition-transform ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </button>
          </div>

          {/* Collapse control */}

          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mt-2 flex min-h-10 w-full cursor-pointer items-center rounded-lg text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
              collapsed ? "justify-center" : "gap-3 px-3"
            }`}
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />

                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[3px]"
          onClick={() => {
            if (!signingOut) setLogoutConfirmOpen(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
                  <LogOut size={21} strokeWidth={1.8} />
                </div>

                <div>
                  <h2
                    id="logout-title"
                    className="text-base font-semibold tracking-tight text-slate-900"
                  >
                    Sign out of admin?
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    You are about to end your admin session.
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                aria-label="Close confirmation"
                disabled={signingOut}
                onClick={() => setLogoutConfirmOpen(false)}
                className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message */}
            <div className="px-6 py-5">
              <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ShieldCheck
                  size={19}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <p
                  id="logout-description"
                  className="text-sm leading-6 text-slate-600"
                >
                  Are you sure you want to sign out? You will need to
                  authenticate again to access the administration panel.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
              {/* Cancel */}
              <button
                type="button"
                disabled={signingOut}
                onClick={() => setLogoutConfirmOpen(false)}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {/* Confirm sign out */}
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    Confirm sign out
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
