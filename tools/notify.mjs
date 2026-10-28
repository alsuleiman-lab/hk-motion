// Send notifications through Janib only. Janib is silent and does not use the Windows tray.
import { sendJanib } from "./janib_client.mjs";

export function sendNotification({
  id,
  title,
  body = "",
  source = "مونتاج البثوث والدروس",
  kind = "temporary",
  progress = 0,
  link = "",
  logo = "",
}) {
  console.log(`\n📢 [إشعار]: ${title} — ${body}`);
  return sendJanib({
    action: "notify",
    notification: { id, source, title, body, logo, link, kind, progress },
  }).catch((error) => console.warn("تعذر إرسال الإشعار إلى جانب:", error.message));
}
