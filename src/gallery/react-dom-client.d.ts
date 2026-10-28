// react-dom ships no types here (no @types/react-dom); the gallery only needs createRoot
declare module "react-dom/client" {
  import type { ReactNode } from "react";
  export function createRoot(el: Element): { render(node: ReactNode): void; unmount(): void };
}
