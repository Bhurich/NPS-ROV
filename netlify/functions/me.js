import { isAdmin } from "../../api/_shared.js";

export async function handler(event) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify({ isAdmin: isAdmin({ headers: event.headers }) })
  };
}

