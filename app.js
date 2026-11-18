// TeaTime onboarding v2.1 — hash router, Home feed template and screen behaviour.

const GRID_PHOTOS = ["birthday", "beach", "newborn", "dog", "roses", "dinner", "trophy", "drawing"];

// Home feed screens share one layout; only the moment and the status change.
const FEEDS = {
  a4: { photo: "newborn", tv: "TV on", dot: "green", meta: "25 December 2025 · 9 photos", caption: null, count: "1 / 9", pill: "Adding 38 of 128 photos" },
  a5: { photo: "newborn", tv: "Lisa’s TV on", dot: "green", meta: "25 December 2025 · 9 photos", caption: null, count: "1 / 9", stories: true },
  a6: { photo: "birthday", tv: "Lisa’s TV on", dot: "green", meta: "Just now · 6 photos", caption: "Lily’s 6th birthday 🎂", count: "1 / 6" },
  b7: { photo: "roses", tv: "No TV yet", dot: "grey", meta: "24 December 2025 · 6 photos", caption: null, count: "1 / 6", pill: "" },
  b8: { photo: "roses", tv: "", dot: "green", meta: "24 December 2025 · 6 photos", caption: null, count: "1 / 6", push: true },
  // Row D: shared with "+" before any TV. The pill and "No TV yet" both open Which TV.
  d4: { photo: "roses", tv: "No TV yet", dot: "grey", meta: "Just now · 3 photos", caption: null, count: "1 / 3", pill: "Waiting for a TV", dots: 3, toWhichTv: true, sheet: "connect" },
  d5: { photo: "roses", tv: "TV on", dot: "green", meta: "Just now · 3 photos", caption: null, count: "1 / 3", dots: 3, nudge: true },
  // Row 4 / 5: a second member lands in the family's own feed (their moments, their TV).
  joined: { photo: "newborn", tv: "Lisa’s TV on", dot: "green", meta: "25 December 2025 · 9 photos", caption: null, count: "1 / 9", author: "Sarah Johnson", members: "·  5 in the family", push: true },
  // Row 5: asked to join from the TV's small QR. Their own Home, nothing from the family yet.
  "f2-home": { photo: "roses", tv: "No TV yet", dot: "grey", meta: "Just now · 3 photos", caption: null, count: "1 / 3", pill: "Waiting for Sarah", dots: 3, sheet: "sent", push: true },
  // Row 5, the admin's phone: the request opens as a sheet on Home.
  "f3-home": { photo: "newborn", tv: "Lisa’s TV on", dot: "green", meta: "25 December 2025 · 9 photos", caption: null, count: "1 / 9", author: "Sarah Johnson", members: "·  4 in the family", sheet: "approve" },
  // Row 7: the bulk upload stays one moment; its stories sit on the moment.
  g1: { src: "assets/hero-photo.png", tv: "Lisa’s TV on", dot: "green", meta: "100 photos · May – Oct 2026", caption: null, captionPrompt: "Six months in one go — add a caption", count: "1 / 100", stories: true },
};

// Inside Compare, each phone is this page in a frame with ?embed=1.
const EMBED = new URLSearchParams(location.search).has("embed");

const ROUTES = [
  "tv", "a1", "a2", "a3", "a4", "a5", "a6",
  "b1", "b-a2", "b2", "b3", "b4", "b5", "b6", "b7", "b8",
  "c1", "c2", "c3", "photos-off", "all-photos", "picker", "moment",
  "d1", "d3", "d4", "d5",
  "e1", "e2", "e4", "e5", "e6", "e7", "joined", "declined",
  "f1", "f2", "f2-home", "f3", "f3-home", "f4",
  "g1", "g2", "g3",
];
// Routes drawn by another screen's section: a sheet over a Home, the story player, E1 after a decline.
const SECTION_OF = { "b-a2": "a2", d3: "d4", f2: "f2-home", f3: "f3-home", declined: "e1", g2: "story", g3: "story" };
// Routes that only set where the journey started, then show its first screen.
const ENTRY = {
  ad: () => { saveSession({ path: "b", joinVia: null }); return "b1"; },      // ad, poster or app store
  tvqr: () => { saveSession({ path: "b", joinVia: "tvqr" }); return "b1"; },  // the small QR on the TV's Home
};
const STORE_KEY = "teatime.setup";
const SESSION_KEY = "teatime.session";
const FAMILY_PIN = "4829"; // placeholder until the family service exists (any other PIN shows the error)

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

