/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { spawn } from "node:child_process";
import path from "node:path";

// HK-Motion (user 2026-11-19): the Studio's «حذف» / «حذف موسيقى» buttons call tools/hk_server.mjs, started here with the Studio on (the Studio's port + 99) and serving THIS folder.
// A second start on a taken port exits quietly. The browser side computes the same port from its own address (src/studioTools.ts).
if (process.argv.includes("studio")) {
  try {
    const pa = process.argv.find((a) => a.startsWith("--port=")), port = (pa ? Number(pa.split("=")[1]) : 3000) + 99;
    const ch = spawn(process.execPath, [path.resolve(process.cwd(), "tools", "hk_server.mjs"), String(port), String(process.pid)], { detached: true, stdio: "ignore", windowsHide: true });
    ch.on("error", () => { /* no tools server: the buttons say so */ });
    ch.unref();
  } catch { /* never block the Studio */ }
}

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setHardwareAcceleration("if-possible");
Config.setChromiumOpenGlRenderer("angle");
// تخفيف الضغط على المعالج أثناء الرندر (بدل فتح تبويب لكل نواة)
Config.setConcurrency(6);
