const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const root = document.getElementById("home-root");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("landingNavLinks");
const authActions = document.getElementById("landingAuth");
const footerBlurb = document.getElementById("homeFooterBlurb");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value, options) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

function formatRange(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  const day = formatDate(value, { day: "2-digit" });
  const month = formatDate(value, { month: "short" });
  const year = formatDate(value, { year: "numeric" });
  return `${day} ${month}, ${year}`;
}

function highlightActiveNav() {
  navLinks?.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === "index.html") {
      link.classList.add("is-active");
    }
  });
}

function setupNav() {
  if (!navToggle || !navLinks || !authActions) return;

  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("is-open", !expanded);
    authActions.classList.toggle("is-open", !expanded);
  });

  [...navLinks.querySelectorAll("a"), ...authActions.querySelectorAll("a")].forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
      authActions.classList.remove("is-open");
    });
  });
}

function setupReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
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
    { threshold: 0.08, rootMargin: "0px 0px -48px 0px" }
  );

  elements.forEach((element) => observer.observe(element));
}

function setupCountUp() {
  const values = document.querySelectorAll(".rpa-stat-card strong");
  if (!values.length || !("IntersectionObserver" in window)) return;

  const animateValue = (element) => {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";
    const raw = element.textContent.trim();
    const target = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(target)) return;
    const suffix = raw.replace(String(target), "");
    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateValue(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  values.forEach((value) => observer.observe(value));
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

function setupHeroParallax() {
  const hero = document.querySelector(".rpa-hero-visual");
  if (!hero) return;

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    hero.style.setProperty("--hero-x", `${(px - 0.5) * 18}px`);
    hero.style.setProperty("--hero-y", `${(py - 0.5) * 14}px`);
  });

  hero.addEventListener("pointerleave", () => {
    hero.style.removeProperty("--hero-x");
    hero.style.removeProperty("--hero-y");
  });
}

function setupDynamicHome() {
  setupCountUp();
  setupHeroParallax();
  setupTiltCards([".rpa-tournament-card", ".rpa-feature-card", ".rpa-gallery-card", ".rpa-testimonial-card"]);
}

function renderAuth(session) {
  if (!authActions) return;

  if (!session?.authenticated) {
    authActions.innerHTML = '<a href="membership.html" class="btn btn-primary">Become a Member</a>';
    return;
  }

  const name = escapeHtml(session.user?.fullName || session.user?.username || "Member");
  const dashboardHref = "auth.html";
  const dashboardLabel = `Hi, ${name}`;

  authActions.innerHTML = `
    <a href="${dashboardHref}" class="btn btn-primary">${dashboardLabel}</a>
    <button type="button" class="btn btn-ghost" id="logoutBtn">Logout</button>
  `;

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  });
}

function iconMarkup(icon) {
  const icons = {
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.27 7 13 7 13s7-7.73 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>',
    people:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 21a6 6 0 0 1 12 0H2Zm12 0a5 5 0 0 1 8 0h-8Z"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v3H7V2Zm8 0h2v3h-2V2ZM4 5h16a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Zm0 5v10h16V10H4Zm3 3h4v4H7v-4Z"/></svg>',
    clinics:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3a2 2 0 0 1 2 2v4a3 3 0 1 1-2 0V5h10v4a3 3 0 1 1-2 0V3H7Zm5 10 6 8h-3l-3-4-3 4H6l6-8Z"/></svg>',
    community:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM4 21a8 8 0 0 1 16 0H4Zm14-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>',
    trophy:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v4a6 6 0 0 1-5 5.91V16h4v2H7v-2h4v-3.09A6 6 0 0 1 6 7V3Zm-3 1h3v2a3 3 0 0 1-3 3V4Zm18 0v5a3 3 0 0 1-3-3V4h3Z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h2v20H6V2Zm3 2h9l-2 4 2 4H9V4Z"/></svg>',
    quote:
      '<svg viewBox="0 0 32 24" aria-hidden="true"><path d="M13 0C7.48 0 3 4.48 3 10v11h10V11H8c.55-3.3 2.4-5 5-5V0Zm16 0c-5.52 0-10 4.48-10 10v11h10V11h-5c.55-3.3 2.4-5 5-5V0Z"/></svg>'
  };

  return icons[icon] || icons.map;
}

