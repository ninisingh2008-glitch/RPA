const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const pageName = document.body.dataset.page;
const navLink = document.querySelector(`[data-nav="${pageName}"]`);
if (navLink) navLink.classList.add("is-active");

const root = document.getElementById("page-root");
const authActions = document.getElementById("authActions");
const navToggle = document.getElementById("navToggle");
const navLinks = document.querySelector(".landing-nav-links");
const footerBlurb = document.getElementById("homeFooterBlurb");

let currentSession = null;
let currentPage = null;
let currentData = null;
let editMode = false;
let pageSnapshot = null;
let dataSnapshot = null;
let editorBound = false;
let _districtData = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function renderErrorPage(message, details = null) {
  return `
    <section class="error-page">
      <div class="error-card">
        <h1>Unable to load content</h1>
        <p>${escapeHtml(message)}</p>
        ${details ? `<pre class="error-details">${escapeHtml(details)}</pre>` : ""}
      </div>
    </section>
  `;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function recordKey(record, fallback = "") {
  return record?.slug || record?.id || slugify(record?.name || record?.title || fallback);
}

function getSelectedRecord(records, nameField = "name") {
  const params = new URLSearchParams(window.location.search);
  const selected = params.get("id") || params.get("event") || params.get("slug");
  if (!selected) return null;
  const normalized = slugify(selected);
  return (records || []).find((record) => {
    const keys = [record.id, record.slug, record[nameField], record.title, slugify(record[nameField] || record.title || "")];
    return keys.some((key) => String(key || "") === selected || slugify(key) === normalized);
  });
}

function imageForTournament(item, index = 0) {
  const fallbackImages = [
    "assets/Tournaments Main Image.png",
    "assets/Index Main Image.png",
    "assets/Districts Main Image.png",
    "assets/Membership Main Image.png"
  ];
  return item?.image || fallbackImages[index % fallbackImages.length];
}

function initialsFor(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function iconMarkup(icon) {
  const icons = {
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.27 7 13 7 13s7-7.73 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>',
    community:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM4 21a8 8 0 0 1 16 0H4Zm14-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>',
    trophy:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v4a6 6 0 0 1-5 5.91V16h4v2H7v-2h4v-3.09A6 6 0 0 1 6 7V3Zm-3 1h3v2a3 3 0 0 1-3 3V4Zm18 0v5a3 3 0 0 1-3-3V4h3Z"/></svg>',
    people:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 21a6 6 0 0 1 12 0H2Zm12 0a5 5 0 0 1 8 0h-8Z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h2v20H6V2Zm3 2h9l-2 4 2 4H9V4Z"/></svg>',
    clinics:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3a2 2 0 0 1 2 2v4a3 3 0 1 1-2 0V5h10v4a3 3 0 1 1-2 0V3H7Zm5 10 6 8h-3l-3-4-3 4H6l6-8Z"/></svg>'
  };

  return icons[icon] || icons.map;
}

function createLoader() {
  const loader = document.createElement("div");
  loader.className = "page-loader";
  loader.innerHTML = `
    <div class="page-loader-inner">
      <div class="page-loader-scene" aria-hidden="true">
        <div class="page-loader-ring page-loader-ring--outer"></div>
        <div class="page-loader-ring page-loader-ring--inner"></div>
        <div class="page-loader-core">
          <img src="assets/logo.jpeg" alt="RPA logo" class="page-loader-logo" />
        </div>
      </div>
      <p class="page-loader-text">Loading Rajasthan Pickleball</p>
    </div>
  `;
  document.body.append(loader);
  return loader;
}

function hideLoader(loader) {
  if (!loader) return;
  loader.classList.add("is-hidden");
  window.setTimeout(() => loader.remove(), 420);
}

function getByPath(target, path) {
  return path.split(".").reduce((value, key) => (value == null ? value : value[key]), target);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setByPath(target, path, nextValue) {
  const parts = path.split(".");
  const last = parts.pop();
  const parent = parts.reduce((value, key) => value[key], target);
  parent[last] = nextValue;
}

function isAdminSession(session = currentSession) {
  return false;
}

function getLocalSession() {
  try {
    const user = JSON.parse(window.localStorage.getItem("rpaUser") || "null");
    return user ? { authenticated: true, user } : { authenticated: false, user: null };
  } catch {
    return { authenticated: false, user: null };
  }
}

function getLocalBootstrap(page) {
  const defaults = window.RPA_DEFAULTS;
  const contentPage = page === "gallery" ? "news" : page === "calendar" ? "tournaments" : page;
  if (!defaults?.pages?.[contentPage]) {
    throw new Error(`Local content was not found for "${page}".`);
  }

  return {
    page: deepClone(defaults.pages[contentPage]),
    tournaments: deepClone(defaults.tournaments || []),
    team: deepClone(defaults.team || []),
    news: deepClone(defaults.news || []),
    partners: deepClone(defaults.partners || []),
    galleryEvents: deepClone(defaults.galleryEvents || []),
    galleryImages: deepClone(defaults.galleryImages || [])
  };
}

function createEditableMarkup(path, value, tagName, className = "") {
  const text = escapeHtml(value || "");
  return `<${tagName}${className ? ` class="${className}"` : ""}>${text}</${tagName}>`;
}

function createRecordEditableMarkup(type, recordId, field, value, tagName, className = "") {
  const text = escapeHtml(value || "");
  return `<${tagName}${className ? ` class="${className}"` : ""}>${text}</${tagName}>`;
}

function createEditableImageMarkup(config) {
  const { source, path, recordType, recordId, field, value, alt, className = "" } = config;
  const src = escapeHtml(value || "assets/logo.jpeg");
  return `<img src="${src}" alt="${escapeHtml(alt || "")}" class="${className}" />`;
}

function setContentEditableState(container) {
  return;
}

function showEditToolbar() {
  return;
}

function maybeShowAuthPrompt(session) {
  return;
}

async function uploadImageFile(file) {
  return "";
}

function applyDomChanges(container) {
  return [];
}

async function saveAllChanges() {
  return;
}

function renderAuthActions(session) {
  if (!authActions) return;

  authActions.innerHTML = session?.authenticated
    ? `
      <span class="session-pill">${escapeHtml(session.user?.username || "Member")}</span>
      <a href="auth.html" class="btn btn-primary">My Account</a>
    `
    : `
      <a href="membership.html" class="btn btn-primary">Become a Member</a>
    `;
}

function updateRecord(type, recordId, field, nextValue) {
  const list = currentData?.[type];
  if (!Array.isArray(list)) return null;
  const record = list.find((item) => String(item.id) === String(recordId));
  if (!record) return null;
  record[field] = nextValue;
  return record;
}

function renderPageHero(hero) {
  const actions = (hero.actions || [])
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href)}" class="btn ${action.secondary ? "btn-ghost" : "btn-primary"}">${escapeHtml(action.label)}</a>`
    )
    .join("");

  const tags = (hero.tags || [])
    .map((tag) => `<span class="hero-tag">${escapeHtml(tag)}</span>`)
    .join("");

  const stats = (hero.stats || [])
    .map(
      (item, index) => `
        <div class="landing-card landing-page-stat landing-page-stat--${index % 3}">
          <strong>${escapeHtml(item.value)}</strong>
          ${createEditableMarkup(`hero.stats.${index}.label`, item.label || "", "span", "landing-page-stat-label")}
        </div>
      `
    )
    .join("");

  return `
    <section class="landing-section landing-page-hero">
      <div class="landing-page-hero-grid">
        <div class="landing-page-hero-copy reveal">
          <span class="landing-eyebrow">${escapeHtml(hero.eyebrow || "")}</span>
          ${createEditableMarkup("hero.title", hero.title || "", "h1")}
          ${createEditableMarkup("hero.description", hero.description || "", "p", "landing-lede")}
          ${tags ? `<div class="tag-row">${tags}</div>` : ""}
          ${actions ? `<div class="landing-hero-cta">${actions}</div>` : ""}
        </div>
        <div class="landing-page-hero-panel reveal">
          <div class="landing-page-hero-orb"></div>
          <div class="landing-page-hero-shell">
            <div class="landing-page-badge">
              <img src="assets/logo.jpeg" alt="RPA badge" class="hero-mark" />
              <div>
                <p class="panel-overline">Rajasthan Pickleball Association</p>
                <h3>Official state platform</h3>
              </div>
            </div>
            <p class="panel-note">
              Structured growth, visible competition, stronger district engagement, and a cleaner public-facing state system.
            </p>
            ${stats ? `<div class="landing-page-stats">${stats}</div>` : ""}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAboutCustomPage(page, data) {
  const hero = page.hero || {};
  const sections = page.sections || [];
  const whoWeAre = sections[0] || {};
  const missionSection = sections[1] || {};
  const recognitionSection = sections[2] || {};
  const peopleSection = sections.find((section) => section.layout === "people") || {};
  const districtSection = sections[4] || {};
  const journeySection = sections.find((section) => section.layout === "timeline") || {};
  const ctaSection = sections.find((section) => section.layout === "cta") || {};

  const topCards = [
    {
      title: whoWeAre.kicker || "Who We Are",
      body:
        whoWeAre.body ||
        "Rajasthan Pickleball Association is a non-profit organisation working toward the development of pickleball at grassroots, district and state level."
    },
    missionSection.items?.[0]
      ? { title: missionSection.items[0].title || "Our Mission", body: missionSection.items[0].body || "" }
      : {
          title: "Our Mission",
          body: "To promote pickleball at the grassroots, create opportunities for all, and build a strong competitive pathway."
        },
    missionSection.items?.[1]
      ? { title: missionSection.items[1].title || "Our Vision", body: missionSection.items[1].body || "" }
      : {
          title: "Our Vision",
          body: "To make Rajasthan a national leader in pickleball and inspire a healthier, more active community."
        }
  ];

  const whatWeDo = [
    {
      icon: "people",
      title: "Grassroots Development",
      body: "Building awareness in schools, parks and communities across Rajasthan."
    },
    {
      icon: "community",
      title: "Coaching & Education",
      body: "Training coaches and organising development camps."
    },
    {
      icon: "trophy",
      title: "Tournaments & Events",
      body: "Hosting and supporting district and state-level events."
    },
    {
      icon: "flag",
      title: "State Selection Pathway",
      body: "Structured trials and selection for National representation."
    },
    {
      icon: "map",
      title: "District Expansion",
      body: "Expanding organised play to every district of Rajasthan."
    },
    {
      icon: "clinics",
      title: "Partnerships & Collaborations",
      body: "Working with institutions to grow the sport together."
    }
  ];

  const portraitFallbacks = [
    "assets/logo.jpeg",
    "assets/logo.jpeg",
    "assets/logo.jpeg",
    "assets/logo.jpeg",
    "assets/logo.jpeg",
    "assets/logo.jpeg"
  ];

  const people = [...(peopleSection.items || data.team || [])];
  while (people.length < 6) {
    people.push({
      name: ["Vikram Jain", "Amit Soni"][people.length - 4] || "Office Bearer",
      role: ["Treasurer", "Technical Director"][people.length - 4] || "RPA Office Bearer",
      image: "assets/logo.jpeg"
    });
  }

  const journey = (journeySection.items || []).slice(0, 5);
  const affiliation = {
    title: "Official Affiliation - IPA",
    body:
      "Rajasthan Pickleball Association works within the national pickleball ecosystem through the Indian Pickleball Association, supporting recognised standards for events, rankings, player pathways, and organised development.",
    href: "https://www.ipaofficial.com/"
  };
  const affiliatedClubs = [
    { city: "Jaipur", name: "RPA Jaipur Club Network", contact: "connect@rajasthanpickleball.com" },
    { city: "Udaipur", name: "Lake City Pickleball Academy", contact: "connect@rajasthanpickleball.com" },
    { city: "Jodhpur", name: "Marwar Pickleball Circle", contact: "connect@rajasthanpickleball.com" },
    { city: "Kota", name: "Kota Training & Youth Hub", contact: "connect@rajasthanpickleball.com" }
  ];
  const governanceItems = [
    { title: "Constitution", body: "Core governance document, association objectives, membership rules, and operating principles." },
    { title: "Board Members", body: "Office bearers and board representatives responsible for state-level direction and oversight." },
    { title: "Committees", body: "Tournament, selection, district development, coaching, and disciplinary committees for focused execution." }
  ];

  const heroActions = (hero.actions || [])
    .filter((action) => !String(action.label || "").toLowerCase().includes("partner"))
    .slice(0, 2)
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href || "#")}" class="btn ${action.secondary ? "btn-ghost" : "btn-primary"}">${escapeHtml(action.label || "Learn more")}</a>`
    )
    .join("");

  return `
    <section class="about-rpa">
      <section class="about-rpa-hero reveal">
        <div class="about-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "Affiliated with the Indian Pickleball Association")}</span>
          <h1>
            About
            <span>Rajasthan Pickleball</span>
            <em>Association.</em>
          </h1>
          <p>${escapeHtml(
            hero.description ||
              "We are the official governing body for pickleball in Rajasthan, committed to promoting, developing and taking the sport to every corner of the state."
          )}</p>
          <div class="about-rpa-actions">${heroActions}</div>
        </div>
        <div class="about-rpa-visual">
          <img src="assets/About Main Image.png" alt="Rajasthan Pickleball Association hero visual" class="about-rpa-image" />
        </div>
      </section>

      <section class="about-rpa-topcards reveal">
        ${topCards
          .map(
            (card, index) => `
              <article class="about-rpa-info about-rpa-info--${index + 1}">
                <div class="about-rpa-info-icon">${iconMarkup(index === 0 ? "map" : index === 1 ? "community" : "trophy")}</div>
                <h3>${escapeHtml(card.title || "")}</h3>
                <p>${escapeHtml(card.body || "")}</p>
              </article>
            `
          )
          .join("")}
      </section>

      <section class="about-rpa-affiliation reveal">
        <div class="about-rpa-affiliation-copy">
          <span class="rpa-pill">Official Affiliation</span>
          <h2>${escapeHtml(affiliation.title)}</h2>
          <p>${escapeHtml(affiliation.body)}</p>
          <a href="${escapeHtml(affiliation.href)}" target="_blank" rel="noopener" class="btn btn-primary">Visit IPA Website</a>
        </div>
        <div class="about-rpa-affiliation-card">
          <strong>Indian Pickleball Association</strong>
          <span>National pathway, event standards, recognised competition structure, and player development alignment.</span>
        </div>
      </section>

      <section class="about-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>What We Do</h2>
        </div>
        <div class="about-rpa-do-grid">
          ${whatWeDo
            .map(
              (item) => `
                <article class="about-rpa-do-card">
                  <div class="about-rpa-do-icon">${iconMarkup(item.icon)}</div>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.body)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="about-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>Affiliated Clubs & Academies</h2>
        </div>
        <div class="about-rpa-clubs-layout">
          <div class="about-rpa-map-card">
            <img src="assets/Districts Main Image.png" alt="Rajasthan district map and affiliated clubs" />
          </div>
          <div class="about-rpa-club-list">
            ${affiliatedClubs
              .map(
                (club) => `
                  <article class="about-rpa-club-card">
                    <span>${escapeHtml(club.city)}</span>
                    <h3>${escapeHtml(club.name)}</h3>
                    <a href="mailto:${escapeHtml(club.contact)}">${escapeHtml(club.contact)}</a>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="about-rpa-president reveal">
        <div>
          <span class="rpa-pill">President's Message</span>
          <h2>Message from the President</h2>
        </div>
        <p>President's message will be added here once shared by the RPA team.</p>
      </section>

      <section class="about-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>Governance</h2>
        </div>
        <div class="about-rpa-governance-grid">
          ${governanceItems
            .map(
              (item) => `
                <article class="about-rpa-governance-card">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.body)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="about-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>Leadership / Office Bearers</h2>
        </div>
        <div class="about-rpa-people-grid">
          ${people
            .slice(0, 6)
            .map((person, index) => {
              const image =
                !person.image || person.image === "assets/logo.jpeg" ? portraitFallbacks[index % portraitFallbacks.length] : person.image;
              return `
                <article class="about-rpa-person-card">
                  <img src="${escapeHtml(image)}" alt="${escapeHtml(person.name || "RPA office bearer")}" class="about-rpa-person-image" />
                  <h3>${escapeHtml(person.name || "")}</h3>
                  <p>${escapeHtml(person.role || "")}</p>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>

      <section class="about-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>Our Journey</h2>
        </div>
        <div class="about-rpa-timeline">
          ${journey
            .map(
              (item) => `
                <article class="about-rpa-milestone">
                  <span class="about-rpa-year">${escapeHtml(item.year || "")}</span>
                  <p>${escapeHtml(item.body || "")}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="about-rpa-banner reveal">
        <div class="about-rpa-banner-copy">
          <h2>${escapeHtml(ctaSection.title || "Be part of Rajasthan's pickleball journey.")}</h2>
          <p>${escapeHtml(
            ctaSection.body || "Together, let's build champions and stronger communities."
          )}</p>
        </div>
        <div class="about-rpa-actions">
          <a href="membership.html" class="btn btn-light">Become a Member</a>
          <a href="contact.html" class="btn btn-outline-light">Contact the Team</a>
        </div>
      </section>
    </section>
  `;
}

function renderTournamentsCustomPage(page, data) {
  const hero = page.hero || {};
  const allTournaments = data.tournaments || [];
  const selectedTournament = getSelectedRecord(allTournaments, "name");
  if (selectedTournament) return renderTournamentDetailPage(page, selectedTournament, allTournaments);

  const tournaments = allTournaments.slice(0, 6);
  const featured = allTournaments.find((item) => item.isFeatured) || tournaments[0] || {};
  const calendar = allTournaments.length ? allTournaments : [];
  const categoryCards = [
    { icon: "map", title: "Open" },
    { icon: "people", title: "Juniors" },
    { icon: "community", title: "Mixed" },
    { icon: "flag", title: "Selections" }
  ];
  const faqItems = [
    "How do I register for a tournament?",
    "Who can participate?",
    "What are the age categories?",
    "What are the rules followed?"
  ];
  const resultArchiveItems = [
    {
      title: "Winners & Runners-up",
      body: "Placeholder archive for champions, finalists, category-wise results, and podium records."
    },
    {
      title: "Scores & Draws",
      body: "Placeholder space for match scores, brackets, draw sheets, and downloadable result documents."
    },
    {
      title: "Photos & Press Coverage",
      body: "Placeholder links to event galleries, newspaper clips, IPA/RPA coverage, and media mentions."
    }
  ];
  const handbookItems = [
    { title: "Rulebook", body: "Placeholder for official rules, format notes, match procedures, and scoring references." },
    { title: "Tournament Affiliation Guidelines", body: "Placeholder for event affiliation requirements, venue readiness, reporting, and approval process." },
    { title: "Eligibility", body: "Placeholder for category eligibility, player documents, age groups, rankings, and entry requirements." },
    { title: "Code of Conduct", body: "Placeholder for player, coach, parent, official, and organiser conduct expectations." }
  ];

  const heroActions = (hero.actions || [])
    .slice(0, 2)
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href || "#")}" class="btn ${action.secondary ? "btn-ghost" : "btn-primary"}">${escapeHtml(action.label || "Learn more")}</a>`
    )
    .join("");

  const debugBanner = allTournaments.length === 0
    ? `
      <section class="tourneys-debug-message reveal">
        <div class="tourneys-debug-copy">
          <strong>No tournaments are available in local content.</strong>
          <p>Add tournament entries in <code>data/default-content.js</code> to show them here.</p>
        </div>
      </section>
    `
    : "";

  return `
    <section class="tourneys-rpa">
${debugBanner}
      <section class="tourneys-rpa-hero reveal">
        <div class="tourneys-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "Official RPA Events")}</span>
          <h1>
            Tournaments &
            <span>Competitions</span>
          </h1>
          <p>${escapeHtml(
            hero.description || "Compete, improve, represent. Explore official tournaments and events across Rajasthan."
          )}</p>
          <div class="tourneys-rpa-actions">${heroActions}</div>
        </div>
        <div class="tourneys-rpa-visual">
          <img src="assets/Tournaments Main Image.png" alt="Rajasthan tournaments visual" class="tourneys-rpa-image" />
        </div>
      </section>

      <section class="tourneys-rpa-section reveal">
        <div class="tourneys-rpa-section-head">
          <h2>Featured Tournament</h2>
        </div>
        <article class="tourneys-featured">
          <img
            src="${escapeHtml(imageForTournament(featured, 0))}"
            alt="${escapeHtml(featured.name || "Featured tournament")}"
            class="tourneys-featured-image"
          />
          <div class="tourneys-featured-copy">
            <h3>${escapeHtml(featured.name || "Udaipur Championship 2025")}</h3>
            <p>${escapeHtml(formatDate(featured.date || "2025-08-08"))}</p>
            <span>${escapeHtml(featured.city || "Udaipur, Rajasthan")}</span>
            <div class="tourneys-featured-tags">
              <span>${escapeHtml(featured.status || "Open")}</span>
              <span>Mixed</span>
              <span>Doubles</span>
            </div>
            <a href="tournaments.html?id=${encodeURIComponent(recordKey(featured))}" class="btn btn-primary">View Details</a>
          </div>
        </article>
      </section>

      <section class="tourneys-rpa-section reveal">
        <div class="tourneys-rpa-section-head">
          <h2>Upcoming Tournaments</h2>
          <a href="tournaments.html">View all tournaments</a>
        </div>
        <div class="tourneys-rpa-grid">
          ${tournaments
            .map(
              (item, index) => `
                <article class="tourneys-card tourneys-card--${index + 1}">
                  <a href="tournaments.html?id=${encodeURIComponent(recordKey(item))}" class="tourneys-card-link" aria-label="Open ${escapeHtml(item.name || "tournament")}">
                  <img src="${escapeHtml(imageForTournament(item, index + 1))}" alt="${escapeHtml(
                    item.name || "Tournament image"
                  )}" class="tourneys-card-image" />
                  <div class="tourneys-card-copy">
                    <h3>${escapeHtml(item.name || "")}</h3>
                    <p>${escapeHtml(formatDate(item.date || ""))}</p>
                    <span>${escapeHtml(item.city || "")}</span>
                  </div>
                  </a>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="tourneys-rpa-columns reveal">
        <div class="tourneys-rpa-section">
          <div class="tourneys-rpa-section-head">
            <h2>Tournament Categories</h2>
          </div>
          <div class="tourneys-categories">
            ${categoryCards
              .map(
                (item) => `
                  <article class="tourneys-category-card">
                    <div class="tourneys-category-icon">${iconMarkup(item.icon)}</div>
                    <h3>${escapeHtml(item.title)}</h3>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="tourneys-rpa-section">
          <div class="tourneys-rpa-section-head">
            <h2>Tournament Calendar</h2>
          </div>
          <div class="tourneys-calendar">
            ${calendar
              .map(
                (item) => `
                  <article class="tourneys-calendar-row">
                    <span>${escapeHtml(formatDate(item.date || ""))}</span>
                    <strong>${escapeHtml(item.name || "")}</strong>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="tourneys-rpa-columns reveal">
        <div class="tourneys-rpa-section">
          <div class="tourneys-rpa-section-head">
            <h2>Results Archive</h2>
            <a href="gallery.html">Photos & coverage</a>
          </div>
          <div class="tourneys-archive-grid">
            ${resultArchiveItems
              .map(
                (item) => `
                  <article class="tourneys-archive-card">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.body)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="tourneys-rpa-section">
          <div class="tourneys-rpa-section-head">
            <h2>Handbook</h2>
          </div>
          <div class="tourneys-handbook-grid">
            ${handbookItems
              .map(
                (item) => `
                  <article class="tourneys-handbook-card">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.body)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="tourneys-rpa-section reveal">
        <div class="tourneys-rpa-section-head">
          <h2>FAQs</h2>
        </div>
        <div class="tourneys-faqs">
          ${faqItems
            .map(
              (item) => `
                <details class="tourneys-faq-item">
                  <summary>${escapeHtml(item)}</summary>
                  <p>Please contact the tournament desk for the latest event-specific guidance and registration details.</p>
                </details>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="tourneys-rpa-banner reveal">
        <div class="tourneys-rpa-banner-copy">
          <h2>Ready to compete?</h2>
          <p>Join our tournaments and showcase your talent.</p>
        </div>
        <div class="tourneys-rpa-actions">
          <a href="auth.html#signup" class="btn btn-light">Register for Events</a>
          <a href="contact.html" class="btn btn-outline-light">Tournament Enquiries</a>
        </div>
      </section>
    </section>
  `;
}

function renderAnnualCalendarPage(page, data) {
  const tournaments = data.tournaments || [];
  const months = [
    { month: "January", focus: "District planning and club onboarding" },
    { month: "February", focus: "Introductory clinics and school outreach" },
    { month: "March", focus: "Club meets and academy development sessions" },
    { month: "April", focus: "District activation camps" },
    { month: "May", focus: "District circuit weekends" },
    { month: "June", focus: "RPA State Open window" },
    { month: "July", focus: "Road to Nationals trials" },
    { month: "August", focus: "Junior development and ranking events" },
    { month: "September", focus: "Inter-district tournament window" },
    { month: "October", focus: "Coaching, refereeing and academy workshops" },
    { month: "November", focus: "State championship preparation" },
    { month: "December", focus: "Annual review and next-season calendar" }
  ];

  const eventsByMonth = tournaments.reduce((acc, item) => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return acc;
    const month = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(date);
    acc[month] = acc[month] || [];
    acc[month].push(item);
    return acc;
  }, {});

  return `
    <section class="media-rpa annual-calendar-page">
      <section class="media-rpa-hero reveal">
        <div class="media-rpa-copy">
          <span class="rpa-pill">Annual RPA Events</span>
          <h1>
            Annual
            <span>Calendar</span>
          </h1>
          <p>Follow the broad RPA event rhythm for tournaments, district activity, trials, clubs, academies and development programs across Rajasthan.</p>
          <div class="media-rpa-actions">
            <a href="tournaments.html" class="btn btn-primary">View Tournaments</a>
            <a href="contact.html" class="btn btn-ghost">Ask About Events</a>
          </div>
        </div>
        <div class="media-rpa-visual">
          <img src="assets/Tournaments Main Image.png" alt="RPA annual event calendar" class="media-rpa-image" />
        </div>
      </section>

      <section class="media-rpa-section reveal">
        <div class="tourneys-rpa-section-head">
          <h2>Annual calendar of events</h2>
          <a href="tournaments.html">Open tournament desk</a>
        </div>
        <div class="annual-calendar-grid">
          ${months
            .map((item) => {
              const events = eventsByMonth[item.month] || [];
              return `
                <article class="annual-calendar-card">
                  <span>${escapeHtml(item.month)}</span>
                  <h3>${escapeHtml(events[0]?.name || item.focus)}</h3>
                  <p>${escapeHtml(events[0] ? `${formatDate(events[0].date)} · ${events[0].city || "Rajasthan"}` : item.focus)}</p>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function renderTournamentDetailPage(page, tournament, allTournaments) {
  const related = (allTournaments || []).filter((item) => item.id !== tournament.id).slice(0, 3);
  const detailRows = [
    { label: "Date", value: formatDate(tournament.date) || "TBA" },
    { label: "City", value: tournament.city || "Rajasthan" },
    { label: "Venue", value: tournament.venue || "Venue TBA" },
    { label: "Category", value: tournament.category || "Tournament" },
    { label: "Status", value: tournament.status || "Upcoming" },
    { label: "Fee", value: tournament.fee || "" }
  ].filter((item) => item.value);

  return `
    <section class="tourneys-rpa">
      <section class="tourneys-detail-hero reveal">
        <a href="tournaments.html" class="tourneys-back-link">Back to all tournaments</a>
        <div class="tourneys-detail-grid">
          <div class="tourneys-detail-copy">
            <span class="rpa-pill">${escapeHtml(tournament.category || "Tournament")}</span>
            <h1>${escapeHtml(tournament.name || "Tournament")}</h1>
            <p>${escapeHtml(
              tournament.description ||
                "Tournament details, schedule information, registration notes, and official updates will appear here."
            )}</p>
            <div class="tourneys-rpa-actions">
              <a href="${escapeHtml(tournament.registrationLink || "contact.html")}" class="btn btn-primary">Register / Enquire</a>
              <a href="gallery.html" class="btn btn-ghost">Open Gallery</a>
            </div>
          </div>
          <img src="${escapeHtml(imageForTournament(tournament, 0))}" alt="${escapeHtml(tournament.name || "Tournament")}" class="tourneys-detail-image" />
        </div>
      </section>

      <section class="tourneys-rpa-columns reveal">
        <div class="tourneys-rpa-section">
          <div class="tourneys-rpa-section-head">
            <h2>Event Details</h2>
          </div>
          <div class="tourneys-detail-list">
            ${detailRows
              .map(
                (item) => `
                  <article class="tourneys-detail-row">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="tourneys-rpa-section">
          <div class="tourneys-rpa-section-head">
            <h2>Rules & Notes</h2>
          </div>
          <div class="tourneys-detail-note">
            <p>${escapeHtml(
              tournament.rules ||
                "Rules, eligibility, category notes, and check-in instructions can be added in local content for this tournament."
            )}</p>
            ${tournament.contact ? `<p><strong>Contact:</strong> ${escapeHtml(tournament.contact)}</p>` : ""}
          </div>
        </div>
      </section>

      ${
        related.length
          ? `
            <section class="tourneys-rpa-section reveal">
              <div class="tourneys-rpa-section-head">
                <h2>More Tournaments</h2>
                <a href="tournaments.html">View all</a>
              </div>
              <div class="tourneys-rpa-grid">
                ${related
                  .map(
                    (item, index) => `
                      <article class="tourneys-card tourneys-card--${index + 1}">
                        <a href="tournaments.html?id=${encodeURIComponent(recordKey(item))}" class="tourneys-card-link">
                          <img src="${escapeHtml(imageForTournament(item, index + 1))}" alt="${escapeHtml(item.name || "Tournament")}" class="tourneys-card-image" />
                          <div class="tourneys-card-copy">
                            <h3>${escapeHtml(item.name || "")}</h3>
                            <p>${escapeHtml(formatDate(item.date || ""))}</p>
                            <span>${escapeHtml(item.city || "")}</span>
                          </div>
                        </a>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }
    </section>
  `;
}

function renderDistrictsCustomPage(page) {
  const hero = page.hero || {};
  const stats = hero.stats || [];

  const allDistricts = [
    { id: "ajmer", name: "Ajmer", nickname: "Gateway of Rajasthan", landmark: "Dargah Sharif & Ana Sagar Lake", feature: "Sufi heritage & pilgrimage", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "alwar", name: "Alwar", nickname: "Eastern Gateway", landmark: "Sariska Tiger Reserve", feature: "Bengal tigers & Bala Quila fort", image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "banswara", name: "Banswara", nickname: "City of Hundred Islands", landmark: "Mahi Dam & Beneshwar Dham", feature: "Tribal culture & river islands", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "baran", name: "Baran", nickname: "Land of Forests", landmark: "Shahbad Fort & Bhainsrorgarh", feature: "Dense forests & ancient forts", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "barmer", name: "Barmer", nickname: "Desert Frontier", landmark: "Kiradu Temples & Thar Desert", feature: "Desert festivals & folk embroidery", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "bharatpur", name: "Bharatpur", nickname: "Eastern Gateway", landmark: "Keoladeo National Park", feature: "UNESCO bird sanctuary", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "bhilwara", name: "Bhilwara", nickname: "Textile City", landmark: "Menal Temples", feature: "Textile hub & ancient temple cluster", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "bikaner", name: "Bikaner", nickname: "Camel Country", landmark: "Junagarh Fort & Karni Mata Temple", feature: "Camel fairs & desert heritage", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "bundi", name: "Bundi", nickname: "City of Stepwells", landmark: "Taragarh Fort & Baori Stepwells", feature: "Ancient stepwells & palace frescoes", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "chittorgarh", name: "Chittorgarh", nickname: "City of Valour", landmark: "Chittorgarh Fort (UNESCO)", feature: "Rajput warrior heritage & hill fort", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "churu", name: "Churu", nickname: "Gateway to Thar", landmark: "Shekhawati Painted Havelis", feature: "Open-air fresco murals", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "dausa", name: "Dausa", nickname: "Ancient Dhundhar", landmark: "Bhangarh Fort", feature: "Historic forts & Mehandipur Balaji", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "dholpur", name: "Dholpur", nickname: "Land of Dholpur Stone", landmark: "Chambal Ravines & National Chambal Sanctuary", feature: "Gharial & dolphin habitat", image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "dungarpur", name: "Dungarpur", nickname: "City of Dungars", landmark: "Udai Bilas Palace & Beneshwar Dham", feature: "Tribal art & palace architecture", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "hanumangarh", name: "Hanumangarh", nickname: "Land of Ghaggar", landmark: "Kalibangan Archaeological Site", feature: "Harappan civilisation remains", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "jaipur", name: "Jaipur", nickname: "Pink City", landmark: "Hawa Mahal & Amer Fort", feature: "Rajasthan capital & Pink City heritage", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "jaisalmer", name: "Jaisalmer", nickname: "Golden City", landmark: "Jaisalmer Fort & Sam Sand Dunes", feature: "Living fort & Thar Desert dunes", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "jalor", name: "Jalor", nickname: "Land of Granite", landmark: "Jalor Fort", feature: "Gurjara-Pratihara hill fort", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "jhalawar", name: "Jhalawar", nickname: "City of Bells", landmark: "Jhalrapatan Suryamahal Temple", feature: "Temple architecture & Buddhist caves", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "jhunjhunu", name: "Jhunjhunu", nickname: "Land of Havelis", landmark: "Mandawa Painted Havelis", feature: "Shekhawati open-air art gallery", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "jodhpur", name: "Jodhpur", nickname: "Blue City", landmark: "Mehrangarh Fort & Umaid Bhawan", feature: "Blue cityscape & Marwar heritage", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "karauli", name: "Karauli", nickname: "Red City", landmark: "Kaila Devi Temple & City Palace", feature: "Red sandstone architecture & tigers", image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "kota", name: "Kota", nickname: "Education City", landmark: "Chambal Garden & Kota Garh", feature: "Chambal river & education hub", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "nagaur", name: "Nagaur", nickname: "Land of Forts", landmark: "Nagaur Fort & Camel Fair", feature: "Medieval fort & Rajasthan Camel Fair", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "pali", name: "Pali", nickname: "Industrial Heartland", landmark: "Ranakpur Jain Temple", feature: "15th-century Jain marble masterpiece", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "pratapgarh", name: "Pratapgarh", nickname: "Tribal Belt", landmark: "Gaytri Temple Complex", feature: "Tribal heritage & temple art", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "rajsamand", name: "Rajsamand", nickname: "Lake District", landmark: "Rajsamand Lake & Nathdwara", feature: "Sacred lake & Srinathji temple", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "sawai-madhopur", name: "Sawai Madhopur", nickname: "City of Tigers", landmark: "Ranthambore Tiger Reserve (UNESCO)", feature: "Bengal tigers in a medieval fort", image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "sikar", name: "Sikar", nickname: "Commercial Capital", landmark: "Salasar Balaji Temple & Shekhawati Havelis", feature: "Pilgrimage centre & painted havelis", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "sirohi", name: "Sirohi", nickname: "Hill Station", landmark: "Mount Abu & Dilwara Jain Temples", feature: "Rajasthan's only hill station", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "sri-ganganagar", name: "Sri Ganganagar", nickname: "Granary of Rajasthan", landmark: "Gurudwara Ber Sahib & Canal Network", feature: "Agricultural heartland of Rajasthan", image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" },
    { id: "tonk", name: "Tonk", nickname: "City of Nawabs", landmark: "Arabic & Persian Library (Sunehri Kothi)", feature: "Nawabi heritage & Islamic art", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "emerging" },
    { id: "udaipur", name: "Udaipur", nickname: "City of Lakes", landmark: "City Palace & Lake Pichola", feature: "Romantic lake city & Mewar heritage", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=600", status: "active" }
  ];

  const roadmap = [
    { icon: "map", title: "Active District Bodies", body: "Established bodies with local organisers, courts and regular play windows." },
    { icon: "clinics", title: "Emerging Districts", body: "Districts where interest is building and activation is in progress." },
    { icon: "community", title: "Clubs & Academies", body: "Affiliated institutions helping grow the sport at every level." }
  ];

  const heroActions = (hero.actions || [])
    .slice(0, 2)
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href || "#")}" class="btn ${action.secondary ? "btn-ghost" : "btn-primary"}">${escapeHtml(action.label || "Learn more")}</a>`
    )
    .join("");

  const featuredDistricts = allDistricts.filter((district) =>
    ["jaipur", "udaipur", "jodhpur", "kota", "ajmer", "bikaner"].includes(district.id)
  );

  const featuredCards = featuredDistricts
    .map(
      (district) => `
        <button
          type="button"
          class="districts-feature-card"
          data-district-id="${escapeHtml(district.id)}"
          aria-label="View ${escapeHtml(district.name)} district details"
        >
          <img src="${escapeHtml(district.image)}" alt="${escapeHtml(district.name)} district visual" loading="lazy" />
          <span class="districts-all-card-status districts-all-card-status--${escapeHtml(district.status)}">${district.status === "active" ? "Active" : "Emerging"}</span>
          <div>
            <h3>${escapeHtml(district.name)}</h3>
            <p>${escapeHtml(district.feature)}</p>
          </div>
        </button>
      `
    )
    .join("");

  const districtCards = allDistricts
    .map(
      (district) => `
        <button
          type="button"
          class="districts-all-card"
          data-district-id="${escapeHtml(district.id)}"
          aria-label="View ${escapeHtml(district.name)} district details"
        >
          <img
            src="${escapeHtml(district.image)}"
            alt="${escapeHtml(district.name)} – ${escapeHtml(district.landmark)}"
            class="districts-all-card-img"
            loading="lazy"
          />
          <span class="districts-all-card-status districts-all-card-status--${escapeHtml(district.status)}">${district.status === "active" ? "Active" : "Emerging"}</span>
          <div class="districts-all-card-copy">
            <h3>${escapeHtml(district.name)}</h3>
            <p>${escapeHtml(district.nickname || district.feature)}</p>
          </div>
        </button>
      `
    )
    .join("");

  _districtData = allDistricts;

  return `
    <section class="districts-rpa">
      <section class="districts-rpa-hero reveal">
        <div class="districts-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "District Bodies Network")}</span>
          <h1>
            Pickleball Across
            <span>Rajasthan</span>
          </h1>
          <p>${escapeHtml(
            hero.description ||
              "Explore Rajasthan's district bodies, emerging playing hubs, and local development network. Each district can hold contacts, affiliated clubs, academies, venues, and activation updates."
          )}</p>
          <div class="districts-rpa-actions">${heroActions}</div>
        </div>
        <div class="districts-rpa-visual">
          <img src="assets/Districts Main Image.png" alt="Rajasthan district network visual" class="districts-rpa-image" />
        </div>
      </section>

      <section class="districts-rpa-stats reveal">
        ${stats
          .map((stat, index) => {
            const icons = ["map", "community", "people", "clinics"];
            return `
              <article class="districts-rpa-stat">
                <div class="districts-rpa-stat-icon">${iconMarkup(icons[index] || "map")}</div>
                <div>
                  <strong>${escapeHtml(stat.value || "")}</strong>
                  <span>${escapeHtml(stat.label || "")}</span>
                </div>
              </article>
            `;
          })
          .join("")}
      </section>

      <section class="districts-rpa-grid reveal" id="district-network">
        <div class="districts-rpa-main">
          <div class="about-rpa-section-head">
            <h2>Featured District Hubs</h2>
          </div>
          <p class="districts-rpa-subcopy">Start with highlighted hubs, then scan the full directory below. Every district can later hold clubs, academies, venues and official contacts.</p>
          <div class="districts-feature-grid">
            ${featuredCards}
          </div>
          <div class="districts-directory-head">
            <h3>All 33 District Bodies</h3>
            <span>Click any district to view placeholder contact details</span>
          </div>
          <div class="districts-all-grid">
            ${districtCards}
          </div>
        </div>

        <aside class="districts-rpa-side">
          <div class="about-rpa-section-head">
            <h2>Network Overview</h2>
          </div>
          <div class="districts-rpa-roadmap">
            ${roadmap
              .map(
                (item) => `
                  <article class="districts-rpa-roadmap-card">
                    <div class="districts-rpa-roadmap-icon">${iconMarkup(item.icon)}</div>
                    <div>
                      <h3>${escapeHtml(item.title)}</h3>
                      <p>${escapeHtml(item.body)}</p>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </aside>
      </section>

      <section class="about-rpa-banner reveal">
        <div class="about-rpa-banner-copy">
          <h2>District development updates will live here.</h2>
          <p>Use this space for district committees, venue status, club listings, academy contacts, local calendars and growth notes.</p>
        </div>
        <div class="about-rpa-actions">
          <a href="tournaments.html" class="btn btn-outline-light">See Events</a>
          <a href="contact.html" class="btn btn-light">Contact District Desk</a>
        </div>
      </section>
    </section>
  `;
}

function renderMembershipCustomPage(page) {
  const hero = page.hero || {};
  const sections = page.sections || [];
  const benefits = sections.find((section) => section.kicker?.toLowerCase().includes("why join"))?.items || [];
  const faqs = sections.find((section) => section.layout === "faq")?.items || [];
  const ctaSection = sections.find((section) => section.layout === "cta") || {};
  const registrationCategories = [
    {
      title: "Register as Player",
      body: "Placeholder copy for player registration eligibility, pathway access, tournament participation, and member profile details.",
      href: "auth.html#player-registration",
      cta: "Player Registration"
    },
    {
      title: "Register as Club/Academy",
      body: "Placeholder copy for club or academy affiliation, venue details, coaching structure, and district coordination.",
      href: "contact.html#club-academy-registration",
      cta: "Club/Academy Registration"
    },
    {
      title: "Tournament Registration",
      body: "Placeholder copy for tournament entry, event affiliation, draws, results submission, and player ranking workflows.",
      href: "tournaments.html#tournament-registration",
      cta: "Tournament Registration"
    }
  ];
  const tournamentBenefits = [
    "Placeholder: tournament affiliation helps create recognised event records and consistent reporting.",
    "Placeholder: affiliated tournaments can align with rating/ranking workflows including PWR-related documentation.",
    "Placeholder: organisers can publish draws, results, photos, and press coverage through the RPA ecosystem.",
    "Placeholder: event standards, eligibility, and code of conduct can be linked to the tournament handbook."
  ];

  const heroActions = (hero.actions || [])
    .slice(0, 2)
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href || "#")}" class="btn ${action.secondary ? "btn-ghost" : "btn-primary"}">${escapeHtml(action.label || "Learn more")}</a>`
    )
    .join("");

  return `
    <section class="membership-rpa">
      <section class="membership-rpa-hero reveal">
        <div class="membership-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "Join The Community")}</span>
          <h1>
            Membership with
            <span>Rajasthan Pickleball</span>
            <em>Association</em>
          </h1>
          <p>${escapeHtml(
            hero.description ||
              "Join a growing community of players, coaches, and supporters committed to growing pickleball across the state."
          )}</p>
          <div class="membership-rpa-actions">${heroActions}</div>
        </div>
        <div class="membership-rpa-visual">
          <img src="assets/Membership Main Image.png" alt="Membership visual" class="membership-rpa-image" />
        </div>
      </section>

      <section class="membership-rpa-section reveal" id="membership-registration">
        <div class="about-rpa-section-head">
          <h2>Registration Categories</h2>
        </div>
        <div class="membership-register-grid">
          ${registrationCategories
            .map(
              (item, index) => `
                <article class="membership-register-card membership-register-card--${index + 1}">
                  <div class="membership-benefit-icon">${iconMarkup(["people", "clinics", "trophy"][index] || "map")}</div>
                  <h3>${escapeHtml(item.title || "")}</h3>
                  <p>${escapeHtml(item.body || "")}</p>
                  <a href="${escapeHtml(item.href)}" class="btn ${index === 2 ? "btn-primary" : "btn-ghost"}">${escapeHtml(item.cta)}</a>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="membership-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>Tournament Affiliation Benefits</h2>
        </div>
        <div class="membership-affiliation-panel">
          <div>
            <span class="rpa-pill">PWR / Document Placeholder</span>
            <h3>Benefits of Tournament Affiliation</h3>
            <p>Placeholder section for explaining tournament affiliation, PWR-related use, and the document that will be added later.</p>
          </div>
          <ul>
            ${tournamentBenefits.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      </section>

      <section class="membership-rpa-section reveal" id="membership-benefits">
        <div class="about-rpa-section-head">
          <h2>Placeholder Member Benefits</h2>
        </div>
        <div class="membership-benefits-grid">
          ${benefits
            .map(
              (item, index) => `
                <article class="membership-benefit-card">
                  <div class="membership-benefit-icon">${iconMarkup(["calendar", "community", "people", "flag"][index] || "map")}</div>
                  <h3>${escapeHtml(item.title || "")}</h3>
                  <p>${escapeHtml(item.body || "")}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="membership-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>Membership FAQs</h2>
        </div>
        <div class="tourneys-faqs">
          ${faqs
            .map(
              (item) => `
                <details class="tourneys-faq-item">
                  <summary>${escapeHtml(item.question || "")}</summary>
                  <p>${escapeHtml(item.answer || "")}</p>
                </details>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="about-rpa-banner reveal">
        <img src="assets/Ball.png" alt="" class="rpa-banner-ball" />
        <div class="about-rpa-banner-copy">
          <h2>${escapeHtml(ctaSection.title || "Join Rajasthan's fastest-growing pickleball community.")}</h2>
          <p>${escapeHtml(ctaSection.body || "Together we grow stronger events, better pathways, and more connected districts.")}</p>
        </div>
        <div class="about-rpa-actions">
          <a href="auth.html#signup" class="btn btn-light">Become a Member</a>
          <a href="contact.html" class="btn btn-outline-light">Contact Us</a>
        </div>
      </section>
    </section>
  `;
}

function renderLearnCustomPage(page) {
  const hero = page.hero || {};
  const tutorials = [
    { level: "Beginner", title: "First touch and court basics", body: "Placeholder for beginner video tutorials covering grip, serve, kitchen rules, scoring and safe movement.", href: "contact.html" },
    { level: "Intermediate", title: "Dinks, drives and doubles patterns", body: "Placeholder for intermediate tutorials on shot selection, resets, positioning and partner communication.", href: "contact.html" },
    { level: "Pro", title: "Tournament strategy and match prep", body: "Placeholder for advanced tutorials on speedups, poaching, stacking, scouting and pressure management.", href: "contact.html" }
  ];
  const coaches = [
    { name: "Coach Name Placeholder", role: "Official Coach", city: "Jaipur", contact: "connect@rajasthanpickleball.com" },
    { name: "Coach Name Placeholder", role: "District Coach", city: "Udaipur", contact: "connect@rajasthanpickleball.com" },
    { name: "Coach Name Placeholder", role: "Academy Coach", city: "Jodhpur", contact: "connect@rajasthanpickleball.com" }
  ];
  const faqs = [
    { question: "Who can learn pickleball?", answer: "Placeholder answer for age groups, beginner friendliness, and how new players can start safely." },
    { question: "What equipment is needed?", answer: "Placeholder answer for paddle, ball, shoes, court access, and optional coaching support." },
    { question: "Where can I train?", answer: "Placeholder answer linking players to official coaches, districts, clubs and academies." }
  ];

  return `
    <section class="learn-rpa">
      <section class="learn-rpa-hero reveal">
        <div class="learn-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "Learn Pickleball")}</span>
          <h1>
            Learn the game,
            <span>then play it well.</span>
          </h1>
          <p>${escapeHtml(
            hero.description ||
              "A beginner-friendly learning hub for rules, tutorials, coaching contacts and official resources."
          )}</p>
          <div class="learn-rpa-actions">
            <a href="#tutorials" class="btn btn-primary">Watch Tutorials</a>
            <a href="#rulebook" class="btn btn-ghost">Open Rulebook</a>
          </div>
        </div>
        <div class="learn-rpa-visual">
          <img src="assets/Index Main Image.png" alt="Pickleball learning visual" class="learn-rpa-image" />
          <div class="learn-video-chip">
            <span></span>
            Video / AI Visual Placeholder
          </div>
        </div>
      </section>

      <section class="learn-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>What is pickleball?</h2>
        </div>
        <div class="learn-intro-grid">
          <article class="learn-intro-card learn-intro-card--wide">
            <img src="assets/Membership Main Image.png" alt="Pickleball basics visual" />
            <div>
              <span class="rpa-pill">Photo / Video / AI Visual</span>
              <h3>Fast to learn, tactical to master.</h3>
              <p>Placeholder explainer for what pickleball is, how it blends tennis, badminton and table tennis, and why it works for schools, families, clubs and competitive players.</p>
            </div>
          </article>
          <article class="learn-intro-card">
            <h3>Court & scoring</h3>
            <p>Placeholder for court dimensions, doubles play, serving order, non-volley zone and basic scoring.</p>
          </article>
          <article class="learn-intro-card">
            <h3>How to start</h3>
            <p>Placeholder for beginner steps, coach contact, district route and equipment guidance.</p>
          </article>
        </div>
      </section>

      <section class="learn-rpa-section reveal" id="tutorials">
        <div class="about-rpa-section-head">
          <h2>Video Tutorials</h2>
        </div>
        <div class="learn-tutorial-grid">
          ${tutorials
            .map(
              (item) => `
                <article class="learn-tutorial-card">
                  <div class="learn-video-box">${iconMarkup("clinics")}</div>
                  <span>${escapeHtml(item.level)}</span>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.body)}</p>
                  <a href="${escapeHtml(item.href)}">Add video link</a>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="learn-rpa-columns reveal">
        <div class="learn-rpa-section">
          <div class="about-rpa-section-head">
            <h2>Official Coaches</h2>
          </div>
          <div class="learn-coach-list">
            ${coaches
              .map(
                (coach) => `
                  <article class="learn-coach-card">
                    <div class="learn-coach-avatar">${escapeHtml(initialsFor(coach.name))}</div>
                    <div>
                      <h3>${escapeHtml(coach.name)}</h3>
                      <p>${escapeHtml(`${coach.role} / ${coach.city}`)}</p>
                      <a href="mailto:${escapeHtml(coach.contact)}">${escapeHtml(coach.contact)}</a>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="learn-rpa-section" id="rulebook">
          <div class="about-rpa-section-head">
            <h2>Rulebook</h2>
          </div>
          <div class="learn-rulebook-card">
            <span class="rpa-pill">Rulebook Placeholder</span>
            <h3>Official rules and playing guidance</h3>
            <p>Placeholder for linking the official rulebook, simplified rules, eligibility notes and code of conduct resources.</p>
            <a href="contact.html" class="btn btn-primary">Add Rulebook Link</a>
          </div>
        </div>
      </section>

      <section class="learn-rpa-section reveal">
        <div class="about-rpa-section-head">
          <h2>FAQs</h2>
        </div>
        <div class="tourneys-faqs">
          ${faqs
            .map(
              (item) => `
                <details class="tourneys-faq-item">
                  <summary>${escapeHtml(item.question)}</summary>
                  <p>${escapeHtml(item.answer)}</p>
                </details>
              `
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function renderShopCustomPage(page) {
  const hero = page.hero || {};
  const products = [
    { title: "RPA Jersey", price: "Price placeholder", body: "Placeholder for official jersey details, sizes, colors, stock and product images.", image: "assets/logo.jpeg" },
    { title: "RPA Jumper", price: "Price placeholder", body: "Placeholder for jumper details, fabric, sizes, variants and delivery notes.", image: "assets/logo.jpeg" },
    { title: "RPA Cap", price: "Price placeholder", body: "Placeholder for cap details, color options, sizing and availability.", image: "assets/logo.jpeg" }
  ];

  return `
    <section class="shop-rpa">
      <section class="shop-rpa-hero reveal">
        <div class="shop-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "RPA Shop")}</span>
          <h1>
            Official RPA
            <span>Merchandise</span>
          </h1>
          <p>${escapeHtml(
            hero.description ||
              "A placeholder storefront for official jerseys, jumpers, caps and future merchandise drops."
          )}</p>
          <div class="shop-rpa-actions">
            <a href="#shop-products" class="btn btn-primary">Browse Merchandise</a>
            <a href="#payment" class="btn btn-ghost">Payment Details</a>
          </div>
        </div>
        <div class="shop-rpa-visual">
          <img src="assets/Membership Main Image.png" alt="RPA merchandise placeholder" class="shop-rpa-image" />
        </div>
      </section>

      <section class="shop-rpa-section reveal" id="shop-products">
        <div class="about-rpa-section-head">
          <h2>Merchandise</h2>
        </div>
        <div class="shop-product-grid">
          ${products
            .map(
              (item) => `
                <article class="shop-product-card">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />
                  <div class="shop-product-copy">
                    <span>${escapeHtml(item.price)}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.body)}</p>
                    <a href="#payment" class="btn btn-ghost">Order Placeholder</a>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="shop-rpa-section reveal" id="payment">
        <div class="shop-payment-panel">
          <div>
            <span class="rpa-pill">Payment Gateway Placeholder</span>
            <h2>RPA bank account payment flow</h2>
            <p>Placeholder for payment gateway integration that routes merchandise payments to the RPA bank account. Bank details, gateway provider, order confirmation and receipt workflow can be added later.</p>
          </div>
          <div class="shop-payment-steps">
            <article><strong>1</strong><span>Select merchandise</span></article>
            <article><strong>2</strong><span>Open gateway / UPI / bank transfer flow</span></article>
            <article><strong>3</strong><span>Submit payment reference and receive confirmation</span></article>
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderMediaCustomPage(page, data) {
  const hero = page.hero || {};
  const sections = page.sections || [];
  const galleryItems = (data.galleryEvents || []).filter((item) => item.coverImage);
  const galleryFallback = [
    {
      title: "Jaipur Open gallery",
      category: "Tournament",
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    },
    {
      title: "District clinic highlights",
      category: "Community",
      image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    },
    {
      title: "State event visuals",
      category: "Media",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    }
  ];
  const heroActions = (hero.actions || [])
    .slice(0, 2)
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href || "#")}" class="btn ${action.secondary ? "btn-ghost" : "btn-primary"}">${escapeHtml(action.label || "Learn more")}</a>`
    )
    .join("");

  return `
    <section class="media-rpa">
      <section class="media-rpa-hero reveal">
        <div class="media-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "Gallery")}</span>
          <h1>
            Image
            <span>Gallery</span>
          </h1>
          <p>${escapeHtml(
            hero.description || "Browse highlights from tournaments, district clinics, and community sessions across Rajasthan."
          )}</p>
          <div class="media-rpa-actions">${heroActions}</div>
        </div>
        <div class="media-rpa-visual">
          <img src="assets/Contact Main Image.png" alt="Media page visual" class="media-rpa-image" />
        </div>
      </section>

      <section class="media-rpa-section reveal" id="media-gallery" data-gallery-root>
        <div class="about-rpa-section-head">
          <h2>Gallery</h2>
        </div>
        <div class="media-gallery-grid">
          ${(galleryItems.length ? galleryItems : galleryFallback)
            .map((item, index) => {
              const image = item.coverImage || "";
              const title = item.title || "Gallery event";
              const category = item.category || "";
              const href = `gallery.html?id=${encodeURIComponent(recordKey(item))}`;
              return `
                <a class="media-gallery-card" href="${href}">
                  <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="media-gallery-image" />
                  <div class="media-gallery-copy">
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(category)}</p>
                  </div>
                </a>
              `;
            })
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function renderGalleryEventsPage(page, data) {
  const hero = page.hero || {};
  const events = data.galleryEvents || [];
  const selectedEvent = getSelectedRecord(events, "title");
  if (selectedEvent) return renderGalleryEventDetailPage(page, selectedEvent, data.galleryImages || [], events);
  const pressItems = [
    {
      title: "IPA Coverage Placeholder",
      body: "Placeholder for IPA article links, national coverage, federation announcements, and tournament reports."
    },
    {
      title: "RPA Press Placeholder",
      body: "Placeholder for RPA media mentions, state announcements, local newspaper coverage, and event summaries."
    },
    {
      title: "Media Kit Placeholder",
      body: "Placeholder for logos, official statements, photo credits, press contacts, and downloadable assets."
    }
  ];

  return `
    <section class="media-rpa">
      <section class="media-rpa-hero reveal">
        <div class="media-rpa-copy">
          <span class="rpa-pill">Media</span>
          <h1>
            RPA
            <span>Media</span>
          </h1>
          <p>${escapeHtml(
            hero.description || "Placeholder media hub for event galleries, press coverage, articles, and official RPA updates."
          )}</p>
          <div class="media-rpa-actions">
            <a href="#media-gallery" class="btn btn-primary">Open Gallery</a>
            <a href="contact.html" class="btn btn-ghost">Media Enquiries</a>
          </div>
        </div>
        <div class="media-rpa-visual">
          <img src="assets/Contact Main Image.png" alt="Rajasthan pickleball gallery" class="media-rpa-image" />
        </div>
      </section>

      <section class="media-rpa-section reveal" id="media-gallery">
        <div class="about-rpa-section-head">
          <h2>Gallery</h2>
        </div>
        <article class="media-feature-panel">
          <img src="assets/Tournaments Main Image.png" alt="IPA Nationals 2025 placeholder" />
          <div>
            <span class="rpa-pill">IPA Nationals 2025</span>
            <h3>IPA Nationals 2025 - Bengaluru</h3>
            <p>Placeholder content block for images, videos, and brief event notes from IPA Nationals 2025 held in Bengaluru. Footage links can be added here when provided.</p>
          </div>
        </article>
        <div class="media-gallery-grid">
          ${events
            .map(
              (item) => `
                <a class="media-gallery-card" href="gallery.html?id=${encodeURIComponent(recordKey(item))}">
                  <img src="${escapeHtml(item.coverImage || "assets/logo.jpeg")}" alt="${escapeHtml(item.title || "Gallery event")}" class="media-gallery-image" />
                  <div class="media-gallery-copy">
                    <h3>${escapeHtml(item.title || "")}</h3>
                    <p>${escapeHtml([item.category, formatDate(item.date), item.location].filter(Boolean).join(" / "))}</p>
                  </div>
                </a>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="media-rpa-section reveal" id="media-press">
        <div class="about-rpa-section-head">
          <h2>Press</h2>
        </div>
        <div class="media-press-grid">
          ${pressItems
            .map(
              (item) => `
                <article class="media-press-card">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.body)}</p>
                  <a href="contact.html">Add coverage link</a>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function renderGalleryEventDetailPage(page, event, images, events) {
  const eventImages = (images || [])
    .filter((image) => String(image.eventId) === String(event.id))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const displayImages = eventImages.length
    ? eventImages
    : [
        {
          id: "cover",
          eventId: event.id,
          url: event.coverImage,
          alt: event.title,
          caption: event.summary,
          sortOrder: 0
        }
      ].filter((image) => image.url);

  return `
    <section class="media-rpa">
      <section class="gallery-event-hero reveal">
        <a href="gallery.html" class="tourneys-back-link">Back to gallery events</a>
        <div class="gallery-event-head">
          <div>
            <span class="rpa-pill">${escapeHtml(event.category || "Gallery")}</span>
            <h1>${escapeHtml(event.title || "Gallery Event")}</h1>
            <p>${escapeHtml(event.summary || "All photos from this event are shown below.")}</p>
          </div>
          <div class="gallery-event-meta">
            <span>${escapeHtml(formatDate(event.date) || "Date TBA")}</span>
            <strong>${escapeHtml(event.location || "Rajasthan")}</strong>
          </div>
        </div>
      </section>

      <section class="media-rpa-section reveal" data-gallery-root>
        <div class="about-rpa-section-head">
          <h2>All Images</h2>
        </div>
        <div class="gallery-event-grid">
          ${displayImages
            .map(
              (image, index) => `
                <a class="gallery-event-image-card" href="${escapeHtml(image.url)}" data-gallery-item data-gallery-index="${index}" data-gallery-src="${escapeHtml(
                  image.url
                )}" data-gallery-title="${escapeHtml(image.caption || image.alt || event.title || "Gallery image")}">
                  <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || image.caption || event.title || "Gallery image")}" class="gallery-event-image" loading="lazy" />
                  ${image.caption ? `<span>${escapeHtml(image.caption)}</span>` : ""}
                </a>
              `
            )
            .join("")}
        </div>
      </section>
    </section>
  `;
}

function renderContactCustomPage(page, data) {
  const hero = page.hero || {};
  const sections = page.sections || [];
  const enquiryCards = sections[0]?.items || [];
  const detailCards = sections[1]?.items || [];
  const faqs = sections.find((section) => section.layout === "faq")?.items || [];
  const galleryItems = (data?.galleryEvents || []).filter((item) => item.coverImage);
  const galleryFallback = [
    {
      title: "Community sessions",
      category: "Community",
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    },
    {
      title: "Tournament highlights",
      category: "Tournament",
      image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    },
    {
      title: "District clinics",
      category: "Clinics",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    }
  ];
  const heroActions = (hero.actions || [])
    .slice(0, 2)
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href || "#")}" class="btn ${action.secondary ? "btn-ghost" : "btn-primary"}">${escapeHtml(action.label || "Learn more")}</a>`
    )
    .join("");

  return `
    <section class="contact-rpa">
      <section class="contact-rpa-hero reveal">
        <div class="contact-rpa-copy">
          <span class="rpa-pill">${escapeHtml(hero.eyebrow || "Get In Touch")}</span>
          <h1>
            Contact Rajasthan
            <span>Pickleball Association</span>
          </h1>
          <p>${escapeHtml(hero.description || "Have a question or want to collaborate? We'd love to hear from you.")}</p>
          <div class="contact-rpa-actions">${heroActions}</div>
        </div>
        <div class="contact-rpa-visual">
          <img src="assets/Contact Main Image.png" alt="Contact page visual" class="contact-rpa-image" />
        </div>
      </section>

      <section class="contact-rpa-strip reveal">
        ${enquiryCards
          .slice(0, 4)
          .map(
            (item, index) => `
              <article class="contact-rpa-card">
                <div class="contact-rpa-card-icon">${iconMarkup(["map", "trophy", "community", "flag"][index] || "map")}</div>
                <div>
                  <h3>${escapeHtml(item.title || "")}</h3>
                  <p>${escapeHtml(item.body || "")}</p>
                </div>
              </article>
            `
          )
          .join("")}
      </section>

      <section class="contact-rpa-gallery reveal" id="contact-gallery" aria-label="Gallery" data-gallery-root>
        <div class="about-rpa-section-head">
          <h2>Gallery</h2>
        </div>
        <div class="media-gallery-grid">
          ${(galleryItems.length ? galleryItems : galleryFallback)
            .slice(0, 6)
            .map((item, index) => {
              const image = item.coverImage || "";
              const title = item.title || "Gallery event";
              const category = item.category || "";
              const href = `gallery.html?id=${encodeURIComponent(recordKey(item))}`;
              return `
                <a class="media-gallery-card" href="${href}">
                  <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="media-gallery-image" />
                  <div class="media-gallery-copy">
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(category)}</p>
                  </div>
                </a>
              `;
            })
            .join("")}
        </div>
      </section>

      <section class="contact-rpa-grid reveal">
        <div class="contact-rpa-form card-shell">
          <div class="about-rpa-section-head">
            <h2>Send Us a Message</h2>
          </div>
          <form class="contact-rpa-form-grid">
            <input type="text" placeholder="Your Name" />
            <input type="email" placeholder="Email Address" />
            <input type="text" placeholder="Enquiry / Subject" />
            <textarea placeholder="Tell us a little more"></textarea>
            <button type="button" class="btn btn-primary">Send Message</button>
          </form>
        </div>
        <div class="contact-rpa-details card-shell">
          <div class="about-rpa-section-head">
            <h2>Contact Details</h2>
          </div>
          <div class="contact-rpa-detail-list">
            ${detailCards
              .map(
                (item, index) => `
                  <article class="contact-rpa-detail-row">
                    <div class="contact-rpa-card-icon">${iconMarkup(["community", "map", "flag"][index] || "map")}</div>
                    <div>
                      <h3>${escapeHtml(item.title || "")}</h3>
                      <p>${escapeHtml(item.body || "")}</p>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
        <div class="contact-rpa-faqs card-shell">
          <div class="about-rpa-section-head">
            <h2>FAQs</h2>
          </div>
          <div class="tourneys-faqs">
            ${faqs
              .map(
                (item) => `
                  <details class="tourneys-faq-item">
                    <summary>${escapeHtml(item.question || "")}</summary>
                    <p>${escapeHtml(item.answer || "")}</p>
                  </details>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderCards(section, items, basePath) {
  const cards = (items || [])
    .map((item, index) => {
      const title = item.name || item.title || "";
      const body = item.summary || item.body || item.description || item.highlight || "";
      const meta = [
        item.meta,
        item.category,
        item.city,
        item.role,
        item.type,
        item.date ? formatDate(item.date) : ""
      ]
        .filter(Boolean)
        .join(" • ");
      const href = item.href || item.link || item.url || item.registrationLink || "";
      const cta = item.cta || item.linkText || (href ? "Learn more" : "");
      const pathPrefix = `${basePath}.${index}`;
      const isRecord = Boolean(item.id && section.source);
      const titleField = item.name ? "name" : "title";
      const bodyField = item.summary ? "summary" : item.body ? "body" : item.description ? "description" : "highlight";
      const imageMarkup = item.image
        ? createEditableImageMarkup({
            source: isRecord ? "record" : "page",
            path: `${pathPrefix}.image`,
            recordType: section.source,
            recordId: item.id,
            field: "image",
            value: item.image,
            alt: title,
            className: "card-media"
          })
        : "";

      const titleMarkup = isRecord
        ? createRecordEditableMarkup(section.source, item.id, titleField, title, "h3")
        : createEditableMarkup(`${pathPrefix}.${titleField}`, title, "h3");

      const bodyMarkup = isRecord
        ? createRecordEditableMarkup(section.source, item.id, bodyField, body, "p")
        : createEditableMarkup(`${pathPrefix}.${bodyField}`, body, "p");

      return `
        <article class="landing-card reveal">
          ${imageMarkup}
          ${meta ? `<span class="landing-card-tag">${escapeHtml(meta)}</span>` : ""}
          ${titleMarkup}
          ${bodyMarkup}
          ${href ? `<a href="${escapeHtml(href)}" class="link">${escapeHtml(cta)} →</a>` : ""}
        </article>
      `;
    })
    .join("");

  return `
    <section class="landing-section${section.theme === "dark" ? " landing-section-dark" : ""}">
      <div class="landing-section-head reveal">
        <span class="landing-kicker">${escapeHtml(section.kicker || "")}</span>
        ${createEditableMarkup(`${basePath.replace(/\.items$/, "")}.title`, section.title || "", "h2")}
        ${section.intro ? createEditableMarkup(`${basePath.replace(/\.items$/, "")}.intro`, section.intro, "p") : ""}
      </div>
      <div class="landing-cards">${cards}</div>
    </section>
  `;
}

function renderPeople(section, items, basePath) {
  const cards = (items || [])
    .map((item, index) => {
      const pathPrefix = `${basePath}.${index}`;
      const isRecord = Boolean(item.id && section.source);
      const image = item.image
        ? createEditableImageMarkup({
            source: isRecord ? "record" : "page",
            path: `${pathPrefix}.image`,
            recordType: section.source,
            recordId: item.id,
            field: "image",
            value: item.image,
            alt: item.name || "RPA profile",
            className: "person-photo"
          })
        : `<span class="person-initials">${escapeHtml(initialsFor(item.name))}</span>`;
      const meta = [item.role, item.city].filter(Boolean).join(" • ");

      const nameMarkup = isRecord
        ? createRecordEditableMarkup(section.source, item.id, "name", item.name || "", "h3")
        : createEditableMarkup(`${pathPrefix}.name`, item.name || "", "h3");

      const highlightMarkup = isRecord
        ? createRecordEditableMarkup(section.source, item.id, "highlight", item.highlight || "", "p")
        : createEditableMarkup(`${pathPrefix}.highlight`, item.highlight || "", "p");

      return `
        <article class="landing-card landing-person-card reveal">
          <div class="person-visual">${image}</div>
          ${meta ? `<span class="landing-card-tag">${escapeHtml(meta)}</span>` : ""}
          ${nameMarkup}
          ${highlightMarkup}
        </article>
      `;
    })
    .join("");

  return `
    <section class="landing-section${section.theme === "dark" ? " landing-section-dark" : ""}">
      <div class="landing-section-head reveal">
        <span class="landing-kicker">${escapeHtml(section.kicker || "")}</span>
        ${createEditableMarkup(`${basePath.replace(/\.items$/, "")}.title`, section.title || "", "h2")}
      </div>
      <div class="landing-cards landing-people-grid">${cards}</div>
    </section>
  `;
}

function renderStory(section, basePath) {
  return `
    <section class="landing-section${section.theme === "dark" ? " landing-section-dark" : ""}">
      <div class="landing-story-panel reveal">
        <div class="landing-story-accent"></div>
        <div class="landing-story-copy">
          <span class="landing-kicker">${escapeHtml(section.kicker || "")}</span>
          ${createEditableMarkup(`${basePath}.title`, section.title || "", "h2")}
          ${createEditableMarkup(`${basePath}.body`, section.body || "", "p")}
        </div>
      </div>
    </section>
  `;
}

function renderStats(section, basePath) {
  const items = (section.items || [])
    .map(
      (item, index) => `
        <article class="landing-card landing-page-stat reveal">
          <strong>${escapeHtml(item.value || "")}</strong>
          ${createEditableMarkup(`${basePath}.items.${index}.label`, item.label || "", "span", "landing-page-stat-label")}
        </article>
      `
    )
    .join("");

  return `
    <section class="landing-section">
      <div class="landing-section-head reveal">
        <span class="landing-kicker">${escapeHtml(section.kicker || "")}</span>
        ${createEditableMarkup(`${basePath}.title`, section.title || "", "h2")}
      </div>
      <div class="landing-page-stats">${items}</div>
    </section>
  `;
}

function renderList(section, basePath) {
  const items = (section.items || [])
    .map(
      (item, index) => `<li class="reveal">${createEditableMarkup(`${basePath}.items.${index}`, item, "span")}</li>`
    )
    .join("");

  return `
    <section class="landing-section">
      <div class="landing-section-head reveal landing-section-head-left">
        <span class="landing-kicker">${escapeHtml(section.kicker || "")}</span>
        ${createEditableMarkup(`${basePath}.title`, section.title || "", "h2")}
      </div>
      <ul class="bullet-list">${items}</ul>
    </section>
  `;
}

function renderTimeline(section, basePath) {
  const items = (section.items || [])
    .map(
      (item, index) => `
        <article class="timeline-item reveal">
          <span class="timeline-year">${escapeHtml(item.year || "")}</span>
          <div class="timeline-copy">
            ${createEditableMarkup(`${basePath}.items.${index}.body`, item.body || "", "p")}
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section class="landing-section">
      <div class="landing-section-head reveal landing-section-head-left">
        <span class="landing-kicker">${escapeHtml(section.kicker || "")}</span>
        ${createEditableMarkup(`${basePath}.title`, section.title || "", "h2")}
      </div>
      <div class="timeline-list">${items}</div>
    </section>
  `;
}

function renderFaq(section, basePath) {
  const items = (section.items || [])
    .map(
      (item, index) => `
        <details class="faq-item reveal">
          <summary>${escapeHtml(item.question || "")}</summary>
          ${createEditableMarkup(`${basePath}.items.${index}.answer`, item.answer || "", "p")}
        </details>
      `
    )
    .join("");

  return `
    <section class="landing-section">
      <div class="landing-section-head reveal landing-section-head-left">
        <span class="landing-kicker">${escapeHtml(section.kicker || "")}</span>
        ${createEditableMarkup(`${basePath}.title`, section.title || "", "h2")}
      </div>
      <div class="faq-list">${items}</div>
    </section>
  `;
}

function renderCta(section, basePath) {
  const actions = (section.actions || [])
    .map(
      (action) =>
        `<a href="${escapeHtml(action.href)}" class="btn ${action.secondary ? "btn-ghost light-ghost" : "btn-primary"}">${escapeHtml(action.label)}</a>`
    )
    .join("");

  return `
    <section class="landing-cta">
      <div class="landing-cta-inner reveal">
        <span class="landing-eyebrow light-eyebrow">${escapeHtml(section.kicker || "")}</span>
        ${createEditableMarkup(`${basePath}.title`, section.title || "", "h2")}
        ${createEditableMarkup(`${basePath}.body`, section.body || "", "p")}
        <div class="landing-hero-cta">${actions}</div>
      </div>
    </section>
  `;
}

function getSectionItems(section, data) {
  if (!section.source) return section.items || [];
  return data[section.source] || [];
}

function getSectionBasePath(sectionIndex) {
  return `sections.${sectionIndex}`;
}

function sectionRenderer(section, sectionIndex, data) {
  const basePath = getSectionBasePath(sectionIndex);
  if (section.layout === "story") return renderStory(section, basePath);
  if (section.layout === "stats") return renderStats(section, basePath);
  if (section.layout === "list") return renderList(section, basePath);
  if (section.layout === "timeline") return renderTimeline(section, basePath);
  if (section.layout === "faq") return renderFaq(section, basePath);
  if (section.layout === "cta") return renderCta(section, basePath);
  if (section.layout === "people") return renderPeople(section, getSectionItems(section, data), `${basePath}.items`);
  if (section.layout === "cards") return renderCards(section, getSectionItems(section, data), `${basePath}.items`);
  return "";
}

async function saveCurrentPage() {
  return;
}

async function saveRecord(type, record) {
  return record;
}

function bindInlineEditing() {
  return;
}

function setupScrollParallax() {
  const update = () => {
    document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}px`);
  };
  if (!window._rpaParallaxBound) {
    window.addEventListener("scroll", update, { passive: true });
    window._rpaParallaxBound = true;
  }
  update();
}

