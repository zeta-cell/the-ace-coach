import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force every `lucide-react` import to resolve to our Phosphor-filled shim
      // so the whole app uses one consistent icon style.
      "lucide-react": path.resolve(__dirname, "./src/lib/lucide-shim.tsx"),
    },
  },
}));
