import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // inicializa o i18next antes da app montar

createRoot(document.getElementById("root")!).render(<App />);
