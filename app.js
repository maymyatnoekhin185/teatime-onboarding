// TeaTime onboarding v2.1 — hash router, Home feed template and screen behaviour.

const GRID_PHOTOS = ["birthday", "beach", "newborn", "dog", "roses", "dinner", "trophy", "drawing"];

// Home feed screens share one layout; only the moment and the status change.
const FEEDS = {
  a4: { photo: "newborn", tv: "TV on", dot: "green", meta: "25 December 2025 · 9 photos", caption: null, count: "1 / 9", pill: "Adding 38 of 128 photos" },
  a5: { photo: "newborn", tv: "Lisa’s TV on", dot: "green", meta: "25 December 2025 · 9 photos", caption: null, count: "1 / 9" },
  a6: { photo: "birthday", tv: "Lisa’s TV on", dot: "green", meta: "Just now · 6 photos", caption: "Lily’s 6th birthday 🎂", count: "1 / 6" },
  b7: { photo: "roses", tv: "No TV yet", dot: "grey", meta: "24 December 2025 · 6 photos", caption: null, count: "1 / 6", pill: "" },
  b8: { photo: "roses", tv: "", dot: "green", meta: "24 December 2025 · 6 photos", caption: null, count: "1 / 6", push: true },
  // Row D: shared with "+" before any TV. The pill and "No TV yet" both open Which TV.
  d4: { photo: "roses", tv: "No TV yet", dot: "grey", meta: "Just now · 3 photos", caption: null, count: "1 / 3", pill: "Waiting for a TV", dots: 3, toWhichTv: true, connectSheet: true },
  d5: { photo: "roses", tv: "TV on", dot: "green", meta: "Just now · 3 photos", caption: null, count: "1 / 3", dots: 3, nudge: true },
};

const ROUTES = [
  "tv", "a1", "a2", "a3", "a4", "a5", "a6",
  "b1", "b-a2", "b2", "b3", "b4", "b5", "b6", "b7", "b8",
  "c1", "c2", "c3", "photos-off", "all-photos", "picker", "moment",
  "d1", "d3", "d4", "d5",
];
// Routes drawn by another screen's section (D3 is D4 with the "connect a TV" sheet up).
const SECTION_OF = { "b-a2": "a2", d3: "d4" };
const STORE_KEY = "teatime.setup";
const SESSION_KEY = "teatime.session";
const FAMILY_CODE = "482917"; // placeholder until the family-code service exists

const device = document.querySelector(".device");
const toastEl = document.querySelector(".toast");
let timers = [];

/* ---------- Build repeated markup ---------- */

function buildGrids() {
  const tiles = GRID_PHOTOS.map(
    (name) => `<div><img src="assets/photo-${name}.png" alt="" loading="lazy" decoding="async"></div>`
  ).join("");
  document.querySelectorAll("[data-grid]").forEach((grid) => {
    grid.innerHTML = tiles + `<button class="moments-more" type="button" data-go="all-photos">+120</button>`;
  });
}