function openDistrictModal(district) {
  function closeModal(overlay) {
    overlay.remove();
    document.body.style.overflow = "";
  }

  const overlay = document.createElement("div");
  overlay.className = "district-modal-overlay";

  const nickBadge = district.nickname
    ? `<span class="district-modal-nickname">${escapeHtml(district.nickname)}</span>`
    : "";

  overlay.innerHTML = `
    <div class="district-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(district.name)} District">
      <img src="${escapeHtml(district.image)}" alt="${escapeHtml(district.name)} – ${escapeHtml(district.landmark)}" class="district-modal-image" />
      <button type="button" class="district-modal-close" aria-label="Close">×</button>
      <div class="district-modal-body">
        <h2>${escapeHtml(district.name)}</h2>
        ${nickBadge}
        <div class="district-modal-landmark">
          <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.27 7 13 7 13s7-7.73 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>
          <div class="district-modal-landmark-text">
            <strong>${escapeHtml(district.landmark)}</strong>
            <span>${escapeHtml(district.feature)}</span>
          </div>
        </div>
        <div class="district-modal-contact">
          <h4>District Body Contact</h4>
          <div class="district-contact-row">
            <svg viewBox="0 0 24 24"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 21a6 6 0 0 1 12 0H2Zm12 0a5 5 0 0 1 8 0h-8Z"/></svg>
            <span>District Coordinator: <strong>Appointment pending – Contact Head Office</strong></span>
          </div>
          <div class="district-contact-row">
            <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z"/></svg>
            <span>Phone: <strong>+91 9116 123 456 (RPA Head Office)</strong></span>
          </div>
          <div class="district-contact-row">
            <svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>
            <span>Email: <strong>districts@rajasthanpickleball.com</strong></span>
          </div>
          <div class="district-contact-row">
            <svg viewBox="0 0 24 24"><path d="M17.5 2h-11C5.12 2 4 3.12 4 4.5v15C4 20.88 5.12 22 6.5 22h11c1.38 0 2.5-1.12 2.5-2.5v-15C20 3.12 18.88 2 17.5 2Zm-5.5 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 14a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
            <span>WhatsApp: <strong>Available on request via Head Office</strong></span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  overlay.querySelector(".district-modal-close").addEventListener("click", () => closeModal(overlay));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay); });
  const onKey = (e) => { if (e.key === "Escape") { closeModal(overlay); document.removeEventListener("keydown", onKey); } };
  document.addEventListener("keydown", onKey);
}

function setupDistrictModals() {
  const districtMap = {};
  _districtData.forEach((d) => { districtMap[d.id] = d; });

  document.querySelectorAll("[data-district-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const district = districtMap[btn.getAttribute("data-district-id")];
      if (district) openDistrictModal(district);
    });
  });
}

function setupReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  elements.forEach((element) => observer.observe(element));
}

function setupTiltCards(selectors) {
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rx = (py - 0.5) * -8;
        const ry = (px - 0.5) * 10;
        card.style.setProperty("--tilt-x", `${rx.toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${ry.toFixed(2)}deg`);
        card.style.setProperty("--glow-x", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--glow-y", `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
        card.style.removeProperty("--glow-x");
        card.style.removeProperty("--glow-y");
      });
    });
  });
}