function renderTournamentCards(tournaments) {
  const fallback = [
    { name: "Jaipur Open 2025", city: "Jaipur, Rajasthan", date: "2025-07-18", venue: "SMS Sports Hub" },
    { name: "Udaipur Championship", city: "Udaipur, Rajasthan", date: "2025-08-08", venue: "Lakecity Arena" },
    { name: "Jodhpur Smash 2025", city: "Jodhpur, Rajasthan", date: "2025-09-19", venue: "Blue City Club" }
  ];

  const palette = ["pink", "amber", "teal"];
  const fallbackImages = [
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&fm=jpg&q=80&w=1200",
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&fm=jpg&q=80&w=1200"
  ];

  return (tournaments?.length ? tournaments : fallback)
    .slice(0, 3)
    .map((event, index) => {
      const tone = palette[index % palette.length];
      const image = event.image || fallbackImages[index % fallbackImages.length];
      return `
        <article class="rpa-tournament-card reveal rpa-tournament-card--${tone}">
          <a href="tournaments.html?id=${encodeURIComponent(recordKey(event, index))}" class="rpa-home-card-link">
          <div class="rpa-card-illustration">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(event.name || "Tournament image")}" class="rpa-tournament-image" />
          </div>
          <div class="rpa-tournament-copy">
            <h3>${escapeHtml(event.name || "Upcoming Tournament")}</h3>
            <p>${escapeHtml(formatRange(event.date))}</p>
            <span>${escapeHtml(event.city || event.venue || "Rajasthan")}</span>
          </div>
          </a>
        </article>
      `;
    })
    .join("");
}

function renderFeatureCards(features) {
  const fallback = [
    { title: "Grassroots Clinics", body: "Introductory sessions in schools, parks and communities to build the next generation.", icon: "clinics" },
    { title: "Coaching & Community", body: "Coaching programs and an inclusive community for all age groups.", icon: "community" },
    { title: "Tournaments", body: "Organising sanctioned tournaments that inspire competition and growth.", icon: "trophy" },
    { title: "State Selection Pathway", body: "Structured trials and selection for IPA National representation.", icon: "flag" }
  ];

  return (features?.length ? features : fallback)
    .slice(0, 4)
    .map(
      (feature) => `
        <article class="rpa-feature-card reveal">
          <div class="rpa-feature-icon">${iconMarkup(feature.icon)}</div>
          <h3>${escapeHtml(feature.title || "")}</h3>
          <p>${escapeHtml(feature.body || "")}</p>
        </article>
      `
    )
    .join("");
}