// Sheets over a Home. No Cancel button: swipe down, tap outside or Esc does it later.
const SHEETS = {
  connect: (id) => `
          <h2 id="${id}-sheet-title" class="title1">Shared. Now connect a TV</h2>
          <p class="body-small">Your moment is saved. It plays as soon as a TV is connected.</p>
          <span class="spacer-12"></span>
          <button class="btn btn-primary btn-glass-edge" type="button" data-go="b3">Connect a TV</button>`,
  sent: (id) => `
          <h2 id="${id}-sheet-title" class="title1">Sent to Sarah</h2>
          <p class="body-small">We’ll tell you the moment she says yes. Until then you can look around and get your photos ready.</p>
          <span class="spacer-12"></span>
          <button class="btn btn-primary btn-glass-edge" type="button" data-connect-close>Got it</button>`,
  approve: (id) => `
          <div class="sheet-who">
            <span class="sheet-who-avatar" aria-hidden="true">T</span>
            <span class="sheet-who-text"><span class="sheet-who-name">Tom Nguyen</span><span class="sheet-who-sub">Signed in with Google · just now</span></span>
          </div>
          <h2 id="${id}-sheet-title" class="title1">Tom wants to join</h2>
          <p class="body-small">Tom Nguyen scanned the code on Lisa’s TV. Approve only if you know him — he’ll see every moment and can send to the TV.</p>
          <span class="spacer-12"></span>
          <button class="btn btn-primary btn-glass-edge" type="button" data-approve="yes">Approve</button>
          <button class="btn btn-tertiary" type="button" data-approve="no">Decline</button>`,
};

function feedMarkup(id, f) {
  const caption = f.caption
    ? `<p class="caption">${f.caption}</p>`
    : `<button class="caption" type="button" data-todo="Adding a caption">${f.captionPrompt || "Add a caption"}</button>`;
  return `
    <section class="screen feed" data-screen="${id}" hidden aria-labelledby="${id}-title">
      <img class="feed-photo" src="${f.src || `assets/photo-${f.photo}.png`}" alt="" loading="lazy" decoding="async" data-feed-photo>
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
          <span class="members">${f.members || "·  Just you"}</span>
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
      ${f.stories ? `
      <div class="stories" aria-label="Stories from this moment">
        <button class="story-btn" type="button" data-story="g2"><span class="story-ring"><img src="assets/story-cover-timeline.png" alt=""></span><span class="story-label">Timeline</span></button>
        <button class="story-btn" type="button" data-story="g3"><span class="story-ring"><img src="assets/story-cover-place.png" alt=""></span><span class="story-label">Da Lat</span></button>
      </div>` : ""}
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
          <span class="author"><span class="author-name"${f.author ? "" : " data-author"}>${f.author || "Sarah Johnson"}</span><span class="author-meta" data-meta>${f.meta}</span></span>
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
      ${f.sheet ? `
      <div class="connect-layer" data-connect-sheet hidden>
        <div class="connect-dim" data-connect-close></div>
        <div class="connect-sheet" role="dialog" aria-modal="true" aria-labelledby="${id}-sheet-title">
          <span class="connect-grabber" aria-hidden="true"></span>
          <span class="spacer-10"></span>
          ${SHEETS[f.sheet](id)}
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
// Straight after sign-in: name the family (E1), or ask to join the TV's family when they scanned its small QR.
const afterSignIn = () => (loadSession().joinVia === "tvqr" ? "f1" : "e1");

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
    // Demo identities: whoever scanned the TV’s small QR is Tom, asking to join Sarah’s family.
    saveSession(loadSession().joinVia === "tvqr" ? { first: "Tom", last: "Nguyen" } : { first: "Sarah", last: "Johnson" });
    go(afterSignIn());
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
      if (moved > 80) sheet.classList.contains("connect-sheet") ? closeFeedSheet(sheet) : closeSheet();
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
    go(afterSignIn());
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
    const moment = { photos: picked, caption: caption.trim() };
    // The 4th upload asks for a subscription first; nothing is sent until they choose.
    if (needsPaywall()) {
      saveSession({ pendingMoment: { moment, dest } });
      return go("f4");
    }
    finishMoment(moment, dest);
  });
}

