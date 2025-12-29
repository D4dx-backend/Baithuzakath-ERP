import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./themes/blue-theme.css";
import "./themes/purple-theme.css";
import "./themes/green-theme.css";

createRoot(document.getElementById("root")!).render(<App />);
