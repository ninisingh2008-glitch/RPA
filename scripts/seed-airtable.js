const https = require("https");
const path = require("path");
const fs = require("fs");
const defaults = require("../data/default-content");

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

async function upsert(table, matchFormula, fields) {
  const query = encodeURIComponent(matchFormula);
  const existing = await request("GET", `/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${query}&maxRecords=1`);
  const record = existing.records?.[0];
  if (record) {
    await request("PATCH", `/v0/${baseId}/${encodeURIComponent(table)}/${record.id}`, { fields });
    return;
  }
  await request("POST", `/v0/${baseId}/${encodeURIComponent(table)}`, { fields });
}

async function seedPages() {
  for (const [slug, page] of Object.entries(defaults.pages)) {
    await upsert("SitePages", `{Slug}="${slug}"`, {
      Slug: slug,
      Title: page.title || slug,
      Payload: JSON.stringify(page, null, 2)
    });
    console.log(`Seeded page ${slug}`);
  }
}

async function seedCollection(table, records, mapper, keyField) {
  for (const record of records) {
    const value = mapper(record)[keyField];
    await upsert(table, `{${keyField}}="${String(value).replace(/"/g, '\\"')}"`, mapper(record));
    console.log(`Seeded ${table} record ${value}`);
  }
}

async function main() {
  await seedPages();
  await seedCollection(
    "Tournaments",
    defaults.tournaments,
    (item) => ({
      Name: item.name,
      Category: item.category,
      Date: item.date,
      City: item.city,
      Venue: item.venue,
      Description: item.description,
      Status: item.status,
      RegistrationLink: item.registrationLink
    }),
    "Name"
  );
  await seedCollection(
    "StateTeam",
    defaults.team,
    (item) => ({
      Name: item.name,
      Role: item.role,
      City: item.city,
      Highlight: item.highlight,
      Image: item.image
    }),
    "Name"
  );
  await seedCollection(
    "News",
    defaults.news,
    (item) => ({
      Title: item.title,
      Category: item.category,
      Date: item.date,
      Summary: item.summary,
      Link: item.link
    }),
    "Title"
  );
  await seedCollection(
    "Partners",
    defaults.partners,
    (item) => ({
      Name: item.name,
      Type: item.type,
      Description: item.description,
      Url: item.url
    }),
    "Name"
  );
  console.log("Airtable seed complete.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
