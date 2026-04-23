const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const defaults = require("../data/default-content");

const root = path.resolve(__dirname, "..");
const devStorePath = path.join(root, "data", "dev-store.json");
const sessions = global.__rpaSessions || (global.__rpaSessions = new Map());

const TABLES = {
  pages: "SitePages",
  tournaments: "Tournaments",
  team: "StateTeam",
  news: "News",
  partners: "Partners",
  users: "Users"
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

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

function getConfig() {
  const env = loadEnv(path.join(root, ".env"));
  return {
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID || env.AIRTABLE_BASE_ID || "",
    AIRTABLE_PAT: process.env.AIRTABLE_PAT || env.AIRTABLE_PAT || "",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || env.ADMIN_USERNAME || "admin",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD || "change-this-password",
    SESSION_SECRET:
      process.env.SESSION_SECRET ||
      env.SESSION_SECRET ||
      "replace-this-session-secret-before-production"
  };
}

function hasAirtableConfig() {
  const { AIRTABLE_BASE_ID, AIRTABLE_PAT } = getConfig();
  return Boolean(AIRTABLE_BASE_ID && AIRTABLE_PAT);
}

function hashPassword(password, salt = crypto.randomBytes(8).toString("hex")) {
  const digest = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${digest}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(":")) return false;
  const [salt, digest] = storedHash.split(":");
  return hashPassword(password, salt) === `${salt}:${digest}`;
}

function sanitizeUser(record) {
  if (!record) return null;
  return {
    id: record.id,
    username: record.username || "",
    fullName: record.fullName || "",
    role: String(record.role || "member").trim() || "member",
    email: record.email || "",
    status: String(record.status || "Active").trim() || "Active"
  };
}

function baseLocalStore() {
  return {
    pages: clone(defaults.pages),
    tournaments: clone(defaults.tournaments),
    team: clone(defaults.team),
    news: clone(defaults.news),
    partners: clone(defaults.partners),
    users: clone(defaults.users).map((user) => ({
      ...user,
      passwordHash: user.passwordHash || ""
    }))
  };
}

function readLocalStore() {
  if (!fs.existsSync(devStorePath)) {
    const seeded = baseLocalStore();
    fs.writeFileSync(devStorePath, JSON.stringify(seeded, null, 2));
    return seeded;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(devStorePath, "utf8"));
    return {
      ...baseLocalStore(),
      ...raw,
      pages: { ...clone(defaults.pages), ...(raw.pages || {}) }
    };
  } catch {
    const seeded = baseLocalStore();
    fs.writeFileSync(devStorePath, JSON.stringify(seeded, null, 2));
    return seeded;
  }
}

function writeLocalStore(store) {
  fs.writeFileSync(devStorePath, JSON.stringify(store, null, 2));
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const cookies = {};
  raw.split(";").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) cookies[key.trim()] = decodeURIComponent(value.trim());
  });
  return cookies;
}

function signSession(id, secret) {
  return crypto.createHmac("sha256", secret).update(id).digest("hex");
}

function createSession(secret, payload) {
  const id = crypto.randomUUID();
  sessions.set(id, { ...payload, createdAt: Date.now() });
  return `${id}.${signSession(id, secret)}`;
}

function getSession(req, secret) {
  const token = parseCookies(req).rpa_session;
  if (!token) return null;
  const [id, signature] = token.split(".");
  if (!id || !signature) return null;
  if (signSession(id, secret) !== signature) return null;
  return sessions.get(id) || null;
}