function setupVisualParallax(selector, xVar, yVar) {
  const visual = document.querySelector(selector);
  if (!visual) return;

  visual.addEventListener("pointermove", (event) => {
    const rect = visual.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    visual.style.setProperty(xVar, `${(px - 0.5) * 16}px`);
    visual.style.setProperty(yVar, `${(py - 0.5) * 12}px`);
  });

  visual.addEventListener("pointerleave", () => {
    visual.style.removeProperty(xVar);
    visual.style.removeProperty(yVar);
  });
}

function setupDynamicPage() {
  if (pageName === "about") {
    setupVisualParallax(".about-rpa-visual", "--about-x", "--about-y");
    setupTiltCards([".about-rpa-info", ".about-rpa-do-card", ".about-rpa-person-card", ".about-rpa-milestone"]);
    return;
  }

  if (pageName === "districts") {
    setupVisualParallax(".districts-rpa-visual", "--districts-x", "--districts-y");
    setupTiltCards([".districts-rpa-stat", ".districts-rpa-card", ".districts-rpa-roadmap-card"]);
    return;
  }

  if (pageName === "membership") {
    setupVisualParallax(".membership-rpa-visual", "--membership-x", "--membership-y");
    setupTiltCards([".membership-benefit-card", ".membership-register-card", ".membership-plan-card", ".membership-process-card"]);
    return;
  }

  if (pageName === "learn") {
    setupVisualParallax(".learn-rpa-visual", "--learn-x", "--learn-y");
    setupTiltCards([".learn-intro-card", ".learn-tutorial-card", ".learn-coach-card", ".learn-rulebook-card"]);
    return;
  }

  if (pageName === "shop") {
    setupVisualParallax(".shop-rpa-visual", "--shop-x", "--shop-y");
    setupTiltCards([".shop-product-card", ".shop-payment-panel"]);
    return;
  }

  if (pageName === "media") {
    setupVisualParallax(".media-rpa-visual", "--media-x", "--media-y");
    setupTiltCards([".media-gallery-card", ".media-feature-panel", ".media-press-card", ".membership-benefit-card"]);
    return;
  }

  if (pageName === "gallery") {
    setupVisualParallax(".media-rpa-visual", "--media-x", "--media-y");
    setupTiltCards([".media-gallery-card", ".media-feature-panel", ".media-press-card", ".gallery-event-image-card"]);
    return;
  }

  if (pageName === "contact") {
    setupVisualParallax(".contact-rpa-visual", "--contact-x", "--contact-y");
    setupTiltCards([".contact-rpa-card", ".contact-rpa-detail-row", ".card-shell"]);
  }
}

