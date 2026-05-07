import { isAdmin, readState, writeState } from "../../api/_shared.js";

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
    if (event.httpMethod === "GET") return json(200, await readState());
    if (event.httpMethod === "POST") {
      if (!isAdmin({ headers: event.headers })) return json(401, { error: "Admin login required" });
      return json(200, await writeState(JSON.parse(event.body || "{}")));
    }
    return json(405, { error: "Method not allowed" });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