function feedMarkup(id, f) {
  const caption = f.caption
    ? `<p class="caption">${f.caption}</p>`
    : `<button class="caption" type="button" data-todo="Adding a caption">Add a caption</button>`;
  return `
    <section class="screen feed" data-screen="${id}" hidden aria-labelledby="${id}-title">
      <img class="feed-photo" src="assets/photo-${f.photo}.png" alt="" loading="lazy" decoding="async" data-feed-photo>
      <div class="feed-shade"></div>
      <div class="home-header">
        <div class="home-title-row">
          <h1 id="${id}-title" class="home-title" tabindex="-1">Your moments</h1>
          <button type="button" aria-label="Switch group" data-todo="Switching groups"><img src="assets/icon-chevron-down.svg" alt=""></button>
        </div>
        <div class="home-status-row">
          ${f.toWhichTv
            ? `<button class="tv-chip" type="button" data-go="b3"><img src="assets/status-dot-${f.dot}.svg" alt=""><span data-tv-label>${f.tv}</span></button>`
            : `<span class="tv-chip"><img src="assets/status-dot-${f.dot}.svg" alt=""><span data-tv-label>${f.tv}</span></span>`}
          <span class="members">·  Just you</span>
        </div>
      </div>
      ${f.pill === undefined ? "" : f.toWhichTv
        ? `<button class="glass-pill left" type="button" data-go="b3" data-pill>${f.pill}</button>`
        : `<p class="glass-pill left" data-pill>${f.pill}</p>`}
      ${f.nudge ? `
      <div class="nudge">
        <span class="nudge-text"><span class="nudge-title">Invite your family</span><span class="nudge-sub">They can send photos too.</span></span>
        <button class="nudge-btn" type="button" data-invite>Invite</button>
      </div>` : ""}
      <p class="glass-pill right${f.nudge ? " low" : ""}" data-count>${f.count}</p>
      <img class="pagination${f.dots === 3 ? " dots-3" : ""}" src="assets/pagination-${f.dots || 5}.svg" alt="">
      <div class="action-rail">
        <button type="button" data-todo="Likes"><img src="assets/icon-heart.svg" alt="">0<span class="sr-only"> likes</span></button>
        <button type="button" aria-label="Comments" data-todo="Comments"><img src="assets/icon-message-circle.svg" alt=""></button>
        <button type="button" data-todo="Saving to the phone"><img src="assets/icon-download.svg" alt="">Save</button>
        <button type="button" aria-label="More" data-todo="More options"><img src="assets/icon-more-horizontal.svg" alt=""></button>
      </div>
      <div class="caption-panel">
        <div class="author-row">
          <span class="avatar-ring"><img src="assets/avatar-sarah.png" alt=""></span>
          <span class="author"><span class="author-name" data-author>Sarah Johnson</span><span class="author-meta" data-meta>${f.meta}</span></span>
        </div>
        <div data-caption-slot>${caption}</div>
      </div>
      <nav class="nav-pill" aria-label="Main">
        <button class="nav-item" type="button" aria-label="Home" aria-current="page"><span class="nav-icon-home" aria-hidden="true"></span></button>
        <button class="nav-item" type="button" aria-label="Family" data-todo="Family"><img src="assets/nav-users.svg" alt=""></button>
        <button class="nav-share" type="button" aria-label="Share a moment" data-picker><img src="assets/icon-plus.svg" alt=""></button>
        <button class="nav-bell" type="button" aria-label="Notifications" data-todo="Notifications"><img class="bell" src="assets/icon-bell.svg" alt=""><img class="dot" src="assets/nav-active-dot.svg" alt=""></button>
        <button class="nav-item" type="button" aria-label="Profile" data-todo="Profile"><img src="assets/nav-user.svg" alt=""></button>
      </nav>
      ${f.push ? `
      <button class="push" type="button" data-push aria-label="Notification">
        <span class="push-icon"><img src="assets/push-logo.svg" alt=""></span>
        <span class="push-text">
          <span class="push-title-row"><span class="push-title">TeaTime</span><span class="push-time">now</span></span>
          <span class="push-body" data-push-body></span>
        </span>
      </button>` : ""}
      ${f.connectSheet ? `
      <div class="connect-layer" data-connect-sheet hidden>
        <div class="connect-dim" data-connect-close></div>
        <div class="connect-sheet" role="dialog" aria-modal="true" aria-labelledby="${id}-sheet-title">
          <span class="connect-grabber" aria-hidden="true"></span>
          <span class="spacer-10"></span>
          <h2 id="${id}-sheet-title" class="title1">Shared. Now connect a TV</h2>
          <p class="body-small">Your moment is saved. It plays as soon as a TV is connected.</p>
          <span class="spacer-12"></span>
          <button class="btn btn-primary btn-glass-edge" type="button" data-go="b3">Connect a TV</button>
        </div>
      </div>` : ""}
    </section>`;
}

function buildFeeds() {
  const html = Object.entries(FEEDS).map(([id, f]) => feedMarkup(id, f)).join("");
  toastEl.insertAdjacentHTML("beforebegin", html);
}

/* ---------- Session: which path, phone number, name (kept across refreshes) ---------- */

function loadSession() {
  try {
    return { path: "a", phone: "", first: "Sarah", last: "Johnson", ...JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}") };
  } catch {
    return { path: "a", phone: "", first: "Sarah", last: "Johnson" };
  }
}

function saveSession(patch) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...loadSession(), ...patch })); } catch { /* private mode */ }
}