function setupGalleryLightbox() {
  const roots = document.querySelectorAll("[data-gallery-root]");
  if (!roots.length) return;

  const links = Array.from(document.querySelectorAll("[data-gallery-item]"));
  if (!links.length) return;

  const items = links
    .map((el) => ({
      src: el.getAttribute("data-gallery-src") || "",
      title: el.getAttribute("data-gallery-title") || "",
      href: el.getAttribute("href") || ""
    }))
    .filter((item) => item.src);

  if (!items.length) return;

  const overlay = document.createElement("div");
  overlay.className = "gallery-lightbox";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="gallery-lightbox__backdrop" data-gallery-close></div>
    <div class="gallery-lightbox__panel" role="dialog" aria-modal="true" aria-label="Gallery viewer">
      <button class="gallery-lightbox__close" type="button" aria-label="Close" data-gallery-close>×</button>
      <button class="gallery-lightbox__nav gallery-lightbox__prev" type="button" aria-label="Previous" data-gallery-prev>‹</button>
      <figure class="gallery-lightbox__figure">
        <img class="gallery-lightbox__img" alt="" />
        <figcaption class="gallery-lightbox__caption"></figcaption>
      </figure>
      <button class="gallery-lightbox__nav gallery-lightbox__next" type="button" aria-label="Next" data-gallery-next>›</button>
    </div>
  `;
  document.body.append(overlay);

  const img = overlay.querySelector(".gallery-lightbox__img");
  const caption = overlay.querySelector(".gallery-lightbox__caption");
  const closeEls = overlay.querySelectorAll("[data-gallery-close]");
  const prevBtn = overlay.querySelector("[data-gallery-prev]");
  const nextBtn = overlay.querySelector("[data-gallery-next]");

  let index = 0;

  function render() {
    const item = items[index];
    if (!item) return;
    img.src = item.src;
    img.alt = item.title || "Gallery image";
    caption.textContent = item.title || "";
  }

  function open(nextIndex) {
    index = Math.max(0, Math.min(items.length - 1, nextIndex));
    render();
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function prev() {
    open((index - 1 + items.length) % items.length);
  }

  function next() {
    open((index + 1) % items.length);
  }

  links.forEach((el, idx) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      open(idx);
    });
  });

  closeEls.forEach((el) => el.addEventListener("click", close));
  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);

  window.addEventListener("keydown", (event) => {
    if (overlay.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") prev();
    if (event.key === "ArrowRight") next();
  });

  const params = new URLSearchParams(window.location.search);
  const imgIndex = params.get("img");
  if (imgIndex != null) {
    const asNumber = Number(imgIndex);
    if (Number.isFinite(asNumber)) {
      open(Math.max(0, Math.min(items.length - 1, Math.trunc(asNumber))));
    }
  }
}

async function loadPage() {
  try {
    const data = getLocalBootstrap(pageName);
    currentSession = getLocalSession();
    currentPage = data.page;
    currentData = data;
    renderPage();
    maybeShowAuthPrompt(currentSession);
  } catch (error) {
    root.innerHTML = renderErrorPage(error?.message || "Unknown load error");
    console.error("Failed to load page:", error);
  } finally {
    // Loader intentionally disabled.
  }
}

function renderPage() {
  renderAuthActions(currentSession);
  if (footerBlurb) {
    footerBlurb.textContent =
      currentPage?.footerBlurb || "Official home for district growth, tournaments, and public communication across Rajasthan.";
  }
  if (pageName === "about") {
    root.innerHTML = renderAboutCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    return;
  }
  if (pageName === "tournaments") {
    root.innerHTML = renderTournamentsCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    return;
  }
  if (pageName === "calendar") {
    root.innerHTML = renderAnnualCalendarPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    return;
  }
  if (pageName === "membership") {
    root.innerHTML = renderMembershipCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    return;
  }
  if (pageName === "learn") {
    root.innerHTML = renderLearnCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    return;
  }
  if (pageName === "shop") {
    root.innerHTML = renderShopCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    return;
  }
  if (pageName === "districts") {
    root.innerHTML = renderDistrictsCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    setupScrollParallax();
    setupDistrictModals();
    return;
  }
  if (pageName === "media" || pageName === "news") {
    root.innerHTML = renderMediaCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    setupGalleryLightbox();
    return;
  }
  if (pageName === "gallery") {
    root.innerHTML = renderGalleryEventsPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    setupGalleryLightbox();
    return;
  }
  if (pageName === "contact") {
    root.innerHTML = renderContactCustomPage(currentPage, currentData);
    setupReveal();
    setupDynamicPage();
    setupGalleryLightbox();
    return;
  }
  const sections = (currentPage.sections || [])
    .map((section, index) => sectionRenderer(section, index, currentData))
    .join("");
  root.innerHTML = `${renderPageHero(currentPage.hero)}${sections}`;
  setupReveal();
  setupDynamicPage();
}

function rerenderPage() {
  renderPage();
}

if (root && pageName) {
  loadPage().catch(() => {
    root.innerHTML = `
      <section class="landing-section">
        <div class="landing-section-head landing-section-head-left">
          <span class="landing-kicker">Content Error</span>
          <h2>We could not load this page right now.</h2>
          <p>Please check that the local content file loaded and try again.</p>
        </div>
      </section>
    `;
  });
}

navToggle?.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  navLinks?.classList.toggle("is-open", !expanded);
  authActions?.classList.toggle("is-open", !expanded);
});
