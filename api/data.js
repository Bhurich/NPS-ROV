import { isAdmin, readState, sendJson, writeState } from "./_shared.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return sendJson(res, 200, await readState());
    if (req.method === "POST") {
      if (!isAdmin(req)) return sendJson(res, 401, { error: "Admin login required" });
      return sendJson(res, 200, await writeState(req.body));
    }
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

