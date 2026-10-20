import { useEffect, useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";

const pageNames = {
  "/": "Dashboard",
  "/users": "Users",
  "/workspaces": "Workspaces",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/comments": "Comments",
  "/database": "Data explorer",
  "/account": "Administrator account",
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const title = pageNames[location.pathname] || "Administration";

  // Close the mobile sidebar after navigating to another page.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Keep the document from creating a second scrollbar.
  // The main content area handles page scrolling instead.
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.height = previousBodyHeight;
    };
  }, []);

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-[#f7f8fc] text-slate-800">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
        }`}
      >
        <header className="relative z-30 flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-xs">
              <span className="hidden text-slate-400 sm:inline">
                Admin console
              </span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <h1 className="truncate font-semibold text-slate-800">{title}</h1>
            </div>
          </div>

          <div className="ml-4 flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex">
              <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              Admin session
            </div>

            <div className="h-7 w-px bg-slate-200" />

            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </header>

        {/* The only page-level vertical scrolling region */}
        <main
          key={location.pathname}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
        >
          <div className="mx-auto min-h-full w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>

          <footer className="flex flex-col gap-2 border-t border-slate-200/80 bg-white px-5 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>© {new Date().getFullYear()} Orbit Admin Console</span>
            <span>Secure platform management</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
