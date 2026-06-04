import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const isModuleLoadError = (message: string) =>
  /Importing a module script failed|Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk \d+ failed|error loading dynamically imported module/i.test(
    message
  );

const reloadOnceForFreshAssets = () => {
  const key = "__module_reload_at";
  const lastReload = Number(sessionStorage.getItem(key) || 0);

  if (Date.now() - lastReload > 10000) {
    sessionStorage.setItem(key, String(Date.now()));
    const url = new URL(window.location.href);
    url.searchParams.set("__fresh", String(Date.now()));
    window.location.replace(url.toString());
  }
};

window.addEventListener("error", (event) => {
  const error = event as ErrorEvent;
  const message = [error.message, error.error?.message, error.filename].join(" ");

  if (isModuleLoadError(message)) {
    reloadOnceForFreshAssets();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = [reason?.message, String(reason || "")].join(" ");

  if (isModuleLoadError(message)) {
    reloadOnceForFreshAssets();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
