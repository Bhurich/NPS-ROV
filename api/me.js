import { isAdmin, sendJson } from "./_shared.js";

export default async function handler(req, res) {
  return sendJson(res, 200, { isAdmin: isAdmin(req) });
}

