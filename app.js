// TeaTime onboarding v2.1 — hash router, Home feed template and screen behaviour.

const GRID_PHOTOS = ["birthday", "beach", "newborn", "dog", "roses", "dinner", "trophy", "drawing"];

// Inside Compare, each phone is this page in a frame with ?embed=1.
const EMBED = new URLSearchParams(location.search).has("embed");

const ROUTES = [
  "tv", "a1", "a2", "a3", "b1", "b-a2", "b2", "b3", "b4", "b5", "b6",
  "c1", "c2", "c3", "photos-off", "all-photos", "picker", "moment", "shared",
  "e1", "e2", "e4", "e5", "e6", "e7", "declined", "f1", "f4",
  "home", "home-connect", "home-sent", "home-approve", "g2", "g3",
  "families", "families-add", "family", "family-edit", "family-new", "notifications", "profile",
];
// Routes drawn by another screen's section: sheets over Home (D3, F2, F3), the story player, E1 after a decline.
const SECTION_OF = { "b-a2": "a2", "home-connect": "home", "home-sent": "home", "home-approve": "home", "families-add": "families", declined: "e1", g2: "story", g3: "story" };
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
    saveSession({ provider, ...(loadSession().joinVia === "tvqr" ? { first: "Tom", last: "Nguyen" } : { first: "Sarah", last: "Johnson" }) });
    go(afterSignIn());
  }, 1400);
}

