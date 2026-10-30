import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { startProgressSync } from "./lib/progressSync";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

startProgressSync();
