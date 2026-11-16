import React from "react";
import { Composition as RemotionComposition } from "remotion";

/** Every composition of the Root runs inside this guard (user order 2026-11-15: no Studio error screen; problems are contained and healed in the background).
 *  A render/effect error inside a composition shows a calm placeholder instead of the red overlay, is logged to the console, and the composition is retried every 2 s,
 *  so a fixed file heals by itself without a reload. */
class Guard extends React.Component<{ id: string; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  timer: ReturnType<typeof setTimeout> | undefined;
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) {
    console.warn("[contained]", this.props.id, e instanceof Error ? e.message : e);
    this.timer = setTimeout(() => this.setState({ failed: false }), 2000);
  }
  componentWillUnmount() { if (this.timer) clearTimeout(this.timer); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div style={{ position: "absolute", inset: 0, background: "#101521", color: "#9db0c9", fontSize: 28, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 30, direction: "rtl" }}>يُصلَح في الخلفية…</div>;
  }
}

const cache = new WeakMap<object, React.ComponentType<unknown>>();
const guarded = (id: string, C: React.ComponentType<unknown>): React.ComponentType<unknown> => {
  let G = cache.get(C);
  if (!G) { const W: React.FC<Record<string, unknown>> = (p) => <Guard id={id}><C {...(p as object)} /></Guard>; G = W as React.ComponentType<unknown>; cache.set(C, G); }
  return G;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Composition: React.FC<any> = (props) => <RemotionComposition {...props} component={guarded(String(props.id), props.component)} />;
