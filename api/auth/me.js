const { handleApi } = require("../../lib/api-handler");

module.exports = async (req, res) => {
  const parsed = new URL(req.url || "/api/auth/me", "http://localhost");
  await handleApi(req, res, "/api/auth/me", parsed.searchParams);
};
