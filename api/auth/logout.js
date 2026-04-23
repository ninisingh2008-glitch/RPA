const { handleApi } = require("../../lib/api-handler");

module.exports = async (req, res) => {
  const parsed = new URL(req.url || "/api/auth/logout", "http://localhost");
  await handleApi(req, res, "/api/auth/logout", parsed.searchParams);
};
