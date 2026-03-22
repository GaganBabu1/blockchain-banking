/*
 * main.tsx
 * Application entry point - renders the App component into the DOM.
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(<App />);