const fullName = () => { const s = loadSession(); return `${s.first} ${s.last}`.trim() || "You"; };
const signInScreen = () => (loadSession().path === "b" ? "b1" : "a1");
const photoPrompt = () => (loadSession().path === "b" ? "b-a2" : "a2");

/* ---------- Set-up details (B5 → B6–B8), kept across refreshes ---------- */

function loadSetup() {
  try {
    return { who: "Mum", tv: "Google TV", ...JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { who: "Mum", tv: "Google TV" };
  }
}

function saveSetup(setup) {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(setup)); } catch { /* private mode: keep in memory only */ }
}

const STORE_NAMES = { "Google TV": "app store", "Android TV": "Play Store", "Amazon Fire TV": "Appstore", "Apple TV": "App Store" };

function setupText({ who, tv }) {
  const name = who.trim();
  const store = STORE_NAMES[tv] || "app store";
  return {
    title: name ? `Send this to ${name}` : "Send the set-up",
    greeting: `${name ? name + ", I" : "I"} have put 128 of our photos on TeaTime for your TV.`,
    steps: [`1. On your TV, open the ${store} and search TeaTime.`, "2. Open it and choose Got a code.", "3. Type 7351"],
    sign: `${loadSession().first || "Me"} x`,
    waiting: `Waiting for ${name ? name + "’s" : "their"} TV`,
    connectedLabel: `${name ? name + "’s" : "Their"} TV on`,
    push: name === "Mum"
      ? "Mum’s TV is connected. Her 27 moments are playing."
      : `${name ? name + "’s" : "Their"} TV is connected. 27 moments are playing.`,
  };
}

function initSetupForm() {
  const form = document.getElementById("setup-form");
  const setup = loadSetup();
  form.who.value = setup.who;
  form.tv.value = setup.tv;
  form.addEventListener("input", () => saveSetup({ who: form.who.value, tv: form.tv.value }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveSetup({ who: form.who.value, tv: form.tv.value });
    go("b6");
  });
}

/* ---------- Sign in: Apple / Google sheets and the phone number path ---------- */

const PROVIDER = { apple: "Apple", google: "Google" };

function openSheet(provider) {
  closeSheet();
  const layer = device.querySelector(`[data-sheet="${provider}"]`);
  layer.hidden = false;
  layer.querySelector("button")?.focus({ preventScroll: true });
}

function closeSheet() {
  device.querySelectorAll("[data-sheet]").forEach((l) => { l.hidden = true; });
}

function resetSigningIn(screen) {
  screen.querySelectorAll("[data-signin]").forEach((b) => {
    b.querySelector("[data-label]").textContent = `Continue with ${PROVIDER[b.dataset.signin]}`;
  });
  screen.querySelectorAll(".is-dimmed").forEach((el) => el.classList.remove("is-dimmed"));
  screen.querySelector(".actions")?.removeAttribute("aria-busy");
}

function startSigningIn(provider) {
  closeSheet();
  const screen = device.querySelector(`[data-screen="${signInScreen()}"]`);
  const actions = screen.querySelector(".actions");
  actions.setAttribute("aria-busy", "true");
  [...actions.children].forEach((el) => {
    if (el.dataset.signin === provider) el.querySelector("[data-label]").textContent = `Signing in with ${PROVIDER[provider]}…`;
    else el.classList.add("is-dimmed");
  });
  later(() => {
    if (!navigator.onLine) {
      // Real failure case: toast for a few seconds, buttons ready again.
      resetSigningIn(screen);
      toast(`Couldn’t sign in with ${PROVIDER[provider]}. Try again.`);
      return;
    }
    saveSession({ first: "Sarah", last: "Johnson" });
    go(photoPrompt());
  }, 1400);
}

// Swipe a sheet down to close it, like the phone’s own sheets (the connect sheet means “later”).
function initSheetSwipe() {
  device.querySelectorAll(".system-sheet, .connect-sheet").forEach((sheet) => {
    let startY = null;
    sheet.addEventListener("pointerdown", (e) => { if (!e.target.closest("button")) startY = e.clientY; });
    sheet.addEventListener("pointermove", (e) => {
      if (startY === null) return;
      sheet.style.transform = `translateY(${Math.max(0, e.clientY - startY)}px)`;
    });
    const end = (e) => {
      if (startY === null) return;
      const moved = e.clientY - startY;
      startY = null;
      sheet.style.transform = "";
      if (moved > 80) sheet.classList.contains("connect-sheet") ? go("d4", { replace: true }) : closeSheet();
    };
    sheet.addEventListener("pointerup", end);
    sheet.addEventListener("pointercancel", end);
  });
}

