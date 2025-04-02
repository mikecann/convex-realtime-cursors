import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";
import { SettingsProvider } from "./contexts/SettingsContext.tsx";
import { MeProvider } from "./contexts/MeContext.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <MeProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </MeProvider>
    </ConvexProvider>
  </StrictMode>,
);
