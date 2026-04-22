// Rajasthan Pickleball Association — small UI helpers

// 1. Mobile nav toggle
const nav = document.querySelector(".nav");
const navToggle = document.getElementById("navToggle");
if (navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  // Close menu after tapping a link
  nav.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );
}

// 2. Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// 3. Reveal-on-scroll for cards/sections.
//    We only hide elements once we know IntersectionObserver is supported,
//    so users without JS still see all content.
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  document
    .querySelectorAll(".feature, .event, .card, .news")
    .forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
}