function recordKey(record, fallback = "") {
  return record?.slug || record?.id || String(record?.title || record?.name || fallback || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function renderGallery(galleryEvents) {
  const fallback = [
    {
      title: "Pickleball match on blue court",
      image:
        "https://images.unsplash.com/photo-1761644658016-324918bc373c?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    },
    {
      title: "Player training on court",
      image:
        "https://images.unsplash.com/photo-1756477558468-b3e485757470?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    },
    {
      title: "Youth community sports session",
      image:
        "https://images.unsplash.com/photo-1761039807430-a42c4e260acd?auto=format&fit=crop&fm=jpg&q=80&w=1200"
    }
  ];

  return (galleryEvents?.length ? galleryEvents : fallback)
    .slice(0, 3)
    .map(
      (item, index) => `
        <a href="news.html?id=${encodeURIComponent(recordKey(item, index))}" class="rpa-gallery-card reveal rpa-gallery-card--${(index % 4) + 1}">
          <img
            src="${escapeHtml(item.coverImage || item.image || fallback[index % fallback.length].image)}"
            alt="${escapeHtml(item.title || item.summary || "Community action image")}"
            class="rpa-gallery-image"
            loading="lazy"
          />
        </a>
      `
    )
    .join("");
}

function renderTestimonials() {
  const testimonials = [
    {
      quote:
        "Pickleball has brought our family closer and given our kids a sport that is fun, inclusive and full of opportunities.",
      name: "Neha Sharma",
      meta: "Parent & Member, Jaipur"
    },
    {
      quote:
        "The events feel organised, welcoming and easy to follow. It finally feels like Rajasthan has a proper pickleball home.",
      name: "Rahul Mehta",
      meta: "Tournament Player, Udaipur"
    },
    {
      quote:
        "Our district players now have a visible pathway into bigger competitions, and that has changed local energy completely.",
      name: "Kavita Rathore",
      meta: "Community Organiser, Jodhpur"
    }
  ];

  return [...testimonials, ...testimonials]
    .map(
      (item) => `
        <article class="rpa-testimonial-card">
          <div class="rpa-testimonial-mark">${iconMarkup("quote")}</div>
          <p>${escapeHtml(item.quote)}</p>
          <div class="rpa-testimonial-person">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <span>${escapeHtml(item.meta)}</span>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function cityIconMarkup(variant) {
  const icons = {
    1: `
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <path d="M3 24h66" />
        <path d="M8 24V12h9v-3h6v3h8V8h10v4h8V9h6v3h9v12" />
        <path d="M20 9V6h8v3M44 9V6h8v3" />
      </svg>
    `,
    2: `
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <path d="M3 24h66" />
        <path d="M8 24V15h10l4-7 4 7h10v-4h8v4h9l4-7 4 7h7v9" />
        <path d="M18 15v-3M54 15v-3" />
      </svg>
    `,
    3: `
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <path d="M3 24h66" />
        <path d="M9 24V13h8V9h7v4h10V7h4v6h10V9h7v4h8v11" />
        <path d="M34 7c0-3 4-5 4-5s4 2 4 5" />
      </svg>
    `,
    4: `
      <svg viewBox="0 0 72 28" aria-hidden="true">
        <path d="M3 24h66" />
        <path d="M8 24V15h12v-3c0-3 3-5 6-5s6 2 6 5v3h8v-3c0-3 3-5 6-5s6 2 6 5v3h10v9" />
        <path d="M20 12h12M40 12h12" />
      </svg>
    `
  };

  return icons[variant] || icons[1];
}

function renderCities() {
  const cities = ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer", "Bikaner", "Alwar", "Sikar", "Sri Ganganagar"];
  const loop = [...cities, ...cities];
  return loop
    .map(
      (city, index) => `
        <span class="rpa-city-pill">
          <span class="rpa-city-icon" aria-hidden="true">${cityIconMarkup((index % 4) + 1)}</span>
          ${city}
        </span>
      `
    )
    .join("");
}

function renderHome(data) {
  const page = data.page || {};
  const hero = page.hero || {};
  const stats = hero.stats || [];

  root.innerHTML = `
    <section class="rpa-shell">
      <div class="rpa-surface">
        <section class="rpa-hero reveal">
          <div class="rpa-hero-copy">
            <span class="rpa-pill">${escapeHtml(hero.eyebrow || "Affiliated with the Indian Pickleball Association")}</span>
            <h1>
              Rajasthan's
              <span>home of</span>
              <span class="rpa-wordmark-row">
                <em>pickleball.</em>
                <img src="assets/Ball.png" alt="" class="rpa-wordmark-ball" />
              </span>
            </h1>
            <p>${escapeHtml(
              hero.description ||
                "We promote, organise and grow the fastest-rising paddle sport in India from grassroots clinics to state selection trials."
            )}</p>
            <div class="rpa-hero-actions">
              <a href="tournaments.html" class="btn btn-primary">Upcoming Tournaments</a>
              <a href="membership.html" class="btn btn-ghost">Join the Association</a>
            </div>
          </div>

          <div class="rpa-hero-visual" aria-hidden="true">
            <img src="assets/Index Main Image.png" alt="" class="rpa-hero-image" />
            <div class="rpa-orbit-badge">
              <img src="assets/logo.jpeg" alt="" class="rpa-orbit-logo" />
            </div>
          </div>
        </section>

        <section class="rpa-stats">
          ${stats
            .map((stat, index) => {
              const icons = ["map", "people", "calendar"];
              return `
                <article class="rpa-stat-card reveal">
                  <div class="rpa-stat-icon">${iconMarkup(icons[index] || "map")}</div>
                  <div>
                    <strong>${escapeHtml(stat.value || "")}</strong>
                    <span>${escapeHtml(stat.label || "")}</span>
                  </div>
                </article>
              `;
            })
            .join("")}
        </section>

        <section class="rpa-section-grid">
          <div class="rpa-block">
            <div class="rpa-section-head">
              <span></span>
              <h2>Upcoming Tournaments</h2>
              <a href="tournaments.html">View all tournaments</a>
            </div>
            <div class="rpa-tournament-grid">
              ${renderTournamentCards(data.tournaments || [])}
            </div>
          </div>

          <div class="rpa-block">
            <div class="rpa-section-head">
              <span></span>
              <h2>What We Do</h2>
            </div>
            <div class="rpa-feature-grid">
              ${renderFeatureCards(page.features || [])}
            </div>
          </div>
        </section>

        <section class="rpa-city-strip reveal">
          <div class="rpa-city-title">A Community Across Rajasthan</div>
          <div class="rpa-city-marquee">
            <div class="rpa-city-list">${renderCities()}</div>
          </div>
        </section>

        <section class="rpa-section-grid rpa-section-grid--bottom">
          <div class="rpa-block">
            <div class="rpa-section-head">
              <span></span>
              <h2>Our Community In Action</h2>
              <a href="news.html">View gallery</a>
            </div>
            <div class="rpa-gallery-grid">
              ${renderGallery(data.galleryEvents || data.news || [])}
            </div>
          </div>

          <div class="rpa-block">
            <div class="rpa-section-head">
              <span></span>
              <h2>Voices From Our Community</h2>
            </div>
            <div class="rpa-testimonial-marquee reveal">
              <div class="rpa-testimonial-track">
                ${renderTestimonials()}
              </div>
            </div>
          </div>
        </section>

        <section class="rpa-banner reveal">
          <img src="assets/Ball.png" alt="" class="rpa-banner-ball" />
          <div>
            <h2>Be a part of Rajasthan's pickleball movement.</h2>
            <p>Join as a member or register for upcoming events today.</p>
          </div>
          <div class="rpa-banner-actions">
            <a href="membership.html" class="btn btn-light">Become a Member</a>
            <a href="tournaments.html" class="btn btn-outline-light">Register for Events</a>
          </div>
        </section>
      </div>
    </section>
  `;

  if (footerBlurb) {
    footerBlurb.textContent =
      page.footerBlurb || "Official home for tournaments, district growth and public communication across Rajasthan.";
  }

  setupReveal();
  setupDynamicHome();
}

async function loadHome() {
  if (!root) return;

  try {
    const [bootstrapRes, sessionRes] = await Promise.all([
      fetch("/api/public/bootstrap?page=home"),
      fetch("/api/auth/me")
    ]);

    if (!bootstrapRes.ok) throw new Error("Could not load home content.");

    const [bootstrap, session] = await Promise.all([bootstrapRes.json(), sessionRes.json()]);
    renderAuth(session);
    renderHome(bootstrap);
  } catch {
    root.innerHTML = `
      <section class="rpa-shell">
        <div class="rpa-surface">
          <section class="rpa-empty-state">
            <span class="rpa-pill">Content Error</span>
            <h1>We could not load the home page right now.</h1>
            <p>Please refresh in a moment. If this keeps happening, the live content service may be unavailable.</p>
          </section>
        </div>
      </section>
    `;
  }
}

highlightActiveNav();
setupNav();
loadHome();