function finishMoment(moment, dest) {
  countUpload();
  saveSession({ moment, momentOn: dest === "d3" ? "d4" : dest, picked: [], caption: "", pendingMoment: null });
  go(dest);
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

/* ---------- E1 · Name your family, E2 · family PIN, E4–E7 · care community ---------- */

// "Johnson" → "The Johnsons" (pre-filled from the Apple / Google / phone surname).
function familyFromSurname(last) {
  const name = (last || "").trim();
  if (!name) return "";
  return `The ${/(s|x|z|ch|sh)$/i.test(name) ? name + "es" : name + "s"}`;
}

// Placeholder directory until the community service exists.
const COMMUNITIES = [
  { name: "Cheltenham Manor", place: "Cheltenham VIC", kind: "care home" },
  { name: "Cheltenham Gardens", place: "Cheltenham VIC", kind: "retirement village" },
  { name: "Chelsea Heights Care", place: "Chelsea Heights VIC", kind: "care home" },
  { name: "Bayside Gardens", place: "Brighton VIC", kind: "care home" },
  { name: "Lakeside Lodge", place: "Mentone VIC", kind: "retirement village" },
  { name: "Sandringham House", place: "Sandringham VIC", kind: "care home" },
];
// Residents each community has listed. `her` only where the community's own record says so;
// a name typed in by the family never decides the pronoun.
const RESIDENTS = {
  "Cheltenham Manor": [{ first: "Margaret", last: "Johnson", room: "Room 12 · Lakeside wing", her: true }],
  "Cheltenham Gardens": [{ first: "Joan", last: "Smith", room: "Unit 4 · Garden court", her: true }],
};

const DEFAULT_COMMUNITY = "Cheltenham Manor";
const DEFAULT_RESIDENT = RESIDENTS[DEFAULT_COMMUNITY][0];
const careResident = () => loadSession().resident || DEFAULT_RESIDENT;
const pron = (r) => (r.her ? { obj: "her", pos: "her" } : { obj: "them", pos: "their" });
const possessive = (name) => `${name}’s`;

const prefixLen = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Results appear as you type; a word that starts like the search counts, so "Chelt" also finds Chelsea.
function matchCommunities(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const need = Math.min(q.length, 4);
  return COMMUNITIES.map((c) => {
    const words = c.name.toLowerCase().split(/\s+/);
    let best = { len: 0, word: -1 };
    words.forEach((w, i) => { const len = prefixLen(q, w); if (len > best.len) best = { len, word: i }; });
    const inName = c.name.toLowerCase().includes(q);
    const inPlace = c.place.toLowerCase().includes(q) || c.place.toLowerCase().split(/\s+/).some((w) => prefixLen(q, w) >= need);
    const score = inName ? 100 + q.length : best.len >= need ? best.len : inPlace ? 1 : 0;
    return { c, score, best };
  }).filter((m) => m.score > 0).sort((x, y) => y.score - x.score);
}

function highlightName(name, best) {
  if (best.word < 0 || !best.len) return escapeHtml(name);
  const words = name.split(/(\s+)/); // keep the spaces
  let wi = -1;
  return words.map((w) => {
    if (/^\s+$/.test(w)) return w;
    wi += 1;
    return wi === best.word ? `<mark>${escapeHtml(w.slice(0, best.len))}</mark>${escapeHtml(w.slice(best.len))}` : escapeHtml(w);
  }).join("");
}

function paintCommunities() {
  const input = device.querySelector("[data-community-search]");
  const matches = matchCommunities(input.value);
  device.querySelector("[data-community-clear]").hidden = !input.value;
  const count = device.querySelector("[data-community-count]");
  count.textContent = !input.value.trim() ? "" : matches.length ? `${matches.length} ${matches.length === 1 ? "community matches" : "communities match"}` : "No communities match";
  device.querySelector("[data-community-results]").innerHTML = matches.map(({ c, best }) => `
    <li><button class="result" type="button" data-community="${escapeHtml(c.name)}">
      <img src="assets/icon-pin.svg" alt="" width="22" height="22">
      <span class="result-text"><span class="result-name">${highlightName(c.name, best)}</span><span class="result-sub">${c.place} · ${c.kind}</span></span>
    </button></li>`).join("");
}

function initFamilyForms() {
  // E1: Continue right under the name, so most people tap once.
  const familyForm = document.getElementById("family-form");
  const checkFamily = () => { familyForm.querySelector("[type=submit]").disabled = !familyForm.family.value.trim(); };
  familyForm.family.addEventListener("input", () => { saveSession({ familyDraft: familyForm.family.value }); checkFamily(); });
  familyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = familyForm.family.value.trim();
    if (!name) return familyForm.family.focus();
    saveSession({ family: name, familyDraft: name, community: null, resident: null });
    go(photoPrompt());
  });

  // E2: the PIN joins straight away — no approval.
  const pinForm = document.getElementById("pin-form");
  const pinBox = pinForm.querySelector(".pin-input");
  const pinBoxes = [...pinForm.querySelectorAll(".code-box")];
  const pinError = pinForm.querySelector("#pin-error");
  const paintPin = () => {
    const pin = pinForm.pin.value.replace(/\D/g, "").slice(0, 4);
    pinForm.pin.value = pin;
    pinBoxes.forEach((b, i) => {
      b.textContent = pin[i] || "";
      b.classList.toggle("is-active", i === Math.min(pin.length, 3));
    });
    pinForm.querySelector("[type=submit]").disabled = pin.length < 4;
  };
  pinForm.pin.addEventListener("input", () => {
    pinBox.classList.remove("is-error");
    pinError.hidden = true;
    pinForm.pin.removeAttribute("aria-invalid");
    paintPin();
  });
  pinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (pinForm.pin.value.length < 4) return;
    if (pinForm.pin.value !== FAMILY_PIN) {
      pinBox.classList.add("is-error");
      pinError.hidden = false;
      pinForm.pin.setAttribute("aria-invalid", "true");
      pinForm.pin.select();
      return;
    }
    saveSession({ family: "The Johnsons", joinedBy: "pin" });
    pinForm.pin.value = "";
    paintPin();
    go("joined");
  });
  paintPin();

  // E4: search the communities.
  const search = device.querySelector("[data-community-search]");
  search.value = loadSession().communityQuery || "";
  search.addEventListener("input", () => { saveSession({ communityQuery: search.value }); paintCommunities(); });
  search.addEventListener("keydown", (e) => {
    // Enter picks the only match, so a keyboard user doesn't have to tab to it.
    if (e.key !== "Enter") return;
    const first = device.querySelector("[data-community]");
    if (first && matchCommunities(search.value).length === 1) first.click();
  });
  device.querySelector("[data-community-clear]").addEventListener("click", () => {
    search.value = "";
    saveSession({ communityQuery: "" });
    paintCommunities();
    search.focus();
  });
  paintCommunities();

  // E5: first and last name only; matched against the community's list, ignoring case.
  const residentForm = document.getElementById("resident-form");
  const checkResident = () => {
    residentForm.querySelector("[type=submit]").disabled = !residentForm.first.value.trim() || !residentForm.last.value.trim();
  };
  residentForm.addEventListener("input", () => {
    saveSession({ residentDraft: { first: residentForm.first.value, last: residentForm.last.value } });
    checkResident();
  });
  residentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const first = residentForm.first.value.trim();
    const last = residentForm.last.value.trim();
    if (!first || !last) return;
    const community = loadSession().community || DEFAULT_COMMUNITY;
    const found = (RESIDENTS[community] || []).find((r) => r.first.toLowerCase() === first.toLowerCase() && r.last.toLowerCase() === last.toLowerCase());
    saveSession({ resident: found ? { ...found } : { first, last }, matched: !!found });
    go(found ? "e6" : "e7");
  });
  residentForm.checkResident = checkResident;
}