function initPhoneForms() {
  const phoneForm = document.getElementById("phone-form");
  const codeForm = document.getElementById("code-form");
  const nameForm = document.getElementById("name-form");
  const digits = (v) => v.replace(/\D/g, "");

  phoneForm.phone.value = loadSession().phone;
  const checkPhone = () => { phoneForm.querySelector("[type=submit]").disabled = digits(phoneForm.phone.value).length < 9; };
  phoneForm.addEventListener("input", () => { saveSession({ phone: phoneForm.phone.value.trim() }); checkPhone(); });
  phoneForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (digits(phoneForm.phone.value).length >= 9) go("c2");
  });
  checkPhone();

  const boxes = [...codeForm.querySelectorAll(".code-box")];
  const paintCode = () => {
    const code = digits(codeForm.code.value).slice(0, 6);
    codeForm.code.value = code;
    boxes.forEach((b, i) => {
      b.textContent = code[i] || "";
      b.classList.toggle("is-active", i === Math.min(code.length, 5));
    });
    codeForm.querySelector("[type=submit]").disabled = code.length < 6;
  };
  codeForm.code.addEventListener("input", paintCode);
  codeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // New numbers are asked for a name; a known number would go straight to Home.
    if (codeForm.code.value.length === 6) go("c3");
  });
  codeForm.querySelector("[data-resend]").addEventListener("click", () => {
    codeForm.code.value = "";
    paintCode();
    codeForm.code.focus();
    toast(`New code sent to ${loadSession().phone || "your phone"}`);
  });
  paintCode();

  const checkName = () => { nameForm.querySelector("[type=submit]").disabled = !nameForm.first.value.trim(); };
  nameForm.addEventListener("input", checkName);
  nameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!nameForm.first.value.trim()) return;
    saveSession({ first: nameForm.first.value.trim(), last: nameForm.last.value.trim() });
    go(photoPrompt());
  });
  checkName();
}

/* ---------- Photos: all 128, the picker, and the New moment screen ---------- */

const TOTAL_FOUND = 128;
const PICK_LIMIT = 10;
const ALL_PHOTO_MONTHS = [
  { label: "December 2025 · 14 photos", photos: ["dog", "dinner", "trophy", "drawing", "beach", "newborn"] },
  { label: "November 2025 · 9 photos", photos: ["roses", "birthday", "dog", "dinner", "trophy", "drawing"] },
];
const PICKER_PHOTOS = ["dog", "dinner", "trophy", "drawing", "beach", "newborn", "roses", "birthday"];

const photosFound = () => (loadSession().path === "b" ? "b2" : "a3");
const photoCount = () => TOTAL_FOUND - (loadSession().excluded || []).length;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
let excludedDraft = new Set();

function buildAllPhotos() {
  device.querySelector("[data-all-photos]").innerHTML = ALL_PHOTO_MONTHS.map((m, mi) => `
    <p class="month-label">${m.label}</p>
    <div class="month-grid">${m.photos.map((p, pi) => `
      <button class="pick-tile" type="button" aria-pressed="true" aria-label="Photo ${pi + 1}, ${m.label.split(" · ")[0]}" data-pick-tile="${mi}-${pi}">
        <img src="assets/photo-${p}.png" alt="" loading="lazy" decoding="async"><span class="pick-tick"></span>
      </button>`).join("")}
    </div>`).join("");
}

function paintAllPhotos() {
  device.querySelectorAll("[data-pick-tile]").forEach((t) => t.setAttribute("aria-pressed", String(!excludedDraft.has(t.dataset.pickTile))));
  const verb = loadSession().path === "b" ? "Keep" : "Send";
  device.querySelector("[data-all-confirm]").textContent = `${verb} ${TOTAL_FOUND - excludedDraft.size} photos`;
}

