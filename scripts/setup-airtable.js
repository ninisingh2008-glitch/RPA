const https = require("https");
const path = require("path");
const fs = require("fs");
const { tables } = require("../lib/airtable-schema");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const entries = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...valueParts] = line.split("=");
    entries[key.trim()] = valueParts.join("=").trim();
  }
  return entries;
}

const env = loadEnv(path.join(__dirname, "..", ".env"));
const baseId = process.env.AIRTABLE_BASE_ID || env.AIRTABLE_BASE_ID;
const token = process.env.AIRTABLE_PAT || env.AIRTABLE_PAT;

if (!baseId || !token) {
  console.error("Missing AIRTABLE_BASE_ID or AIRTABLE_PAT. Add them to .env first.");
  process.exit(1);
}

function request(method, requestPath, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.airtable.com",
        path: requestPath,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Airtable ${res.statusCode}: ${raw}`));
            return;
          }
          resolve(raw ? JSON.parse(raw) : {});
        });
      }
    );

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const existing = await request("GET", `/v0/meta/bases/${baseId}/tables`);
  const existingNames = new Set((existing.tables || []).map((table) => table.name));

  for (const table of tables) {
    if (existingNames.has(table.name)) {
      console.log(`Skipping ${table.name} (already exists)`);
      continue;
    }

    console.log(`Creating ${table.name}...`);
    await request("POST", `/v0/meta/bases/${baseId}/tables`, table);
  }

  console.log("Airtable schema setup complete.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
