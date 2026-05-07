import { adminToken } from "../../api/_shared.js";

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
    const body = JSON.parse(event.body || "{}");
    if (body.password !== process.env.ADMIN_PASSWORD) return json(401, { error: "รหัสผ่านไม่ถูกต้อง" });

    return json(200, { ok: true }, {
      "Set-Cookie": `nps_admin=${adminToken()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`
    });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

