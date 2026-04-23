const { handleApi } = require("../lib/api-handler");

module.exports = async (req, res) => {
  const parsed = new URL(req.url || "/api", "http://localhost");
  await handleApi(req, res, parsed.pathname, parsed.searchParams);
};
