const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const defaults = require("../data/default-content");

const root = path.resolve(__dirname, "..");
const devStorePath = path.join(root, "data", "dev-store.json");
const sessions = global.__rpaSessions || (global.__rpaSessions = new Map());

const TABLES = {
  pages: "site_pages",
  tournaments: "tournaments",
  team: "state_team",
  news: "news",
  partners: "partners",
  users: "users",
  galleryEvents: "gallery_events",
  galleryImages: "gallery_images"
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
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    "";

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_KEY: supabaseKey,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || env.ADMIN_USERNAME || "admin",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD || "change-this-password",
    SESSION_SECRET:
      process.env.SESSION_SECRET ||
      env.SESSION_SECRET ||
      "replace-this-session-secret-before-production"
  };
}

function hasSupabaseConfig() {
  const { SUPABASE_URL, SUPABASE_KEY } = getConfig();
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
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
    galleryEvents: clone(defaults.galleryEvents),
    galleryImages: clone(defaults.galleryImages),
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

function getSupabaseBaseUrl() {
  const { SUPABASE_URL } = getConfig();
  return String(SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

async function supabaseRequest(resource, options = {}) {
  const { SUPABASE_KEY } = getConfig();
  const baseUrl = getSupabaseBaseUrl();
  if (!baseUrl || !SUPABASE_KEY) return null;

  const response = await fetch(`${baseUrl}/rest/v1/${resource}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  if (response.status === 204) return {};
  return response.json();
}

async function getPage(slug) {
  const store = readLocalStore();
  const pageSlug = slug === "gallery" ? "media" : slug;
  return store.pages[pageSlug] || clone(defaults.pages[pageSlug]);
}

async function savePage(slug, title, payload) {
  const store = readLocalStore();
  store.pages[slug] = { ...payload, title };
  writeLocalStore(store);
}

function normalizeRecord(table, record) {
  if (!record) return null;
  const fields = record.fields || record;
  const id = record.id || fields.id || "";

  if (table === "tournaments") {
    return {
      id,
      slug: fields.slug || "",
      name: fields.name || fields.Name || "",
      category: fields.category || fields.Category || "",
      date: fields.date || fields.Date || "",
      city: fields.city || fields.City || "",
      venue: fields.venue || fields.Venue || "",
      description: fields.description || fields.Description || "",
      image: fields.image_url || fields.ImageUrl || fields.image || fields.Image || "",
      status: fields.status || fields.Status || "",
      registrationLink: fields.registration_link || fields.RegistrationLink || "contact.html",
      results: fields.results || "",
      rules: fields.rules || "",
      fee: fields.fee || "",
      contact: fields.contact || "",
      isFeatured: Boolean(fields.is_featured || fields.isFeatured)
    };
  }

  if (table === "team") {
    return {
      id,
      name: fields.name || fields.Name || "",
      role: fields.role || fields.Role || "",
      city: fields.city || fields.City || "",
      highlight: fields.highlight || fields.Highlight || "",
      image: fields.image_url || fields.ImageUrl || fields.image || fields.Image || "assets/logo.jpeg"
    };
  }

  if (table === "news") {
    return {
      id,
      title: fields.title || fields.Title || "",
      category: fields.category || fields.Category || "",
      date: fields.date || fields.Date || "",
      summary: fields.summary || fields.Summary || "",
      image: fields.image_url || fields.ImageUrl || "",
      link: fields.link || fields.Link || "media.html"
    };
  }

  if (table === "partners") {
    return {
      id,
      name: fields.name || fields.Name || "",
      type: fields.type || fields.Type || "",
      description: fields.description || fields.Description || "",
      image: fields.image_url || fields.ImageUrl || "",
      url: fields.url || fields.Url || "contact.html"
    };
  }

  if (table === "users") {
    return {
      id,
      username: fields.username || fields.Username || "",
      fullName: fields.full_name || fields.FullName || "",
      role: String(fields.role || fields.Role || "member").trim() || "member",
      email: fields.email || fields.Email || "",
      status: String(fields.status || fields.Status || "Active").trim() || "Active",
      passwordHash: fields.password_hash || fields.PasswordHash || ""
    };
  }

  if (table === "galleryEvents") {
    return {
      id,
      slug: fields.slug || "",
      title: fields.title || "",
      category: fields.category || "",
      date: fields.date || "",
      location: fields.location || "",
      summary: fields.summary || "",
      coverImage: fields.cover_image_url || fields.coverImage || "",
      status: fields.status || "Published"
    };
  }

  if (table === "galleryImages") {
    return {
      id,
      eventId: fields.event_id || fields.eventId || "",
      url: fields.image_url || fields.url || "",
      alt: fields.alt || "",
      caption: fields.caption || "",
      sortOrder: Number(fields.sort_order || fields.sortOrder || 0)
    };
  }

  return { id, ...fields };
}

async function listRecords(table) {
  if (!hasSupabaseConfig()) {
    const store = readLocalStore();
    const records = clone(store[table] || defaults[table] || []);
    return table === "users" ? records.map(sanitizeUser) : records;
  }

  if (["pages", "team", "news", "partners"].includes(table)) {
    return clone(defaults[table] || []);
  }

  try {
    const order =
      table === "galleryImages"
        ? "&order=sort_order.asc"
        : table === "tournaments" || table === "galleryEvents"
          ? "&order=date.asc"
          : "";
    const data = await supabaseRequest(`${TABLES[table]}?select=*${order}`);
    if (!Array.isArray(data)) return clone(defaults[table] || []);
    const records = data.map((record) => normalizeRecord(table, record));
    return table === "users" ? records.map(sanitizeUser) : records;
  } catch (error) {
    console.error(`[Supabase] listRecords failed for ${table}:`, error?.message || error);
    return clone(defaults[table] || []);
  }
}

async function getStoredUserById(id) {
  if (!id) return null;

  if (!hasSupabaseConfig()) {
    const store = readLocalStore();
    return (store.users || []).find((user) => user.id === id) || null;
  }

  const safeId = encodeURIComponent(String(id));
  const records = await supabaseRequest(`${TABLES.users}?id=eq.${safeId}&select=*&limit=1`);
  return records?.[0] ? normalizeRecord("users", records[0]) : null;
}

function buildFields(table, payload) {
  if (table === "tournaments") {
    return {
      slug: payload.slug || "",
      name: payload.name || "",
      category: payload.category || "",
      date: payload.date || "",
      city: payload.city || "",
      venue: payload.venue || "",
      description: payload.description || "",
      image_url: payload.image || "",
      status: payload.status || "",
      registration_link: payload.registrationLink || "contact.html",
      results: payload.results || "",
      rules: payload.rules || "",
      fee: payload.fee || "",
      contact: payload.contact || "",
      is_featured: Boolean(payload.isFeatured)
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
      username: payload.username || "",
      full_name: payload.fullName || "",
      role: String(payload.role || "member").trim() || "member",
      email: payload.email || "",
      status: String(payload.status || "Active").trim() || "Active",
      password_hash: payload.passwordHash || ""
    };
  }

  if (table === "galleryEvents") {
    return {
      slug: payload.slug || "",
      title: payload.title || "",
      category: payload.category || "",
      date: payload.date || "",
      location: payload.location || "",
      summary: payload.summary || "",
      cover_image_url: payload.coverImage || "",
      status: payload.status || "Published"
    };
  }

  if (table === "galleryImages") {
    return {
      event_id: payload.eventId || "",
      image_url: payload.url || "",
      alt: payload.alt || "",
      caption: payload.caption || "",
      sort_order: Number(payload.sortOrder || 0)
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

  if (!hasSupabaseConfig()) {
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

  const body = JSON.stringify(buildFields(table, cleanPayload));

  if (cleanPayload.id) {
    const updated = await supabaseRequest(`${TABLES[table]}?id=eq.${encodeURIComponent(String(cleanPayload.id))}`, {
      method: "PATCH",
      body
    });
    const record = Array.isArray(updated) ? updated[0] : updated;
    return table === "users" ? sanitizeUser(normalizeRecord(table, record)) : normalizeRecord(table, record);
  }

  const created = await supabaseRequest(TABLES[table], { method: "POST", body });
  const record = Array.isArray(created) ? created[0] : created;
  return table === "users" ? sanitizeUser(normalizeRecord(table, record)) : normalizeRecord(table, record);
}

async function deleteRecord(table, id) {
  if (!hasSupabaseConfig()) {
    const store = readLocalStore();
    store[table] = (store[table] || []).filter((item) => item.id !== id);
    writeLocalStore(store);
    return;
  }

  await supabaseRequest(`${TABLES[table]}?id=eq.${encodeURIComponent(String(id))}`, { method: "DELETE" });
}

async function findUserByIdentifier(identifier) {
  if (!identifier) return null;

  if (!hasSupabaseConfig()) {
    const store = readLocalStore();
    return (store.users || []).find(
      (user) =>
        user.username?.toLowerCase() === identifier.toLowerCase() ||
        user.email?.toLowerCase() === identifier.toLowerCase()
    );
  }

  const safeIdentifier = encodeURIComponent(String(identifier).toLowerCase());
  const data = await supabaseRequest(
    `${TABLES.users}?or=(username.ilike.${safeIdentifier},email.ilike.${safeIdentifier})&select=*&limit=1`
  );
  return data?.[0] ? normalizeRecord("users", data[0]) : null;
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
  if (!user && identifier === config.ADMIN_USERNAME && password === config.ADMIN_PASSWORD) {
    const sessionValue = createSession(config.SESSION_SECRET, {
      id: "env-admin",
      username: config.ADMIN_USERNAME,
      role: "admin",
      email: "",
      fullName: "Site Admin"
    });
    res.setHeader("Set-Cookie", `rpa_session=${sessionValue}; HttpOnly; Path=/; SameSite=Lax`);
    sendJson(res, 200, {
      ok: true,
      user: {
        id: "env-admin",
        username: config.ADMIN_USERNAME,
        fullName: "Site Admin",
        role: "admin",
        email: "",
        status: "Active"
      }
    });
    return;
  }

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
    const [pageContent, tournaments, team, news, partners, galleryEvents, galleryImages] = await Promise.all([
      getPage(page),
      listRecords("tournaments"),
      listRecords("team"),
      listRecords("news"),
      listRecords("partners"),
      listRecords("galleryEvents"),
      listRecords("galleryImages")
    ]);

    sendJson(res, 200, { page: pageContent, tournaments, team, news, partners, galleryEvents, galleryImages });
    return;
  }

  sendJson(res, 404, { error: "Not found." });
}

module.exports = {
  handleApi
};