function buildPicker() {
  device.querySelector("[data-picker-grid]").innerHTML =
    `<button class="picker-tile picker-camera" type="button" data-todo="Camera"><img src="assets/icon-camera.svg" alt="" width="26" height="26">Camera</button>` +
    PICKER_PHOTOS.map((p, i) => `
      <button class="picker-tile" type="button" aria-pressed="false" aria-label="Photo ${i + 1}" data-picker-photo="${p}">
        <img src="assets/photo-${p}.png" alt="" loading="lazy" decoding="async"><span class="picker-badge"></span>
      </button>`).join("");
}

let pickerPreview = null;
function paintPicker() {
  const picked = loadSession().picked || [];
  device.querySelectorAll("[data-picker-photo]").forEach((t) => {
    const n = picked.indexOf(t.dataset.pickerPhoto);
    t.setAttribute("aria-pressed", String(n >= 0));
    t.querySelector(".picker-badge").textContent = n >= 0 ? n + 1 : "";
  });
  const shown = picked.includes(pickerPreview) ? pickerPreview : picked[picked.length - 1] || PICKER_PHOTOS[0];
  device.querySelector("[data-picker-preview]").src = `assets/photo-${shown}.png`;
  device.querySelector("[data-picker-counter]").textContent = picked.length ? `${picked.indexOf(shown) + 1} / ${picked.length}` : "";
  const next = device.querySelector("[data-picker-next]");
  next.disabled = !picked.length;
  next.textContent = picked.length ? `Next · ${picked.length}` : "Next";
}

function togglePickerPhoto(name) {
  const picked = [...(loadSession().picked || [])];
  const at = picked.indexOf(name);
  if (at >= 0) picked.splice(at, 1);
  else if (picked.length >= PICK_LIMIT) return toast("Up to 10 photos or videos per moment");
  else picked.push(name);
  pickerPreview = name;
  saveSession({ picked });
  paintPicker();
}

function openPicker() {
  const from = location.hash.slice(1) || "tv";
  if (from !== "picker" && from !== "moment") saveSession({ pickerFrom: from, picked: [], caption: "" });
  pickerPreview = null;
  go("picker");
}

// Where a shared moment lands: the empty Home asks for a TV, path B goes on to the TV, path A shows it on Home.
function momentDestination() {
  const { pickerFrom, path } = loadSession();
  if (/^d\d$/.test(pickerFrom)) return "d3";
  if (FEEDS[pickerFrom]) return pickerFrom;
  return path === "b" ? "b3" : "a6";
}

function initMomentForm() {
  const form = document.getElementById("moment-form");
  form.caption.addEventListener("input", () => saveSession({ caption: form.caption.value }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { picked = [], caption = "" } = loadSession();
    if (!picked.length) return go("picker");
    const dest = momentDestination();
    saveSession({ moment: { photos: picked, caption: caption.trim() }, momentOn: dest === "d3" ? "d4" : dest, picked: [], caption: "" });
    go(dest);
  });
}

// Show the person's own new moment on a Home screen: first photo, count, caption (or "Add a caption").
function applyMoment(screen, m) {
  screen.querySelector("[data-feed-photo]").src = `assets/photo-${m.photos[0]}.png`;
  screen.querySelector("[data-meta]").textContent = `Just now · ${plural(m.photos.length, "photo")}`;
  screen.querySelector("[data-count]").textContent = `1 / ${m.photos.length}`;
  const p = document.createElement(m.caption ? "p" : "button");
  p.className = "caption";
  if (m.caption) p.textContent = m.caption;
  else { p.type = "button"; p.dataset.todo = "Adding a caption"; p.textContent = "Add a caption"; }
  screen.querySelector("[data-caption-slot]").replaceChildren(p);
}

/* ---------- Toast ---------- */

let toastTimer;
function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

/* ---------- Router ---------- */

function go(id, { replace = false } = {}) {
  if (replace) location.replace("#" + id);
  else location.hash = id;
}

function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

