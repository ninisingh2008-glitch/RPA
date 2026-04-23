const { handleApi } = require("../../lib/api-handler");

module.exports = async (req, res) => {
  const parsed = new URL(req.url || "/api/public/bootstrap", "http://localhost");
  await handleApi(req, res, "/api/public/bootstrap", parsed.searchParams);
};
