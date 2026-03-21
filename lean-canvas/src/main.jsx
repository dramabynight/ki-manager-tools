import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LeanCanvas from "../lean-canvas.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LeanCanvas />
  </StrictMode>
);