const ENTER = {
  c2(_, screen) {
    screen.querySelector("[data-sent-to]").textContent = `Sent to ${loadSession().phone || "your phone"}`;
  },
  a2(route) {
    // The same system prompt sits in both paths; path B continues to "Keep these".
    device.querySelector("[data-allow]").dataset.go = route === "b-a2" ? "b2" : "a3";
  },
  "all-photos"() {
    excludedDraft = new Set(loadSession().excluded || []);
    paintAllPhotos();
  },
  picker() { paintPicker(); },
  moment(_, screen) {
    const { picked = [], caption = "" } = loadSession();
    if (!picked.length) return go("picker", { replace: true });
    screen.querySelector("[data-moment-preview]").src = `assets/photo-${picked[0]}.png`;
    const counter = screen.querySelector("[data-moment-counter]");
    counter.textContent = `1/${picked.length}`;
    counter.hidden = picked.length < 2;
    screen.querySelector("textarea").value = caption;
  },
  a4(_, screen) {
    const pill = screen.querySelector("[data-pill]");
    const total = photoCount();
    let n = Math.min(38, total);
    pill.hidden = false;
    pill.textContent = `Adding ${n} of ${total} photos`;
    const tick = setInterval(() => {
      n = Math.min(total, n + 3);
      pill.textContent = `Adding ${n} of ${total} photos`;
      if (n === total) {
        clearInterval(tick);
        later(() => go("a5", { replace: true }), 900);
      }
    }, 110);
    timers.push(tick);
  },
  b6(_, screen) {
    const t = setupText(loadSetup());
    screen.querySelector("[data-b6-title]").textContent = t.title;
    screen.querySelector("[data-message]").innerHTML =
      `<p>${t.greeting}</p><p>${t.steps.join("<br>")}</p><p>${t.sign}</p>`;
  },
  b7(_, screen) {
    screen.querySelector("[data-pill]").textContent = setupText(loadSetup()).waiting;
    // In real life this happens whenever the other TV types the code.
    later(() => go("b8", { replace: true }), 5000);
  },
  d4(_, screen) {
    const pill = screen.querySelector("[data-pill]");
    if (loadSession().tvWaiting) {
      pill.textContent = setupText(loadSetup()).waiting;
      // Plays as soon as the other TV joins — stand-in timer for that moment.
      later(() => go("d5", { replace: true }), 5000);
    } else {
      pill.textContent = "Waiting for a TV";
    }
  },
  d5(_, screen) {
    screen.querySelector("[data-tv-label]").textContent =
      loadSession().tvWaiting ? setupText(loadSetup()).connectedLabel : "TV on";
  },
  b8(_, screen) {
    const t = setupText(loadSetup());
    screen.querySelector("[data-tv-label]").textContent = t.connectedLabel;
    screen.querySelector("[data-push-body]").textContent = t.push;
    const push = screen.querySelector("[data-push]");
    push.classList.remove("is-shown");
    later(() => push.classList.add("is-shown"), 150);
    later(() => push.classList.remove("is-shown"), 6500);
  },
};

