import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ConfigurationError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl">
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-violet-500 text-xl font-bold">
          P
        </div>

        <h1 className="text-xl font-bold">Admin configuration required</h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Add VITE_CLERK_PUBLISHABLE_KEY to your admin/.env file, then restart
          the development server.
        </p>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {!publishableKey ? (
      <ConfigurationError />
    ) : (
      <ClerkProvider publishableKey={publishableKey}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    )}
  </React.StrictMode>,
);
