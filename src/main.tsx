import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { startAnalytics } from "./lib/analytics";
import { enableCompanions } from "./lib/companions";
import { enableLearnerStats } from "./lib/learnerStats";
import { startProgressSync } from "./lib/progressSync";
import "./index.css";

enableLearnerStats();
enableCompanions();
createRoot(document.getElementById("root")!).render(<App />);

startProgressSync();
startAnalytics();