function render() {
  const route = ROUTES.includes(location.hash.slice(1)) ? location.hash.slice(1) : "tv";
  const sectionId = SECTION_OF[route] || route;

  timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  timers = [];
  closeSheet();

  // Remember the journey so shared screens (sign in, photo prompt) continue the right way.
  if (route === "tv" || route === "a1") saveSession({ path: "a" });
  if (route === "b1") saveSession({ path: "b" });
  if (route === "d1") saveSession({ path: "d", tvWaiting: false });

  document.body.dataset.route = route;
  let current;
  document.querySelectorAll("[data-screen]").forEach((s) => {
    const on = s.dataset.screen === sectionId;
    if (s.closest(".device")) s.hidden = !on;
    if (on) current = s;
  });

  if (current.querySelector("[data-signin]")) resetSigningIn(current);
  current.querySelectorAll("[data-author]").forEach((el) => { el.textContent = fullName(); });
  const { moment, momentOn } = loadSession();
  if (moment && (momentOn === sectionId || (momentOn === "d4" && sectionId === "d5"))) applyMoment(current, moment);
  current.querySelectorAll("[data-connect-sheet]").forEach((s) => { s.hidden = route !== "d3"; });
  ENTER[sectionId]?.(route, current);

  document.querySelectorAll(".flow-nav a").forEach((a) => {
    if (a.getAttribute("href") === "#" + route) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  // Forms put the cursor in their first field; other screens move focus to the heading.
  (current.querySelector("[data-autofocus]") || current.querySelector("h1"))?.focus({ preventScroll: true });
}

/* ---------- Clicks ---------- */

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-go], [data-todo], [data-share], [data-push], [data-signin], [data-sheet-close], [data-sheet-confirm], [data-email-option], [data-back], [data-picker], [data-photos-found], [data-all-confirm], [data-pick-tile], [data-picker-photo], [data-picker-close], [data-picker-next], [data-tv-later], [data-tv-scan], [data-connect-close], [data-invite]");
  if (!el) return;
  if (el.dataset.go) go(el.dataset.go);
  else if (el.hasAttribute("data-picker")) openPicker();
  else if (el.hasAttribute("data-photos-found")) go(photosFound());
  else if (el.dataset.pickTile) {
    const id = el.dataset.pickTile;
    excludedDraft.has(id) ? excludedDraft.delete(id) : excludedDraft.add(id);
    paintAllPhotos();
  }
  else if (el.hasAttribute("data-all-confirm")) {
    saveSession({ excluded: [...excludedDraft] });
    go(loadSession().path === "b" ? "b3" : "a4");
  }
  else if (el.dataset.pickerPhoto) togglePickerPhoto(el.dataset.pickerPhoto);
  else if (el.hasAttribute("data-picker-close")) { saveSession({ picked: [] }); go(loadSession().pickerFrom || photosFound()); }
  else if (el.hasAttribute("data-picker-next")) go("moment");
  // Which TV / connect steps are shared by path B and row D; only where they finish differs.
  else if (el.hasAttribute("data-tv-later")) go(loadSession().path === "d" ? "d4" : "b7");
  else if (el.hasAttribute("data-tv-scan")) go(loadSession().path === "d" ? "d5" : "a4");
  else if (el.hasAttribute("data-connect-close")) go("d4", { replace: true });
  else if (el.hasAttribute("data-invite")) shareInvite();
  else if (el.dataset.signin) openSheet(el.dataset.signin);
  else if (el.hasAttribute("data-sheet-close")) closeSheet();
  else if (el.dataset.sheetConfirm) startSigningIn(el.dataset.sheetConfirm);
  else if (el.hasAttribute("data-back")) go(signInScreen());
  else if (el.hasAttribute("data-email-option")) {
    el.parentElement.querySelectorAll("[data-email-option]").forEach((o) => o.setAttribute("aria-checked", String(o === el)));
  }
  else if (el.dataset.todo) toast(`Not in this build yet: ${el.dataset.todo}`);
  else if (el.hasAttribute("data-push")) el.classList.remove("is-shown");
  else if (el.hasAttribute("data-share")) shareSetup();
});

// Share text through the phone's share sheet; copy it where there is none. Resolves true once it has gone out.
async function shareText(text, copiedMessage) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      return false; // Closed the share sheet: stay put so they can try again.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(copiedMessage);
    return true;
  } catch {
    toast("Could not copy. Press and hold the message to copy it.");
    return false;
  }
}

async function shareSetup() {
  const t = setupText(loadSetup());
  const sent = await shareText(`${t.greeting}\n\n${t.steps.join("\n")}\n\n${t.sign}`, "Message copied. Paste it into WhatsApp or Messages.");
  if (!sent) return;
  if (loadSession().path === "d") {
    saveSession({ tvWaiting: true });
    go("d4");
  } else {
    go("b7");
  }
}

async function shareInvite() {
  const sent = await shareText(
    `Join our family on TeaTime so you can send photos to the TV too. Family code: ${FAMILY_CODE}`,
    "Invite copied. Paste it into WhatsApp or Messages."
  );
  if (sent && navigator.share) toast("Invite sent");
}

/* ---------- Colour options (review only) ----------
   Four CTA colour directions for the client to compare. Remove this block,
   the head script in index.html and the palette CSS once one is chosen. */

const PALETTES = [
  { id: "1", name: "Brand gradient", sub: "Magenta to gold", theme: "#1a1226" },
  { id: "2", name: "Strong blue", sub: "Blue actions, gradient for brand moments", theme: "#0e0c12" },
  { id: "3", name: "Analogous", sub: "Violet to pink", theme: "#1a1226" },
  { id: "4", name: "Logo gold", sub: "Gold actions, dark labels", theme: "#1a1226" },
];
let paletteSwitch;

