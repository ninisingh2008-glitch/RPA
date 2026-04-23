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

loginTab?.addEventListener("click", () => setMode("login"));
signupTab?.addEventListener("click", () => setMode("signup"));

if (window.location.hash === "#signup") {
  setMode("signup");
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const form = new FormData(loginForm);
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: form.get("identifier"),
      password: form.get("password")
    })
  });
  const data = await response.json();
  if (!response.ok) {
    loginMessage.textContent = data.error || "Unable to login.";
    return;
  }
  showAccount(data.user);
});

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  signupMessage.textContent = "";
  const form = new FormData(signupForm);
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: form.get("fullName"),
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password")
    })
  });
  const data = await response.json();
  if (!response.ok) {
    signupMessage.textContent = data.error || "Unable to create account.";
    return;
  }
  signupMessage.textContent = "Account created. You can log in now.";
  signupForm.reset();
  setMode("login");
});

logoutButton?.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.reload();
});

async function checkSession() {
  const response = await fetch("/api/auth/me");
  const data = await response.json();
  if (data.authenticated && data.user) {
    showAccount(data.user);
  }
}

checkSession();
