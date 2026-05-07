import { adminToken, sendJson } from "./_shared.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
    if (req.body?.password !== process.env.ADMIN_PASSWORD) return sendJson(res, 401, { error: "รหัสผ่านไม่ถูกต้อง" });

    return sendJson(res, 200, { ok: true }, {
      "Set-Cookie": `nps_admin=${adminToken()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`
    });
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