/* ---------- Uploads: 3 free, the 4th asks for a subscription ---------- */

// Bulk at sign-up = upload 1; every moment shared after that is one more. Paid care communities skip the paywall.
function countUpload() {
  const s = loadSession();
  saveSession({ uploads: (s.uploads || 0) + 1 });
}
const needsPaywall = () => {
  const s = loadSession();
  return (s.uploads || 0) >= 3 && !s.subscribed && !s.community;
};

/* ---------- G2 / G3 · Story player ---------- */

const STORY_MS = 3000;
const MONTHS = ["May", "June", "July", "August", "September", "October"];
const STORY_PHOTOS = ["beach", "birthday", "newborn", "dog", "roses", "dinner", "trophy", "drawing"];
const STORY_CAPTIONS = { beach: "Beach day", birthday: "Lily’s birthday", newborn: "Welcome home", dog: "Walk with Biscuit", roses: "Tree night", dinner: "Sunday dinner", trophy: "Footy final", drawing: "Fridge art", hero: "Park walk" };
const DA_LAT_SPOTS = ["Xuan Huong Lake", "Langbiang Mountain", "Da Lat Market", "Crazy House", "Valley of Love", "Datanla Falls", "Truc Lam Pagoda"];

// Timeline = 2–3 photos a month over 6 months; a place = photos taken in the same spot.
const STORIES = {
  g2: {
    title: "Six months with the Johnsons", // replaced with the family name when it plays
    sub: "May – October 2026 · 20 photos",
    count: 20,
    photo: (i) => STORY_PHOTOS[i % STORY_PHOTOS.length],
    chip: (i) => `${MONTHS[Math.min(5, Math.floor((i * 6) / 20))]} 2026`,
    caption: (i, p) => `${STORY_CAPTIONS[p]} · ${3 + ((i * 7) % 25)} ${MONTHS[Math.min(5, Math.floor((i * 6) / 20))]} 2026 · from Sarah’s upload`,
  },
  g3: {
    title: "Moments in Da Lat",
    sub: "August 2026 · 14 photos",
    count: 14,
    photo: (i) => ["hero", "roses", "dog", "dinner", "beach", "trophy", "drawing"][i % 7],
    chip: () => "Da Lat, Vietnam",
    caption: (i) => `${DA_LAT_SPOTS[i % DA_LAT_SPOTS.length]} · ${2 + i} August 2026`,
  },
};

const story = { id: "g2", i: 0, remaining: STORY_MS, started: 0, timer: null, paused: false };
const storyScreen = () => device.querySelector('[data-screen="story"]');
const storyPhotoSrc = (p) => (p === "hero" ? "assets/hero-photo.png" : `assets/photo-${p}.png`);

function paintStory() {
  const s = STORIES[story.id];
  const screen = storyScreen();
  const p = s.photo(story.i);
  screen.querySelector("[data-story-photo]").src = storyPhotoSrc(p);
  const family = loadSession().family;
  screen.querySelector("[data-story-title]").textContent = story.id === "g2" && family ? `Six months with ${family.replace(/^The /, "the ")}` : s.title;
  screen.querySelector("[data-story-sub]").textContent = s.sub;
  screen.querySelector("[data-story-chip]").textContent = s.chip(story.i);
  screen.querySelector("[data-story-caption]").textContent = s.caption(story.i, p);
  screen.querySelector("[data-story-step]").textContent = `${story.i + 1} of ${s.count} · tap to skip, hold to pause`;
  screen.querySelector("[data-story-progress]").innerHTML = Array.from({ length: s.count }, (_, k) =>
    `<span class="story-seg${k < story.i ? " is-done" : k === story.i ? " is-current" : ""}"></span>`).join("");
  screen.style.setProperty("--story-ms", `${STORY_MS}ms`);
  // Load the next photo early so the change is instant.
  new Image().src = storyPhotoSrc(s.photo((story.i + 1) % s.count));
}

function storyPlay() {
  clearTimeout(story.timer);
  story.started = Date.now();
  story.timer = setTimeout(storyNext, story.remaining);
  timers.push(story.timer);
}

function storyGoTo(i) {
  const s = STORIES[story.id];
  if (i >= s.count) return closeStory();
  story.i = Math.max(0, i);
  story.remaining = STORY_MS;
  paintStory();
  if (!story.paused) storyPlay();
}
const storyNext = () => storyGoTo(story.i + 1);