// Swipe a sheet down to close it, like the phone’s own sheets (the connect sheet means “later”).
function initSheetSwipe() {
  device.querySelectorAll(".system-sheet, .connect-sheet, .option-sheet").forEach((sheet) => {
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
      if (moved > 80) {
        if (!sheet.classList.contains("connect-sheet") && !sheet.classList.contains("option-sheet")) closeSheet();
        else if (sheet.closest("[data-overlay]")) closeOverlays();
        else go(SECTION_OF[location.hash.slice(1)] || "home", { replace: true });
      }
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
    saveSession({ first: nameForm.first.value.trim(), last: nameForm.last.value.trim(), provider: null });
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

function initMomentForm() {
  const form = document.getElementById("moment-form");
  form.caption.addEventListener("input", () => saveSession({ caption: form.caption.value }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { picked = [], caption = "" } = loadSession();
    if (!picked.length) return go("picker");
    const moment = { photos: picked, caption: caption.trim() };
    // The 4th upload asks for a subscription first; nothing is sent until they choose.
    if (needsPaywall()) {
      saveSession({ pendingMoment: { moment } });
      return go("f4");
    }
    startMomentUpload(moment);
  });
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
    // Path A started on the TV: that TV is added to the family named here (A1 note).
    ensureOwnFamily(name, loadSession().path === "a" ? { tvs: [{ name: "Lisa’s TV", place: "Living room", state: "on" }] } : {});
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
    saveSession({ family: "The Johnsons", joinedBy: "pin", inOnboarding: false });
    joinFamily(johnsonsFamily("member"));
    seedFamilyEvents();
    addEvent({ kind: "person", who: "Sarah", text: "You joined <b>The Johnsons</b>" });
    queuePush("You’ve joined The Johnsons. Their moments are playing on Lisa’s TV.");
    pinForm.pin.value = "";
    paintPin();
    go("home");
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

/* ---------- Flows: what each choice does to the state, then where it goes ---------- */

// The family's moments and TV live in home.js; these are the onboarding steps that change them.
function bulkFromPhotos(keptOnly) {
  const count = photoCount();
  addMyMoment({ kind: "bulk", photos: GRID_PHOTOS, count, meta: `${count} photos · May – Oct 2026`, caption: "" });
  countUpload();
}

// After "Send now" / "Send N photos": path A has the TV in front of them, so they start arriving.
function sendAll() {
  bulkFromPhotos(false);
  if (tvOnList(currentFamily()).length) startBulkUpload();
  go("home");
}

// "Keep these" (path B): photos are kept for the TV, then Which TV.
function keepAll() {
  bulkFromPhotos(true);
  go("b3");
}

// Where a shared moment lands. A first share with no TV asks for one (D3); path B in onboarding goes on to Which TV.
function afterShareRoute() {
  const s = loadSession();
  const f = currentFamily();
  if (f && !f.tvs.length && !s.connectSeen) {
    saveSession({ connectSeen: true });
    return s.path === "b" && s.inOnboarding ? "b3" : "home-connect";
  }
  return "shared";
}

const SHARE_STEP_MS = 420;
let uploadTimer = null;

// Share: the photos upload one by one over the preview, then the Shared screen (or D3 / B3).
function startMomentUpload(moment) {
  const screen = device.querySelector('[data-screen="moment"]');
  const overlay = screen.querySelector("[data-upload-overlay]");
  const fam = currentFamily();
  overlay.hidden = false;
  screen.querySelector("[data-upload-title]").textContent = `Sharing to ${fam?.name || "your family"}…`;
  screen.querySelector("[type=submit]").hidden = true;
  screen.querySelector("[data-upload-cancel]").hidden = false;
  let done = 0;
  const total = moment.photos.length;
  const step = () => {
    done += 1;
    screen.querySelector("[data-upload-count]").textContent = `${Math.min(done, total)} of ${plural(total, "photo")}`;
    if (done < total) uploadTimer = setTimeout(step, SHARE_STEP_MS);
    else uploadTimer = setTimeout(() => finishMoment(moment), 500);
  };
  screen.querySelector("[data-upload-count]").textContent = `0 of ${plural(total, "photo")}`;
  uploadTimer = setTimeout(step, SHARE_STEP_MS);
}

function resetMomentUpload() {
  clearTimeout(uploadTimer);
  const screen = device.querySelector('[data-screen="moment"]');
  screen.querySelector("[data-upload-overlay]").hidden = true;
  screen.querySelector("[type=submit]").hidden = false;
  screen.querySelector("[data-upload-cancel]").hidden = true;
}

function finishMoment(moment) {
  countUpload();
  addMyMoment({ kind: "own", photos: moment.photos, count: moment.photos.length, meta: `Just now · ${plural(moment.photos.length, "photo")}`, caption: moment.caption });
  saveSession({ picked: [], caption: "", pendingMoment: null, lastShared: moment });
  const f = currentFamily();
  const tv = tvOnList(f)[0];
  if (tv) later(() => addEvent({ kind: "person", who: ownerOf(tv.name) || "Lisa", text: `<b>${ownerOf(tv.name) || "Lisa"}</b> saw your photo on the big screen`, thumb: moment.photos[0] }), 4000);
  resetMomentUpload();
  go(afterShareRoute(), { replace: true });
}

function handleNewClick(el) {
  if (handleHomeClick(el)) return true;
  if (el.dataset.story) {
    saveSession({ storyFrom: location.hash.slice(1) || "home" });
    go(el.dataset.story);
  } else if (el.hasAttribute("data-story-close")) {
    closeStory();
  } else if (el.hasAttribute("data-send-all")) {
    sendAll();
  } else if (el.hasAttribute("data-keep-all")) {
    keepAll();
  } else if (el.hasAttribute("data-skip-photos")) {
    // Skip: Home with nothing sent (D1).
    saveSession({ path: "d", inOnboarding: false });
    go("home");
  } else if (el.dataset.community) {
    saveSession({ community: el.dataset.community, residentDraft: null });
    go("e5");
  } else if (el.hasAttribute("data-resident-join") || el.hasAttribute("data-care-continue")) {
    // Matched: joins the resident's family. No match: a family is made at once and the community is told.
    // Photos next, as in Flow 2.
    const r = careResident();
    ensureOwnFamily(`${possessive(r.first)} family`, { forWhom: r.first, community: loadSession().community || DEFAULT_COMMUNITY });
    saveSession({ family: `${possessive(r.first)} family`, path: "b" });
    go(photoPrompt());
  } else if (el.hasAttribute("data-not-family")) {
    saveSession({ joinVia: null });
    go("e1");
  } else if (el.hasAttribute("data-ask-join")) {
    // Their own (empty) Home while the admin decides.
    ensureOwnFamily(familyFromSurname(loadSession().last) || "My family");
    saveSession({ joinPending: true, joinVia: null, inOnboarding: false });
    go("home-sent");
  } else if (el.dataset.approve) {
    const yes = el.dataset.approve === "yes";
    if (yes) {
      const f = currentFamily();
      updateFamily(f.id, (fam) => ({ members: [...fam.members, { first: "Tom", last: "Nguyen", rel: "" }] }));
      addEvent({ kind: "person", who: "Tom", text: "<b>Tom</b> joined The Johnsons" });
    }
    go("home", { replace: true });
    toast(yes ? "Tom is in. He’s been told “You’re in”." : "Tom has been told. Nothing else changes.");
  } else if (el.hasAttribute("data-connect-close")) {
    go("home", { replace: true });
  } else if (el.hasAttribute("data-tv-later")) {
    saveSession({ inOnboarding: false });
    go("home");
  } else if (el.hasAttribute("data-tv-scan")) {
    connectTvHere();
    saveSession({ inOnboarding: false });
    go("home");
  } else if (el.hasAttribute("data-shared-done")) {
    go(loadSession().path === "b" && loadSession().inOnboarding && !currentFamily()?.tvs.length ? "b3" : "home");
  } else if (el.hasAttribute("data-upload-cancel")) {
    resetMomentUpload();
    toast("Not shared");
  } else if (el.hasAttribute("data-push")) {
    el.classList.remove("is-shown");
    if (el.dataset.pushGo) go(el.dataset.pushGo);
  } else if (el.hasAttribute("data-subscribe")) {
    saveSession({ subscribed: true });
    const { pendingMoment } = loadSession();
    toast("Subscribed. Demo only — no payment taken.");
    if (pendingMoment) { saveSession({ resumeUpload: true }); go("moment", { replace: true }); }
    else go("home");
  } else if (el.hasAttribute("data-not-now")) {
    // Nothing is uploaded; back to Home. The family is told what's waiting.
    const f = currentFamily();
    saveSession({ pendingMoment: null, picked: [], caption: "" });
    addEvent({ kind: "plan", text: `1 moment is waiting until <b>${escapeHtml(f?.name || "your family")}</b> subscribes`, icon: "hourglass" });
    go("home");
    toast("Not uploaded");
  } else if (el.hasAttribute("data-paywall-back")) {
    loadSession().pendingMoment ? go("moment") : history.length > 1 ? history.back() : go("home");
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
    saveSession({ inOnboarding: true });
    if (route === "declined") {
      saveSession({ joinVia: null, joinPending: false });
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
  home(route, screen) {
    // Reaching Home ends onboarding; a person without a family yet (e.g. deep link) gets an empty own family.
    saveSession({ inOnboarding: false });
    if (!families().length) ensureOwnFamily(familyFromSurname(loadSession().last) || "My family");
    renderHome(route, screen);
  },
  shared(_, screen) {
    const s = loadSession();
    const f = currentFamily();
    const m = s.lastShared || { photos: ["dinner"] };
    const tv = tvOnList(f)[0];
    screen.querySelector("[data-shared-photo]").src = photoSrc(m.photos[0]);
    screen.querySelector("[data-shared-title]").textContent = `Shared to ${f?.name || "your family"}`;
    screen.querySelector("[data-shared-sub]").textContent = tv
      ? (ownerOf(tv.name) && tv.name !== "Living room TV" ? `${ownerOf(tv.name)} will see it on the TV within a minute.` : "It’ll be on the TV within a minute.")
      : tvWaiting(f) ? `It plays as soon as ${tvWaiting(f).name} is connected.` : "It plays as soon as a TV is connected.";
    screen.querySelector("[data-last-free]").hidden = !((s.uploads || 0) === 3 && !s.subscribed && !s.community);
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
  ...TAB_ENTER,
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
    // "Sharing to" shows the family named at sign-in (or the one picked on Home), and how many free uploads are left.
    const fam = currentFamily();
    const s = loadSession();
    screen.querySelector("[data-family-name]").textContent = fam?.name || s.family || "Your moments";
    const initial = screen.querySelector("[data-family-initial-share]");
    initial.textContent = fam ? (fam.name.replace(/^The /, "")[0] || "?").toUpperCase() : "";
    const left = Math.max(0, 3 - (s.uploads || 0));
    screen.querySelector("[data-share-sub]").textContent = !s.subscribed && !s.community
      ? (left ? `${plural(left, "free upload")} left` : "Subscribe to keep sending")
      : fam && fam.members.length > 1 ? `${fam.members.length} members` : "Just you for now";
    resetMomentUpload();
    // Back from the paywall after subscribing: the moment they were sharing goes through now.
    if (s.resumeUpload && s.pendingMoment) {
      saveSession({ resumeUpload: false });
      startMomentUpload(s.pendingMoment.moment);
    }
  },
  b6(_, screen) {
    const t = setupText(loadSetup());
    screen.querySelector("[data-b6-title]").textContent = t.title;
    screen.querySelector("[data-message]").innerHTML =
      `<p>${t.greeting}</p><p>${t.steps.join("<br>")}</p><p>${t.sign}</p>`;
  },
};

function render() {
  const entry = ENTRY[location.hash.slice(1)] || PRESETS[location.hash.slice(1)];
  if (entry) return go(entry(), { replace: true });
  const route = ROUTES.includes(location.hash.slice(1)) ? location.hash.slice(1) : "tv";
  const sectionId = SECTION_OF[route] || route;

  timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  timers = [];
  if (sectionId !== "moment") clearTimeout(uploadTimer); // left New moment mid-upload: nothing is sent
  closeSheet();

  // Remember the journey so shared screens (sign in, photo prompt) continue the right way.
  if (route === "tv" || route === "a1") saveSession({ path: "a", joinVia: null });
  if (route === "b1") saveSession({ path: "b" });

  document.body.dataset.route = route;
  let current;
  document.querySelectorAll("[data-screen]").forEach((s) => {
    const on = s.dataset.screen === sectionId;
    if (s.closest(".device")) s.hidden = !on;
    if (on) current = s;
  });

  if (current.querySelector("[data-signin]")) resetSigningIn(current);
  current.querySelectorAll("[data-author]").forEach((el) => { el.textContent = fullName(); });
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
  const el = e.target.closest("[data-go], [data-todo], [data-share], [data-push], [data-signin], [data-sheet-close], [data-sheet-confirm], [data-email-option], [data-back], [data-picker], [data-photos-found], [data-all-confirm], [data-pick-tile], [data-picker-photo], [data-picker-close], [data-picker-next], [data-tv-later], [data-tv-scan], [data-connect-close], [data-invite], [data-story], [data-story-close], [data-approve], [data-not-family], [data-resident-join], [data-care-continue], [data-subscribe], [data-not-now], [data-paywall-back], [data-community], [data-nav], [data-group-toggle], [data-switch-family], [data-like], [data-save], [data-more], [data-save-item], [data-save-confirm], [data-more-action], [data-confirm-yes], [data-overlay-close], [data-dismiss-nudge], [data-open-family], [data-connect-family], [data-share-pin], [data-leave-family], [data-delete-family], [data-mark-read], [data-send-all], [data-keep-all], [data-skip-photos], [data-ask-join], [data-shared-done], [data-upload-cancel]");
  if (!el) return;
  if (handleNewClick(el)) return;
  if (el.dataset.go) {
    closeOverlays();
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
    loadSession().path === "b" ? keepAll() : sendAll();
  }
  else if (el.dataset.pickerPhoto) togglePickerPhoto(el.dataset.pickerPhoto);
  else if (el.hasAttribute("data-picker-close")) { saveSession({ picked: [] }); go(loadSession().pickerFrom || photosFound()); }
  else if (el.hasAttribute("data-picker-next")) go("moment");
  // Which TV / connect steps are shared by path B and row D; only where they finish differs.
  else if (el.hasAttribute("data-invite")) shareInvite();
  else if (el.dataset.signin) openSheet(el.dataset.signin);
  else if (el.hasAttribute("data-sheet-close")) closeSheet();
  else if (el.dataset.sheetConfirm) startSigningIn(el.dataset.sheetConfirm);
  else if (el.hasAttribute("data-back")) go(signInScreen());
  else if (el.hasAttribute("data-email-option")) {
    el.parentElement.querySelectorAll("[data-email-option]").forEach((o) => o.setAttribute("aria-checked", String(o === el)));
  }
  else if (el.dataset.todo) { closeOverlays(); toast(`Not in this build yet: ${el.dataset.todo}`); }
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
  tvSetupSent();
  saveSession({ inOnboarding: false });
  go("home");
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
  const openOverlay = device.querySelector("[data-overlay]:not([hidden])");
  if (openOverlay) return closeOverlays();
  const menu = device.querySelector("[data-group-menu]:not([hidden])");
  if (menu) { menu.hidden = true; return; }
  if (/^#(home-connect|home-sent|home-approve|families-add)$/.test(location.hash)) go(SECTION_OF[location.hash.slice(1)], { replace: true });
  if (/^#g[23]$/.test(location.hash)) closeStory();
});

buildGrids();
buildAllPhotos();
buildPicker();
initSetupForm();
initPhoneForms();
initMomentForm();
initFamilyForms();
initTabForms();
initStoryPlayer();
initSheetSwipe();
if (EMBED) initEmbed();
else initPaletteSwitch();
window.addEventListener("hashchange", render);
render();
if (!EMBED && new URLSearchParams(location.search).has("compare")) openCompare();
