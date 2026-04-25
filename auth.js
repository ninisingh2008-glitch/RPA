const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");
const accountPanel = document.getElementById("accountPanel");
const accountHeading = document.getElementById("accountHeading");
const accountCopy = document.getElementById("accountCopy");
const accountAction = document.getElementById("accountAction");
const logoutButton = document.getElementById("logoutButton");

function setMode(mode) {
  const loginActive = mode === "login";
  loginTab.classList.toggle("is-active", loginActive);
  signupTab.classList.toggle("is-active", !loginActive);
  loginForm.hidden = !loginActive;
  signupForm.hidden = loginActive;
}

function showAccount(user) {
  accountPanel.hidden = false;
  accountHeading.textContent = "You're signed in.";
  accountCopy.textContent = "Your account is active and ready for platform updates, membership benefits, and future member features.";
  accountAction.textContent = "Go to Site";
  accountAction.href = "index.html";
}

function saveLocalUser(user) {
  window.localStorage.setItem("rpaUser", JSON.stringify(user));
}

function getLocalUser() {
  try {
    return JSON.parse(window.localStorage.getItem("rpaUser") || "null");
  } catch {
    return null;
  }
}

loginTab?.addEventListener("click", () => setMode("login"));
signupTab?.addEventListener("click", () => setMode("signup"));

if (window.location.hash === "#signup") {
  setMode("signup");
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const form = new FormData(loginForm);
  const identifier = String(form.get("identifier") || "").trim();
  if (!identifier) {
    loginMessage.textContent = "Enter a username or email.";
    return;
  }

  const user = {
    fullName: identifier.includes("@") ? identifier.split("@")[0] : identifier,
    username: identifier,
    email: identifier.includes("@") ? identifier : "",
    role: "member"
  };
  saveLocalUser(user);
  showAccount(user);
});

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  signupMessage.textContent = "";
  const form = new FormData(signupForm);
  const user = {
    fullName: String(form.get("fullName") || "").trim(),
    username: String(form.get("username") || "").trim(),
    email: String(form.get("email") || "").trim(),
    role: "member"
  };
  saveLocalUser(user);
  signupMessage.textContent = "Account created on this browser.";
  signupForm.reset();
  showAccount(user);
});

logoutButton?.addEventListener("click", async () => {
  window.localStorage.removeItem("rpaUser");
  window.location.reload();
});

async function checkSession() {
  const user = getLocalUser();
  if (user) showAccount(user);
}

checkSession();
