import net from "node:net";
import fs from "node:fs";
import { spawn } from "node:child_process";

const PIPE = String.raw`\\.\pipe\janib-notifications`;
const EXE = "C:/Users/mshms/AppData/Local/Programs/Janib/Janib.exe";

function requestOnce(request) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(PIPE);
    let response = "";
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    };
    socket.setEncoding("utf8");
    socket.setTimeout(3000, () => finish(new Error("Janib did not respond")));
    socket.on("connect", () => socket.write(JSON.stringify(request) + "\n"));
    socket.on("data", (chunk) => {
      response += chunk;
      const newline = response.indexOf("\n");
      if (newline < 0) return;
      try {
        const result = JSON.parse(response.slice(0, newline));
        if (!result.ok) {
          const error = new Error(result.error || "Janib rejected the request");
          error.name = "JanibRequestError";
          throw error;
        }
        finish(null, result.notification);
      } catch (error) { finish(error); }
    });
    socket.on("error", (error) => finish(error));
    socket.on("close", () => { if (!settled) finish(new Error("Janib closed the connection")); });
  });
}

// Janib is no longer used (user 2026-10-28): every send is a silent no-op
export async function sendJanib(request) {
  return { ok: true, skipped: true };
  let lastError;
  for (let attempt = 0; attempt < 8; attempt++) {
    try { return await requestOnce(request); }
    catch (error) {
      if (error.name === "JanibRequestError") throw error;
      lastError = error;
      if (attempt === 0 && fs.existsSync(EXE)) {
        try { spawn(EXE, ["--startup"], { detached: true, stdio: "ignore", windowsHide: true }).unref(); } catch { /* Retry the pipe. */ }
      }
      if (attempt < 7) await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw lastError;
}