function currentPalette() {
  return document.documentElement.dataset.palette || "1";
}

function setPalette(id) {
  const p = PALETTES.find((x) => x.id === id) || PALETTES[0];
  if (p.id === "1") delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = p.id;
  try { localStorage.setItem("teatime.palette", p.id); } catch {}
  // Keep a shared link in step with what is on screen, without touching the screen's #route.
  const url = new URL(location.href);
  url.searchParams.set("palette", p.id);
  history.replaceState(history.state, "", url);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", p.theme);
  paintPaletteSwitch();
  return p;
}

function paintPaletteSwitch() {
  const id = currentPalette();
  const p = PALETTES.find((x) => x.id === id);
  paletteSwitch.querySelector("[data-palette-label]").textContent = `Colour ${p.id} · ${p.name}`;
  paletteSwitch.querySelector("[data-palette-toggle]").setAttribute("aria-label", `Colour option: ${p.id}, ${p.name}. Change`);
  paletteSwitch.querySelectorAll("[data-palette-option]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.paletteOption === id));
  });
}

function openPalettePanel(open) {
  const panel = paletteSwitch.querySelector("[data-palette-panel]");
  const toggle = paletteSwitch.querySelector("[data-palette-toggle]");
  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  if (open) panel.querySelector('[aria-checked="true"]')?.focus();
}

function closePalettePanel() {
  const panel = paletteSwitch?.querySelector("[data-palette-panel]");
  if (!panel || panel.hidden) return false;
  openPalettePanel(false);
  paletteSwitch.querySelector("[data-palette-toggle]").focus();
  return true;
}

function initPaletteSwitch() {
  paletteSwitch = document.createElement("div");
  paletteSwitch.className = "palette-switch";
  paletteSwitch.innerHTML = `
    <button class="palette-toggle" type="button" data-palette-toggle aria-expanded="false" aria-controls="palette-panel">
      <span class="palette-swatch" aria-hidden="true"></span><span class="palette-toggle-label" data-palette-label></span>
    </button>
    <div class="palette-panel" id="palette-panel" data-palette-panel hidden>
      <p class="palette-title" id="palette-title">Colour option</p>
      <p class="palette-note">For review. We keep the one the client picks.</p>
      <div role="radiogroup" aria-labelledby="palette-title">
        ${PALETTES.map((p) => `
          <button class="palette-option" type="button" role="radio" aria-checked="false" data-palette-option="${p.id}">
            <span class="palette-swatch" data-palette="${p.id}" aria-hidden="true"></span>
            <span class="palette-option-text"><b>${p.id} · ${p.name}</b><small>${p.sub}</small></span>
            <img class="palette-check" src="assets/icon-circle-check.svg" alt="">
          </button>`).join("")}
      </div>
    </div>`;
  document.body.append(paletteSwitch);

  paletteSwitch.addEventListener("click", (e) => {
    if (e.target.closest("[data-palette-toggle]")) {
      openPalettePanel(paletteSwitch.querySelector("[data-palette-panel]").hidden);
      return;
    }
    const option = e.target.closest("[data-palette-option]");
    if (!option) return;
    const p = setPalette(option.dataset.paletteOption);
    openPalettePanel(false);
    if (!document.body.matches('[data-route="tv"]')) toast(`Colour ${p.id} · ${p.name}`);
  });
  // Arrow keys move between options, like any radio group.
  paletteSwitch.addEventListener("keydown", (e) => {
    const option = e.target.closest("[data-palette-option]");
    if (!option || !["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    e.preventDefault();
    const all = [...paletteSwitch.querySelectorAll("[data-palette-option]")];
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    all[(all.indexOf(option) + step + all.length) % all.length].focus();
  });
  // Tap anywhere else closes the panel.
  document.addEventListener("pointerdown", (e) => {
    if (!paletteSwitch.contains(e.target)) openPalettePanel(false);
  });
  paintPaletteSwitch();
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (closePalettePanel()) return;
  closeSheet();
  if (location.hash === "#d3") go("d4", { replace: true });
});

buildGrids();
buildFeeds();
buildAllPhotos();
buildPicker();
initSetupForm();
initPhoneForms();
initMomentForm();
initSheetSwipe();
initPaletteSwitch();
window.addEventListener("hashchange", render);
render();