function storyPause(on) {
  if (on === story.paused) return;
  story.paused = on;
  storyScreen().classList.toggle("is-paused", on);
  if (on) {
    clearTimeout(story.timer);
    story.remaining = Math.max(200, story.remaining - (Date.now() - story.started));
  } else {
    storyPlay();
  }
}

function closeStory() {
  clearTimeout(story.timer);
  go(loadSession().storyFrom || "g1", { replace: true });
}

function initStoryPlayer() {
  const tap = device.querySelector("[data-story-tap]");
  let holdTimer = null;
  let held = false;
  tap.addEventListener("pointerdown", () => {
    held = false;
    holdTimer = setTimeout(() => { held = true; storyPause(true); }, 220);
  });
  tap.addEventListener("pointerup", (e) => {
    clearTimeout(holdTimer);
    if (held) return storyPause(false); // let go after holding: carry on
    const box = tap.getBoundingClientRect();
    storyGoTo(story.i + (e.clientX - box.left < box.width / 3 ? -1 : 1)); // left third goes back
  });
  tap.addEventListener("pointercancel", () => { clearTimeout(holdTimer); if (held) storyPause(false); });
  tap.addEventListener("contextmenu", (e) => e.preventDefault()); // long-press is pause, not a menu
  document.addEventListener("keydown", (e) => {
    if (!/^#g[23]$/.test(location.hash)) return;
    if (e.key === "ArrowRight") storyGoTo(story.i + 1);
    else if (e.key === "ArrowLeft") storyGoTo(story.i - 1);
    else if (e.key === " ") { e.preventDefault(); storyPause(!story.paused); }
  });
  // Switching away from the app pauses the story; coming back carries on.
  document.addEventListener("visibilitychange", () => {
    if (/^#g[23]$/.test(location.hash)) storyPause(document.hidden);
  });
}

/* ---------- Sheets over Home, and clicks for the new screens ---------- */

// Close a sheet over Home (D3, F2, F3): stay on that Home.
function closeFeedSheet(el) {
  const home = el.closest("[data-screen]")?.dataset.screen;
  if (home) go(home, { replace: true });
}

function handleNewClick(el) {
  if (el.dataset.story) {
    saveSession({ storyFrom: location.hash.slice(1) || "g1" });
    go(el.dataset.story);
  } else if (el.hasAttribute("data-story-close")) {
    closeStory();
  } else if (el.dataset.community) {
    saveSession({ community: el.dataset.community, residentDraft: null });
    go("e5");
  } else if (el.hasAttribute("data-resident-join")) {
    // Joins the resident's existing family; moments appear on their TV.
    saveSession({ family: `${possessive(careResident().first)} family` });
    go(photoPrompt());
  } else if (el.hasAttribute("data-care-continue")) {
    // No match: a family is made at once and the community is told. Photos next, as in Flow 2.
    saveSession({ family: `${possessive(careResident().first)} family` });
    go(photoPrompt());
  } else if (el.hasAttribute("data-not-family")) {
    saveSession({ joinVia: null });
    go("e1");
  } else if (el.dataset.approve) {
    const yes = el.dataset.approve === "yes";
    go("f3-home", { replace: true });
    toast(yes ? "Tom is in. He’s been told “You’re in”." : "Tom has been told. Nothing else changes.");
  } else if (el.hasAttribute("data-subscribe")) {
    saveSession({ subscribed: true });
    const { pendingMoment } = loadSession();
    toast("Subscribed. Demo only — no payment taken.");
    if (pendingMoment) finishMoment(pendingMoment.moment, pendingMoment.dest);
    else go(loadSession().pickerFrom && FEEDS[loadSession().pickerFrom] ? loadSession().pickerFrom : "g1");
  } else if (el.hasAttribute("data-not-now")) {
    // Nothing is uploaded; back to Home.
    const { pickerFrom } = loadSession();
    saveSession({ pendingMoment: null, picked: [], caption: "" });
    go(FEEDS[pickerFrom] ? pickerFrom : /^d\d$/.test(pickerFrom || "") ? "d1" : "g1");
    toast("Not uploaded");
  } else if (el.hasAttribute("data-paywall-back")) {
    loadSession().pendingMoment ? go("moment") : history.length > 1 ? history.back() : go("g1");
  } else {
    return false;
  }
  return true;
}

const NEW_ENTER = {
  e1(route, screen) {
    const s = loadSession();
    const input = screen.querySelector("[name=family]");
    input.value = s.familyDraft ?? s.family ?? familyFromSurname(s.last);
    screen.querySelector("[type=submit]").disabled = !input.value.trim();
    if (route === "declined") {
      saveSession({ joinVia: null });
      later(() => toast("The Johnsons declined your request. Name your own family, or join another way."), 300);
    }
  },
  e2(_, screen) {
    screen.querySelector(".pin-input").classList.remove("is-error");
    screen.querySelector("#pin-error").hidden = true;
  },
  e4() { paintCommunities(); },
  e5(_, screen) {
    const s = loadSession();
    const community = s.community || DEFAULT_COMMUNITY;
    screen.querySelector("[data-e5-title]").textContent = `Who lives at ${community}?`;
    const form = screen.querySelector("form");
    const draft = s.residentDraft || (s.resident ? { first: s.resident.first, last: s.resident.last } : { first: "", last: "" });
    form.first.value = draft.first;
    form.last.value = draft.last;
    form.checkResident?.();
  },
  e6(_, screen) {
    const r = careResident();
    const community = loadSession().community || DEFAULT_COMMUNITY;
    const p = pron(r);
    screen.querySelector("[data-e6-title]").textContent = `Is this ${r.first}?`;
    screen.querySelector("[data-e6-sub]").textContent = `One resident at ${community} has this name.`;
    screen.querySelector("[data-e6-initial]").textContent = r.first[0].toUpperCase();
    screen.querySelector("[data-e6-name]").textContent = `${r.first} ${r.last}`;
    screen.querySelector("[data-e6-room]").textContent = r.room || "";
    screen.querySelector("[data-e6-hint]").textContent = `Joining adds you to ${possessive(r.first)} family. What you share plays on ${p.pos} TV.`;
    screen.querySelector("[data-resident-join]").textContent = `Yes, join ${possessive(r.first)} family`;
    screen.querySelector("[data-e6-not]").textContent = `Not ${p.obj} — tell the community`;
  },
  e7(_, screen) {
    const r = careResident();
    const community = loadSession().community || DEFAULT_COMMUNITY;
    const p = pron(r);
    screen.querySelector("[data-e7-sub]").textContent = `We couldn’t find ${r.first} yet, so we made ${p.pos} family for you and told ${community}.`;
    screen.querySelector("[data-e7-tv]").textContent = `Then ${possessive(r.first)} TV joins`;
    screen.querySelector("[data-e7-tv]").nextElementSibling.textContent = `${p.pos[0].toUpperCase() + p.pos.slice(1)} room TV and the community posts unlock.`;
  },
  f4(_, screen) {
    screen.querySelector("[data-paywall-back]").setAttribute("aria-label", loadSession().pendingMoment ? "Back to your moment" : "Back");
  },
  joined(_, screen) {
    const s = loadSession();
    saveSession({ family: "The Johnsons" });
    screen.querySelector("[data-push-body]").textContent = s.joinedBy === "pin"
      ? "You’ve joined The Johnsons. Their moments are playing on Lisa’s TV."
      : "Sarah said yes. You’re in The Johnsons.";
    const push = screen.querySelector("[data-push]");
    push.classList.remove("is-shown");
    later(() => push.classList.add("is-shown"), 400);
    later(() => push.classList.remove("is-shown"), 6500);
  },
  "f2-home"(route, screen) {
    saveSession({ joinedBy: "approval" });
    const push = screen.querySelector("[data-push]");
    push.classList.remove("is-shown");
    if (route !== "f2-home") return; // the sheet is still up
    screen.querySelector("[data-push-body]").textContent = "Sarah said yes. You’re in The Johnsons — tap to see the family’s moments.";
    // Stand-in for the admin approving; stays until tapped.
    later(() => push.classList.add("is-shown"), 5000);
  },
  story(route) {
    story.id = route === "g3" ? "g3" : "g2";
    story.i = 0;
    story.remaining = STORY_MS;
    story.paused = false;
    storyScreen().classList.remove("is-paused");
    paintStory();
    storyPlay();
  },
};

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
  if (replace || EMBED) location.replace("#" + id); // frames don't add Back-button entries
  else location.hash = id;
}

function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

const ENTER = {
  ...NEW_ENTER,
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
    screen.querySelector("[data-family-name]").textContent = loadSession().family || "Your moments";
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
  const entry = ENTRY[location.hash.slice(1)];
  if (entry) return go(entry(), { replace: true });
  const route = ROUTES.includes(location.hash.slice(1)) ? location.hash.slice(1) : "tv";
  const sectionId = SECTION_OF[route] || route;

  timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  timers = [];
  closeSheet();

  // Remember the journey so shared screens (sign in, photo prompt) continue the right way.
  if (route === "tv" || route === "a1") saveSession({ path: "a", joinVia: null });
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
  // A sheet over Home shows only on its own route (D3, F2, F3); closing it lands on that Home.
  current.querySelectorAll("[data-connect-sheet]").forEach((s) => { s.hidden = route === sectionId; });
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
  const el = e.target.closest("[data-go], [data-todo], [data-share], [data-push], [data-signin], [data-sheet-close], [data-sheet-confirm], [data-email-option], [data-back], [data-picker], [data-photos-found], [data-all-confirm], [data-pick-tile], [data-picker-photo], [data-picker-close], [data-picker-next], [data-tv-later], [data-tv-scan], [data-connect-close], [data-invite], [data-story], [data-story-close], [data-approve], [data-not-family], [data-resident-join], [data-care-continue], [data-subscribe], [data-not-now], [data-paywall-back], [data-community]");
  if (!el) return;
  if (handleNewClick(el)) return;
  if (el.dataset.go) {
    // "Send now" / "Keep these" send the whole batch: that is upload 1.
    const from = location.hash.slice(1);
    if ((from === "a3" && el.dataset.go === "a4") || (from === "b2" && el.dataset.go === "b3")) countUpload();
    go(el.dataset.go);
  }
  else if (el.hasAttribute("data-picker")) openPicker();
  else if (el.hasAttribute("data-photos-found")) go(photosFound());
  else if (el.dataset.pickTile) {
    const id = el.dataset.pickTile;
    excludedDraft.has(id) ? excludedDraft.delete(id) : excludedDraft.add(id);
    paintAllPhotos();
  }
  else if (el.hasAttribute("data-all-confirm")) {
    saveSession({ excluded: [...excludedDraft] });
    countUpload();
    go(loadSession().path === "b" ? "b3" : "a4");
  }
  else if (el.dataset.pickerPhoto) togglePickerPhoto(el.dataset.pickerPhoto);
  else if (el.hasAttribute("data-picker-close")) { saveSession({ picked: [] }); go(loadSession().pickerFrom || photosFound()); }
  else if (el.hasAttribute("data-picker-next")) go("moment");
  // Which TV / connect steps are shared by path B and row D; only where they finish differs.
  else if (el.hasAttribute("data-tv-later")) go(loadSession().path === "d" ? "d4" : "b7");
  else if (el.hasAttribute("data-tv-scan")) go(loadSession().path === "d" ? "d5" : "a4");
  else if (el.hasAttribute("data-connect-close")) closeFeedSheet(el);
  else if (el.hasAttribute("data-invite")) shareInvite();
  else if (el.dataset.signin) openSheet(el.dataset.signin);
  else if (el.hasAttribute("data-sheet-close")) closeSheet();
  else if (el.dataset.sheetConfirm) startSigningIn(el.dataset.sheetConfirm);
  else if (el.hasAttribute("data-back")) go(signInScreen());
  else if (el.hasAttribute("data-email-option")) {
    el.parentElement.querySelectorAll("[data-email-option]").forEach((o) => o.setAttribute("aria-checked", String(o === el)));
  }
  else if (el.dataset.todo) toast(`Not in this build yet: ${el.dataset.todo}`);
  else if (el.hasAttribute("data-push")) {
    el.classList.remove("is-shown");
    if (location.hash === "#f2-home") go("joined"); // "Sarah said yes" opens the family's Home
  }
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
    `Join ${loadSession().family || "our family"} on TeaTime so you can send photos to the TV too. Family PIN: ${FAMILY_PIN}`,
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
    <button class="palette-compare-pill" type="button" data-compare-open>Compare</button>
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
      <button class="palette-compare" type="button" data-compare-open>Compare all four side by side</button>
    </div>`;
  document.body.append(paletteSwitch);

  paletteSwitch.addEventListener("click", (e) => {
    if (e.target.closest("[data-compare-open]")) {
      openPalettePanel(false);
      openCompare();
      return;
    }
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

/* ---------- Compare (review only) ----------
   The current screen in all four colour options at once. Each phone is this page in a
   frame (?palette=N&embed=1). Tapping through any phone moves all four to the same screen. */

let compareEl;
let compareReturnFocus;

function compareScreens() {
  // Same order and names as the review list: journey A, B, sign-in details, photo details, D.
  // Entry links (ad, small QR) only set the journey; Compare shows the screen they open.
  return [...document.querySelectorAll(".flow-nav a[href^='#']")]
    .map((l) => ({ id: { ad: "b1" }[l.getAttribute("href").slice(1)] ?? l.getAttribute("href").slice(1), name: l.textContent.trim() }))
    .filter((s, i, all) => ROUTES.includes(s.id) && all.findIndex((t) => t.id === s.id) === i);
}

function compareRoute() {
  const id = location.hash.slice(1);
  return ROUTES.includes(id) ? id : "tv";
}

function compareFrames() {
  return [...compareEl.querySelectorAll("iframe")];
}

function setCompareUrl(on) {
  const url = new URL(location.href);
  if (on) url.searchParams.set("compare", "1");
  else url.searchParams.delete("compare");
  history.replaceState(history.state, "", url);
}

function showCompareRoute(id, fromFrame) {
  if (location.hash.slice(1) !== id) location.replace("#" + id); // the page behind stays in step, so closing lands here
  compareEl.querySelector("[data-compare-screen]").value = id;
  compareFrames().forEach((f) => {
    if (f.contentWindow !== fromFrame) f.contentWindow?.postMessage({ tt: "go", id }, location.origin);
  });
}

function fitCompare() {
  if (!compareEl || compareEl.hidden) return;
  const grid = compareEl.querySelector(".compare-grid");
  const caption = compareEl.querySelector("figcaption").offsetHeight + 8;
  // Try one row of four and a 2 × 2 grid; use whichever shows the phones bigger.
  const fit = (cols) => {
    const rows = 4 / cols;
    const gap = cols === 4 ? 24 : 12;
    const w = (grid.clientWidth - gap * (cols - 1)) / cols;
    const h = (grid.clientHeight - gap * (rows - 1)) / rows - caption;
    return { cols, gap, s: Math.max(0.2, Math.min(w / 375, h / 812, 1)) };
  };
  const a = fit(4), b = fit(2);
  const best = a.s >= b.s ? a : b;
  grid.style.setProperty("--cols", best.cols);
  grid.style.setProperty("--gap", best.gap + "px");
  grid.style.setProperty("--s", best.s.toFixed(3));
}

function buildCompare() {
  compareEl = document.createElement("div");
  compareEl.className = "compare";
  compareEl.hidden = true;
  compareEl.setAttribute("role", "dialog");
  compareEl.setAttribute("aria-modal", "true");
  compareEl.setAttribute("aria-labelledby", "compare-title");
  compareEl.innerHTML = `
    <header class="compare-bar">
      <h2 class="compare-title" id="compare-title" tabindex="-1">Compare colours</h2>
      <div class="compare-nav">
        <button class="compare-step" type="button" data-compare-step="-1" aria-label="Previous screen"><img src="assets/icon-chevron-left.svg" alt=""></button>
        <select class="compare-screen" data-compare-screen aria-label="Screen">
          ${compareScreens().map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
        </select>
        <button class="compare-step" type="button" data-compare-step="1" aria-label="Next screen"><img src="assets/icon-chevron-right.svg" alt=""></button>
      </div>
      <button class="compare-close" type="button" data-compare-close aria-label="Close compare"><img src="assets/icon-close.svg" alt=""></button>
    </header>
    <p class="compare-hint">Tap through any phone and all four follow.</p>
    <div class="compare-grid">
      ${PALETTES.map((p) => `
        <figure class="compare-cell">
          <figcaption>
            <span class="palette-swatch" data-palette="${p.id}" aria-hidden="true"></span>
            <b>${p.id} · ${p.name}</b>
            <button class="compare-use" type="button" data-compare-use="${p.id}">Use this</button>
          </figcaption>
          <div class="compare-frame"><iframe data-palette-frame="${p.id}" title="Option ${p.id}, ${p.name}"></iframe></div>
        </figure>`).join("")}
    </div>`;
  document.body.append(compareEl);

  compareEl.addEventListener("click", (e) => {
    const step = e.target.closest("[data-compare-step]");
    if (step) {
      const list = compareScreens();
      const i = list.findIndex((s) => s.id === compareEl.querySelector("[data-compare-screen]").value);
      const next = list[(i + Number(step.dataset.compareStep) + list.length) % list.length];
      showCompareRoute(next.id);
      return;
    }
    if (e.target.closest("[data-compare-close]")) { closeCompare(); return; }
    const use = e.target.closest("[data-compare-use]");
    if (use) {
      const p = setPalette(use.dataset.compareUse);
      closeCompare();
      if (!document.body.matches('[data-route="tv"]')) toast(`Colour ${p.id} · ${p.name}`);
    }
  });
  compareEl.querySelector("[data-compare-screen]").addEventListener("change", (e) => showCompareRoute(e.target.value));

  // A phone moved to another screen: bring the other three along.
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.data?.tt !== "route" || compareEl.hidden) return;
    if (ROUTES.includes(e.data.id)) showCompareRoute(e.data.id, e.source);
  });
  // Refit whenever the space changes (window resize, phone rotation, toolbar wrapping).
  new ResizeObserver(fitCompare).observe(compareEl.querySelector(".compare-grid"));
}

function openCompare() {
  if (!compareEl) buildCompare();
  if (!compareEl.hidden) return;
  compareReturnFocus = document.activeElement;
  const id = compareRoute();
  compareEl.querySelector("[data-compare-screen]").value = id;
  compareFrames().forEach((f) => { f.src = `${location.pathname}?palette=${f.dataset.paletteFrame}&embed=1#${id}`; });
  compareEl.hidden = false;
  document.body.classList.add("is-comparing");
  setCompareUrl(true);
  fitCompare();
  compareEl.querySelector("#compare-title").focus();
}

function closeCompare() {
  if (!compareEl || compareEl.hidden) return false;
  compareEl.hidden = true;
  compareFrames().forEach((f) => { f.src = "about:blank"; }); // stop four copies running in the background
  document.body.classList.remove("is-comparing");
  setCompareUrl(false);
  (compareReturnFocus?.isConnected ? compareReturnFocus : paletteSwitch.querySelector("[data-palette-toggle]")).focus();
  return true;
}

function initEmbed() {
  window.addEventListener("hashchange", () => {
    parent.postMessage({ tt: "route", id: location.hash.slice(1) }, location.origin);
  });
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.data?.tt !== "go") return;
    if (location.hash.slice(1) !== e.data.id) location.replace("#" + e.data.id);
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (closeCompare()) return;
  if (closePalettePanel()) return;
  closeSheet();
  if (SECTION_OF[location.hash.slice(1)] && /^#(d3|f2|f3)$/.test(location.hash)) go(SECTION_OF[location.hash.slice(1)], { replace: true });
  if (/^#g[23]$/.test(location.hash)) closeStory();
});

buildGrids();
buildFeeds();
buildAllPhotos();
buildPicker();
initSetupForm();
initPhoneForms();
initMomentForm();
initFamilyForms();
initStoryPlayer();
initSheetSwipe();
if (EMBED) initEmbed();
else initPaletteSwitch();
window.addEventListener("hashchange", render);
render();
if (!EMBED && new URLSearchParams(location.search).has("compare")) openCompare();
