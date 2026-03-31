import "./global.css";

import React from "react";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { SessionProvider } from "./src/store/SessionContext";

/**
 * App.tsx — Punto de entrada principal.
 * Envuelve todo en el SessionProvider para el estado global.
 */
export default function App() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