function clearSession(req, res) {
  const token = parseCookies(req).rpa_session;
  if (token) {
    const [id] = token.split(".");
    sessions.delete(id);
  }
  res.setHeader("Set-Cookie", "rpa_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
}

function requireAdmin(req, res, secret) {
  const session = getSession(req, secret);
  if (!session || session.role !== "admin") {
    sendJson(res, 401, { error: "Admin authentication required." });
    return null;
  }
  return session;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function airtableRequest(resource, options = {}) {
  const { AIRTABLE_BASE_ID, AIRTABLE_PAT } = getConfig();
  if (!AIRTABLE_BASE_ID || !AIRTABLE_PAT) return null;

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${resource}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airtable error ${response.status}: ${text}`);
  }

  if (response.status === 204) return {};
  return response.json();
}

async function getPage(slug) {
  if (!hasAirtableConfig()) {
    const store = readLocalStore();
    return store.pages[slug] || clone(defaults.pages[slug]);
  }

  try {
    const formula = encodeURIComponent(`{Slug}="${slug}"`);
    const data = await airtableRequest(`${TABLES.pages}?filterByFormula=${formula}&maxRecords=1`);
    const record = data && data.records && data.records[0];
    if (!record) return defaults.pages[slug];
    return {
      ...(defaults.pages[slug] || {}),
      title: record.fields.Title || defaults.pages[slug]?.title || slug,
      ...(record.fields.Payload ? JSON.parse(record.fields.Payload) : {})
    };
  } catch {
    return defaults.pages[slug];
  }
}

async function savePage(slug, title, payload) {
  if (!hasAirtableConfig()) {
    const store = readLocalStore();
    store.pages[slug] = { ...payload, title };
    writeLocalStore(store);
    return;
  }

  const formula = encodeURIComponent(`{Slug}="${slug}"`);
  const existing = await airtableRequest(`${TABLES.pages}?filterByFormula=${formula}&maxRecords=1`);
  const record = existing && existing.records && existing.records[0];
  const body = JSON.stringify({
    fields: {
      Slug: slug,
      Title: title,
      Payload: JSON.stringify(payload, null, 2)
    }
  });

  if (record) {
    await airtableRequest(`${TABLES.pages}/${record.id}`, { method: "PATCH", body });
    return;
  }

  await airtableRequest(TABLES.pages, { method: "POST", body });
}

function normalizeRecord(table, record) {
  if (!record) return null;
  const fields = record.fields || {};

  if (table === "tournaments") {
    return {
      id: record.id,
      name: fields.Name || "",
      category: fields.Category || "",
      date: fields.Date || "",
      city: fields.City || "",
      venue: fields.Venue || "",
      description: fields.Description || "",
      image: fields.ImageUrl || fields.Image || "",
      status: fields.Status || "",
      registrationLink: fields.RegistrationLink || "contact.html"
    };
  }

  if (table === "team") {
    return {
      id: record.id,
      name: fields.Name || "",
      role: fields.Role || "",
      city: fields.City || "",
      highlight: fields.Highlight || "",
      image: fields.ImageUrl || fields.Image || "assets/logo.jpeg"
    };
  }

  if (table === "news") {
    return {
      id: record.id,
      title: fields.Title || "",
      category: fields.Category || "",
      date: fields.Date || "",
      summary: fields.Summary || "",
      image: fields.ImageUrl || "",
      link: fields.Link || "media.html"
    };
  }

  if (table === "partners") {
    return {
      id: record.id,
      name: fields.Name || "",
      type: fields.Type || "",
      description: fields.Description || "",
      image: fields.ImageUrl || "",
      url: fields.Url || "contact.html"
    };
  }

  if (table === "users") {
    return {
      id: record.id,
      username: fields.Username || "",
      fullName: fields.FullName || "",
      role: String(fields.Role || "member").trim() || "member",
      email: fields.Email || "",
      status: String(fields.Status || "Active").trim() || "Active",
      passwordHash: fields.PasswordHash || ""
    };
  }

  return { id: record.id, ...fields };
}

async function listRecords(table) {
  if (!hasAirtableConfig()) {
    const store = readLocalStore();
    const records = clone(store[table] || defaults[table] || []);
    return table === "users" ? records.map(sanitizeUser) : records;
  }

  try {
    const data = await airtableRequest(TABLES[table]);
    if (!data || !data.records) return clone(defaults[table] || []);
    const records = data.records.map((record) => normalizeRecord(table, record));
    return table === "users" ? records.map(sanitizeUser) : records;
  } catch {
    return clone(defaults[table] || []);
  }
}

async function getStoredUserById(id) {
  if (!id) return null;

  if (!hasAirtableConfig()) {
    const store = readLocalStore();
    return (store.users || []).find((user) => user.id === id) || null;
  }

  if (!id.startsWith("rec")) return null;
  const record = await airtableRequest(`${TABLES.users}/${id}`);
  return record ? normalizeRecord("users", record) : null;
}

function buildFields(table, payload) {
  if (table === "tournaments") {
    return {
      Name: payload.name || "",
      Category: payload.category || "",
      Date: payload.date || "",
      City: payload.city || "",
      Venue: payload.venue || "",
      Description: payload.description || "",
      ImageUrl: payload.image || "",
      Status: payload.status || "",
      RegistrationLink: payload.registrationLink || "contact.html"
    };
  }

  if (table === "team") {
    return {
      Name: payload.name || "",
      Role: payload.role || "",
      City: payload.city || "",
      Highlight: payload.highlight || "",
      ImageUrl: payload.image || "",
      Image: payload.image || "assets/logo.jpeg"
    };
  }

  if (table === "news") {
    return {
      Title: payload.title || "",
      Category: payload.category || "",
      Date: payload.date || "",
      Summary: payload.summary || "",
      ImageUrl: payload.image || "",
      Link: payload.link || "media.html"
    };
  }

  if (table === "partners") {
    return {
      Name: payload.name || "",
      Type: payload.type || "",
      Description: payload.description || "",
      ImageUrl: payload.image || "",
      Url: payload.url || "contact.html"
    };
  }

  if (table === "users") {
    return {
      Username: payload.username || "",
      FullName: payload.fullName || "",
      Role: String(payload.role || "member").trim() || "member",
      Email: payload.email || "",
      Status: String(payload.status || "Active").trim() || "Active",
      PasswordHash: payload.passwordHash || ""
    };
  }

  return payload;
}

async function saveRecord(table, payload) {
  let previousUser = null;
  if (table === "users" && payload.id) {
    previousUser = await getStoredUserById(payload.id);
  }

  const cleanPayload =
    table === "users"
      ? {
          ...payload,
          passwordHash: payload.password
            ? hashPassword(payload.password)
            : payload.passwordHash || previousUser?.passwordHash || ""
        }
      : { ...payload };

  delete cleanPayload.password;

  if (!hasAirtableConfig()) {
    const store = readLocalStore();
    const collection = clone(store[table] || []);
    const index = collection.findIndex((item) => item.id === cleanPayload.id);
    const record = {
      ...(index >= 0 ? collection[index] : {}),
      ...cleanPayload,
      id: cleanPayload.id || `${table.slice(0, 4)}-${crypto.randomUUID()}`
    };
    if (index >= 0) {
      collection[index] = record;
    } else {
      collection.push(record);
    }
    store[table] = collection;
    writeLocalStore(store);
    return table === "users" ? sanitizeUser(record) : record;
  }

  const body = JSON.stringify({ fields: buildFields(table, cleanPayload) });

  if (cleanPayload.id && cleanPayload.id.startsWith("rec")) {
    const updated = await airtableRequest(`${TABLES[table]}/${cleanPayload.id}`, { method: "PATCH", body });
    return table === "users" ? sanitizeUser(normalizeRecord(table, updated)) : normalizeRecord(table, updated);
  }

  const created = await airtableRequest(TABLES[table], { method: "POST", body });
  return table === "users" ? sanitizeUser(normalizeRecord(table, created)) : normalizeRecord(table, created);
}

async function deleteRecord(table, id) {
  if (!hasAirtableConfig()) {
    const store = readLocalStore();
    store[table] = (store[table] || []).filter((item) => item.id !== id);
    writeLocalStore(store);
    return;
  }

  if (!id.startsWith("rec")) return;
  await airtableRequest(`${TABLES[table]}/${id}`, { method: "DELETE" });
}

async function findUserByIdentifier(identifier) {
  if (!identifier) return null;

  if (!hasAirtableConfig()) {
    const store = readLocalStore();
    return (store.users || []).find(
      (user) =>
        user.username?.toLowerCase() === identifier.toLowerCase() ||
        user.email?.toLowerCase() === identifier.toLowerCase()
    );
  }

  const safeIdentifier = String(identifier).replace(/"/g, '\\"');
  const formula = encodeURIComponent(
    `OR(LOWER({Username})=LOWER("${safeIdentifier}"),LOWER({Email})=LOWER("${safeIdentifier}"))`
  );
  const data = await airtableRequest(`${TABLES.users}?filterByFormula=${formula}&maxRecords=1`);
  const record = data?.records?.[0];
  return record ? normalizeRecord("users", record) : null;
}

async function createUserAccount(payload) {
  const existing = await findUserByIdentifier(payload.username);
  if (existing) throw new Error("That username is already in use.");

  if (payload.email) {
    const emailMatch = await findUserByIdentifier(payload.email);
    if (emailMatch) throw new Error("That email is already in use.");
  }

  const record = await saveRecord("users", {
    username: payload.username,
    fullName: payload.fullName,
    email: payload.email,
    role: payload.role || "member",
    status: payload.status || "Active",
    password: payload.password
  });

  return record;
}

async function handleLogin(req, res, body) {
  const config = getConfig();
  const identifier = String(body.identifier || body.username || "").trim();
  const password = String(body.password || "");

  if (!identifier || !password) {
    sendJson(res, 400, { error: "Username or email and password are required." });
    return;
  }

  const user = await findUserByIdentifier(identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    sendJson(res, 401, { error: "Invalid credentials." });
    return;
  }

  if ((user.status || "").toLowerCase() !== "active") {
    sendJson(res, 403, { error: "This account is not active." });
    return;
  }

  const sessionValue = createSession(config.SESSION_SECRET, {
    id: user.id,
    username: user.username,
    role: String(user.role || "member").trim() || "member",
    email: user.email || "",
    fullName: user.fullName || ""
  });
  res.setHeader("Set-Cookie", `rpa_session=${sessionValue}; HttpOnly; Path=/; SameSite=Lax`);
  sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
}

async function handleSignup(req, res, body) {
  const fullName = String(body.fullName || "").trim();
  const username = String(body.username || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!fullName || !username || !email || !password) {
    sendJson(res, 400, { error: "Full name, username, email, and password are required." });
    return;
  }

  if (password.length < 8) {
    sendJson(res, 400, { error: "Password must be at least 8 characters." });
    return;
  }

  const user = await createUserAccount({
    fullName,
    username,
    email,
    password,
    role: "member",
    status: "Active"
  });

  sendJson(res, 201, { ok: true, user });
}

async function handleApi(req, res, pathname, searchParams) {
  const config = getConfig();

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const body = await parseBody(req);
    await handleLogin(req, res, body);
    return;
  }

  if (pathname === "/api/auth/signup" && req.method === "POST") {
    const body = await parseBody(req);
    await handleSignup(req, res, body);
    return;
  }

  if (pathname === "/api/auth/logout" && req.method === "POST") {
    clearSession(req, res);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/auth/me" && req.method === "GET") {
    const session = getSession(req, config.SESSION_SECRET);
    sendJson(res, 200, {
      authenticated: Boolean(session),
      user: session
        ? {
            username: session.username,
            fullName: session.fullName || "",
            email: session.email || "",
            role: String(session.role || "member").trim() || "member"
          }
        : null
    });
    return;
  }

  if (pathname === "/api/public/bootstrap" && req.method === "GET") {
    const page = searchParams.get("page") || "home";
    const [pageContent, tournaments, team, news, partners] = await Promise.all([
      getPage(page),
      listRecords("tournaments"),
      listRecords("team"),
      listRecords("news"),
      listRecords("partners")
    ]);

    sendJson(res, 200, { page: pageContent, tournaments, team, news, partners });
    return;
  }

  sendJson(res, 404, { error: "Not found." });
}

module.exports = {
  handleApi
};
