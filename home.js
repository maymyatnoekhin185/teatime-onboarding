// TeaTime — the app's state after onboarding, Home built from it, and the four tabs.
// Figma has many Home frames; here there is one Home that shows what this person actually did:
// what they uploaded (everything, their own pick, nothing), which TV is on or waiting, which family they're in.

/* ---------- Families and moments ---------- */

const PHOTO_SET = ["newborn", "birthday", "beach", "dog", "roses", "dinner", "trophy", "drawing"];
const photoSrc = (p) => (p === "hero" ? "assets/hero-photo.png" : `assets/photo-${p}.png`);
const cycle = (list, n) => Array.from({ length: n }, (_, i) => list[i % list.length]);

// The demo family a second member joins (PIN, small QR, approval). Placeholder data.
function johnsonsFamily(role = "member") {
  return {
    id: "johnsons",
    name: "The Johnsons",
    forWhom: "Lisa",
    role,
    pin: FAMILY_PIN,
    members: [
      { first: "Sarah", last: "Johnson", rel: "Daughter", admin: true, moments: 14 },
      { first: "Tom", last: "Johnson", rel: "Grandson", moments: 3 },
      { first: "Ed", last: "Johnson", rel: "Son", moments: 9 },
      { first: "Priya", last: "Johnson", rel: "Daughter-in-law", moments: 9 },
    ],
    tvs: [{ name: "Lisa’s TV", place: "Living room", state: "on" }],
    moments: [
      { id: "j1", kind: "family", author: "Sarah Johnson", photos: cycle(PHOTO_SET, 9), meta: "25 December 2025 · 9 photos", caption: "", likes: 3, seen: "Seen on Lisa’s TV · 2h" },
      { id: "j2", kind: "family", author: "Ed Johnson", photos: ["dinner", "roses", "trophy"], meta: "24 December 2025 · 3 photos", caption: "Sunday lunch with everyone 🥂", likes: 1 },
      { id: "j3", kind: "family", author: "Priya Johnson", photos: ["drawing", "dog"], meta: "20 December 2025 · 2 photos", caption: "Fridge art from Lily", likes: 2 },
    ],
  };
}

function nanFamily() {
  return {
    id: "nan",
    name: "Nan’s place",
    forWhom: "Nan",
    role: "member",
    pin: "9051",
    members: [{ first: "Joan", last: "Smith", rel: "Mother", admin: true, moments: 11 }, { first: "Bev", last: "Smith", rel: "Sister", moments: 6 }, { first: "Max", last: "Smith", rel: "Nephew", moments: 2 }, { first: "Ann", last: "Smith", rel: "Aunt", moments: 4 }, { first: "Kim", last: "Smith", rel: "Cousin", moments: 1 }],
    tvs: [{ name: "Nan’s TV", place: "Lounge", state: "on" }],
    moments: [{ id: "n1", kind: "family", author: "Bev Smith", photos: ["roses", "dinner", "dog", "beach", "trophy"], meta: "Yesterday · 5 photos", caption: "Afternoon tea at Nan’s ☕", likes: 4 }],
  };
}

const me = () => ({ first: loadSession().first || "Me", last: loadSession().last || "" });
const meName = () => `${me().first} ${me().last}`.trim();
const families = () => loadSession().families || [];
function currentFamily() {
  const s = loadSession();
  const list = s.families || [];
  return list.find((f) => f.id === s.familyId) || list[0] || null;
}
function saveFamilies(list, familyId) {
  saveSession({ families: list, familyId: familyId ?? loadSession().familyId ?? list[0]?.id ?? null });
}
function updateFamily(id, patch) {
  const list = families().map((f) => (f.id === id ? { ...f, ...(typeof patch === "function" ? patch(f) : patch) } : f));
  saveFamilies(list);
}
// The person's own family, made on E1 (or for the resident on E6 / E7). Created once, renamed later.
function ensureOwnFamily(name, extra = {}) {
  const list = families();
  const own = list.find((f) => f.id === "own");
  if (own) {
    updateFamily("own", { name, ...extra });
  } else {
    list.push({ id: "own", name, forWhom: "", role: "admin", pin: "2604", members: [{ ...me(), rel: "", admin: true, isMe: true }], tvs: [], moments: [], ...extra });
    saveFamilies(list, "own");
  }
  saveSession({ familyId: "own" });
}
function joinFamily(fam) {
  const list = families().filter((f) => f.id !== fam.id);
  fam.members = [...fam.members, { ...me(), rel: "", isMe: true }];
  list.push(fam);
  saveFamilies(list, fam.id);
}
const isMineMoment = (m) => m.kind === "bulk" || m.kind === "own";
const tvOnList = (f) => (f?.tvs || []).filter((t) => t.state === "on");
const tvWaiting = (f) => (f?.tvs || []).find((t) => t.state === "waiting");
const ownerOf = (tvName) => (tvName || "").replace(/’s TV$/, "");

// Add a moment the person made to the current family (newest first).
function addMyMoment(m) {
  const f = currentFamily();
  if (!f) return;
  updateFamily(f.id, (fam) => ({ moments: [{ id: `m${Date.now()}`, author: meName(), likes: 0, ...m }, ...fam.moments] }));
}

/* ---------- Events → notifications and push banners ---------- */

function addEvent(e) {
  const events = loadSession().events || [];
  saveSession({ events: [{ id: `e${Date.now()}${Math.random().toString(16).slice(2, 6)}`, at: Date.now(), unread: true, ...e }, ...events] });
}
const unreadCount = () => (loadSession().events || []).filter((e) => e.unread).length;
function queuePush(text, go) { saveSession({ push: { text, go: go || null } }); }

/* ---------- Things that happen over time (stand-ins for the other phone / TV) ---------- */

// Bulk "Send now" (or the TV joining with photos waiting): count them in, then they're all on the TV.
function startBulkUpload() {
  const f = currentFamily();
  const bulk = f?.moments.find((m) => m.kind === "bulk");
  if (!bulk) return;
  saveSession({ uploading: { total: bulk.count, done: Math.min(38, bulk.count) } });
}

// Which TV / Scan the TV's code: the TV in front of them pairs itself.
function connectTvHere() {
  const f = currentFamily();
  if (!f) return;
  const name = loadSession().path === "a" ? "Lisa’s TV" : "Living room TV";
  updateFamily(f.id, { tvs: [{ name, place: "Living room", state: "on" }] });
  addEvent({ kind: "tv", text: `<b>${name}</b> is connected`, icon: "tv" });
  if (f.moments.some((m) => m.kind === "bulk")) startBulkUpload();
  else if (f.moments.length) saveSession({ inviteNudge: true });
}

// Set-up message sent: that TV is waiting until someone types the code on it.
function tvSetupSent() {
  const { who } = loadSetup();
  const f = currentFamily();
  if (!f) return;
  const name = who.trim() ? `${who.trim()}’s TV` : "Their TV";
  updateFamily(f.id, { tvs: [{ name, place: "", state: "waiting", who: who.trim() }] });
}

/* ---------- Home ---------- */

let homeTrackObserver = null;

function homeStatus(f) {
  const s = loadSession();
  if (s.uploading) return { text: `Adding ${s.uploading.done} of ${s.uploading.total} photos` };
  if (s.joinPending) return { text: "Waiting for Sarah" };
  const waiting = tvWaiting(f);
  if (waiting) return { text: `Waiting for ${waiting.who ? possessive(waiting.who) : "their"} TV` };
  if (f && !f.tvs.length && f.moments.length) return { text: "Waiting for a TV", toTv: true };
  return null;
}

function tvChip(f) {
  const s = loadSession();
  const on = tvOnList(f);
  if (s.uploading && on.length) return { label: "TV on", on: true };
  if (on.length > 1) return { label: `${on.length} TVs on`, on: true };
  if (on.length === 1) return { label: on[0].name === "Living room TV" ? "TV on" : `${on[0].name} on`, on: true };
  return { label: "No TV yet", on: false, toTv: true };
}

function slideMarkup(m, i, f) {
  const n = m.count || m.photos.length;
  const photos = m.photos.length >= n ? m.photos.slice(0, n) : cycle(m.photos, Math.min(n, 12));
  const mine = isMineMoment(m);
  const caption = m.caption
    ? `<p class="caption">${escapeHtml(m.caption)}</p>`
    : mine ? `<button class="caption" type="button" data-todo="Adding a caption">${m.kind === "bulk" ? "Six months in one go — add a caption" : "Add a caption"}</button>` : "";
  const shown = Math.min(photos.length, 12);
  return `
    <article class="moment-slide" data-moment="${m.id}" aria-label="${escapeHtml(m.author)}, ${n} photos" aria-roledescription="moment">
      <div class="moment-track" data-track>
        ${photos.slice(0, shown).map((p, k) => `<img class="feed-photo" src="${photoSrc(p)}" alt="" ${i === 0 && k === 0 ? "" : 'loading="lazy"'} decoding="async">`).join("")}
      </div>
      <div class="feed-shade"></div>
      <p class="glass-pill right" data-count>1 / ${n}</p>
      ${m.kind === "bulk" ? `
      <div class="stories" aria-label="Stories from this moment">
        <button class="story-btn" type="button" data-story="g2"><span class="story-ring"><img src="assets/story-cover-timeline.png" alt=""></span><span class="story-label">Timeline</span></button>
        <button class="story-btn" type="button" data-story="g3"><span class="story-ring"><img src="assets/story-cover-place.png" alt=""></span><span class="story-label">Da Lat</span></button>
      </div>` : ""}
      ${n > 1 ? `<span class="pagination${n <= 3 ? " dots-3" : ""}" data-dots aria-hidden="true"></span>` : ""}
      <div class="action-rail">
        <button type="button" data-like aria-pressed="${!!m.liked}"><span class="rail-heart" aria-hidden="true"></span><span data-like-count>${(m.likes || 0) + (m.liked ? 1 : 0)}</span><span class="sr-only"> likes</span></button>
        <button type="button" aria-label="Comments" data-todo="Comments"><img src="assets/icon-message-circle.svg" alt=""></button>
        <button type="button" data-save><img src="assets/icon-download.svg" alt="">Save</button>
        <button type="button" aria-label="More" data-more><img src="assets/icon-more-horizontal.svg" alt=""></button>
      </div>
      <div class="caption-panel">
        <div class="author-row">
          <span class="avatar-ring">${mine && loadSession().provider ? `<img src="assets/avatar-sarah.png" alt="">` : `<span class="avatar-initial">${escapeHtml(m.author[0] || "?")}</span>`}</span>
          <span class="author"><span class="author-name">${escapeHtml(m.author)}</span><span class="author-meta">${escapeHtml(m.meta)}</span></span>
        </div>
        ${caption}
        ${m.seen ? `<p class="seen-on"><img src="assets/icon-tv-small.svg" alt="" width="14" height="14">${escapeHtml(m.seen)}</p>` : ""}
      </div>
    </article>`;
}

function renderHome(route, screen) {
  const s = loadSession();
  const f = currentFamily();
  const list = families();
  const multi = (f?.members.length || 1) > 1;
  screen.querySelector("[data-home-title]").textContent = multi ? f.name : "Your moments";
  const chip = tvChip(f);
  const chipEl = screen.querySelector("[data-tv-chip]");
  chipEl.innerHTML = `<img src="assets/status-dot-${chip.on ? "green" : "grey"}.svg" alt="">${escapeHtml(chip.label)}`;
  chipEl.disabled = !chip.toTv;
  screen.querySelector("[data-members]").textContent = multi ? `·  ${f.members.length} members` : "·  Just you";
  screen.querySelector("[data-group-toggle]").hidden = false;

  // Feed or empty state
  const moments = f?.moments || [];
  const feed = screen.querySelector("[data-feed]");
  screen.classList.toggle("is-empty", !moments.length);
  screen.querySelector("[data-home-empty]").hidden = !!moments.length;
  feed.innerHTML = moments.map((m, i) => slideMarkup(m, i, f)).join("");
  feed.scrollTop = 0;
  initTracks(feed);

  // Status pill (uploading / waiting) or the invite nudge once a TV is on and it's just you
  const status = homeStatus(f);
  const pill = screen.querySelector("[data-home-pill]");
  const nudge = screen.querySelector("[data-nudge]");
  // D5: once a TV joins after they shared, invite the family (TV first, family second).
  const showNudge = !status && moments.length && tvOnList(f).length && !multi && s.inviteNudge && !s.inviteDismissed;
  nudge.hidden = !showNudge;
  screen.classList.toggle("has-nudge", !!showNudge);
  pill.hidden = !status || !moments.length;
  if (status) {
    pill.textContent = status.text;
    pill.disabled = !status.toTv;
  }

  // Group menu
  screen.querySelector("[data-group-menu]").innerHTML = `
    ${list.map((fam) => `<button type="button" role="menuitemradio" aria-checked="${fam.id === f?.id}" data-switch-family="${fam.id}">${escapeHtml(fam.name)}${fam.id === f?.id ? `<img src="assets/icon-check.svg" alt="" width="16" height="16">` : ""}</button>`).join("")}
    <button type="button" role="menuitem" class="group-create" data-go="family-new">+  Create a family group</button>`;
  screen.querySelector("[data-group-menu]").hidden = true;
  screen.querySelector("[data-group-toggle]").setAttribute("aria-expanded", "false");

  // Sheets over Home: each shows only on its own route
  screen.querySelectorAll("[data-home-sheet]").forEach((sh) => { sh.hidden = sh.dataset.homeSheet !== route; });
  closeOverlays(screen);

  // Push banner waiting to be shown
  const push = screen.querySelector("[data-push]");
  push.classList.remove("is-shown");
  if (s.push && route === "home") {
    screen.querySelector("[data-push-body]").textContent = s.push.text;
    push.dataset.pushGo = s.push.go || "";
    later(() => push.classList.add("is-shown"), 350);
    later(() => { if (!push.dataset.pushGo) push.classList.remove("is-shown"); }, 6500);
    saveSession({ push: null });
  }

  paintNav(screen, "home");
  runHomeTimers(route, screen);
}

// Horizontal swipe inside a moment: counter "k / N" and the dots follow.
function initTracks(feed) {
  feed.querySelectorAll("[data-track]").forEach((track) => {
    const slide = track.closest(".moment-slide");
    const total = Number(slide.querySelector("[data-count]").textContent.split("/ ")[1]) || track.children.length;
    const paint = () => {
      const k = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      slide.querySelector("[data-count]").textContent = `${Math.min(k + 1, total)} / ${total}`;
      const dots = slide.querySelector("[data-dots]");
      if (dots) dots.style.setProperty("--dot-x", `${12 * Math.min(k, dots.classList.contains("dots-3") ? 2 : 4)}px`);
    };
    track.addEventListener("scroll", paint, { passive: true });
  });
}

function runHomeTimers(route, screen) {
  const s = loadSession();
  if (s.uploading) {
    const tick = setInterval(() => {
      const u = loadSession().uploading;
      if (!u) return clearInterval(tick);
      const done = Math.min(u.total, u.done + 3);
      saveSession({ uploading: { ...u, done } });
      const pill = screen.querySelector("[data-home-pill]");
      pill.textContent = `Adding ${done} of ${u.total} photos`;
      if (done >= u.total) {
        clearInterval(tick);
        later(() => {
          saveSession({ uploading: null });
          renderHome(location.hash.slice(1) || "home", screen);
        }, 900);
      }
    }, 110);
    timers.push(tick);
  }
  const waiting = tvWaiting(currentFamily());
  if (waiting && route === "home") {
    // In real life this happens whenever the other TV types the code.
    later(() => {
      const f = currentFamily();
      updateFamily(f.id, { tvs: f.tvs.map((t) => (t.state === "waiting" ? { ...t, state: "on" } : t)) });
      addEvent({ kind: "tv", text: `<b>${waiting.name}</b> is connected`, icon: "tv" });
      queuePush(setupText(loadSetup()).push);
      if (f.moments.some((m) => m.kind === "bulk")) startBulkUpload();
      else if (f.moments.length) saveSession({ inviteNudge: true });
      renderHome("home", screen);
    }, 5000);
  }
  if (s.joinPending && route === "home") {
    // Stand-in for the admin tapping Approve on their phone.
    later(() => {
      saveSession({ joinPending: false });
      joinFamily(johnsonsFamily("member"));
      addEvent({ kind: "person", who: "Sarah", text: "<b>Sarah</b> approved your request. You’re in The Johnsons" });
      seedFamilyEvents();
      queuePush("Sarah said yes. You’re in The Johnsons.");
      renderHome("home", screen);
    }, 5000);
  }
}

// What a family member's notifications look like once they're in a family with others.
function seedFamilyEvents() {
  if (loadSession().seededFamilyEvents) return;
  saveSession({ seededFamilyEvents: true });
  [
    { kind: "person", who: "Ed", text: "<b>Ed</b> joined The Johnsons", ago: "Yesterday, 6:40 pm", unread: false },
    { kind: "person", who: "Tom", text: "<b>Tom</b> shared 3 new photos to The Johnsons", ago: "Yesterday, 2:15 pm", thumb: "dinner", unread: false },
    { kind: "person", who: "Priya", text: "<b>Priya</b> commented: “Lovely day for it!”", ago: "3 hr ago", thumb: "roses" },
  ].reverse().forEach(addEvent);
}

/* ---------- Home overlays: group menu, More sheet, Save sheet, confirm ---------- */

function closeOverlays(scope = device) {
  scope.querySelectorAll("[data-overlay]").forEach((o) => { o.hidden = true; });
}

function openOverlay(name, fill) {
  const layer = device.querySelector(`[data-overlay="${name}"]`);
  fill?.(layer);
  layer.hidden = false;
  layer.querySelector("button")?.focus({ preventScroll: true });
}

function momentById(id) {
  return currentFamily()?.moments.find((m) => m.id === id);
}

function openMoreSheet(id) {
  const m = momentById(id);
  if (!m) return;
  const mine = isMineMoment(m);
  const others = families().filter((f) => f.id !== currentFamily().id);
  openOverlay("more", (layer) => {
    layer.dataset.moment = id;
    layer.querySelectorAll("[data-mine-only]").forEach((b) => { b.hidden = !mine; });
    layer.querySelector("[data-share-other]").hidden = !mine || !others.length;
  });
}

let saveDraft = new Set();
function openSaveSheet(id) {
  const m = momentById(id);
  if (!m) return;
  const items = (m.photos.length >= 4 ? m.photos : cycle(m.photos, Math.min(4, m.count || m.photos.length))).slice(0, 4);
  saveDraft = new Set(items.map((_, i) => i).slice(0, Math.min(2, items.length)));
  openOverlay("save", (layer) => {
    layer.querySelector("[data-save-grid]").innerHTML = items.map((p, i) => `
      <button class="save-item" type="button" aria-pressed="${saveDraft.has(i)}" data-save-item="${i}" aria-label="Photo ${i + 1}">
        <img src="${photoSrc(p)}" alt=""><span class="pick-tick"></span>
      </button>`).join("");
    paintSaveSheet(layer, items.length);
  });
}
function paintSaveSheet(layer, total) {
  layer.querySelectorAll("[data-save-item]").forEach((b) => b.setAttribute("aria-pressed", String(saveDraft.has(Number(b.dataset.saveItem)))));
  const n = saveDraft.size;
  layer.querySelector("[data-save-sub]").textContent = `Choose what to keep · ${n} of ${total} selected`;
  const btn = layer.querySelector("[data-save-confirm]");
  btn.textContent = n ? `Save ${plural(n, "item")}` : "Choose what to save";
  btn.disabled = !n;
}

let confirmAction = null;
function confirmSheet({ title, body, action, danger, onConfirm }) {
  confirmAction = onConfirm;
  openOverlay("confirm", (layer) => {
    layer.querySelector("[data-confirm-title]").textContent = title;
    layer.querySelector("[data-confirm-body]").textContent = body;
    const yes = layer.querySelector("[data-confirm-yes]");
    yes.textContent = action;
    yes.classList.toggle("btn-danger", !!danger);
    yes.classList.toggle("btn-primary", !danger);
  });
}

/* ---------- Bottom nav (shared by Home and the tabs) ---------- */

function navMarkup() {
  return `
    <nav class="nav-pill" aria-label="Main">
      <button class="nav-item" type="button" aria-label="Home" data-nav="home"><span class="nav-icon nav-icon-home-tab" aria-hidden="true"></span></button>
      <button class="nav-item" type="button" aria-label="Families" data-nav="families"><span class="nav-icon nav-icon-users" aria-hidden="true"></span></button>
      <button class="nav-share" type="button" aria-label="Share a moment" data-picker><img src="assets/icon-plus.svg" alt=""></button>
      <button class="nav-item" type="button" aria-label="Notifications" data-nav="notifications"><span class="nav-icon nav-icon-bell" aria-hidden="true"></span><span class="nav-unread" data-nav-unread hidden></span></button>
      <button class="nav-item" type="button" aria-label="Profile" data-nav="profile"><span class="nav-icon nav-icon-user" aria-hidden="true"></span></button>
    </nav>`;
}

function paintNav(screen, active) {
  screen.querySelectorAll("[data-nav]").forEach((b) => {
    if (b.dataset.nav === active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  const unread = unreadCount();
  screen.querySelectorAll("[data-nav-unread]").forEach((d) => { d.hidden = !unread || active === "notifications"; });
  const bell = screen.querySelector('[data-nav="notifications"]');
  bell?.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
}

/* ---------- Tabs: Families, a family, edit, create; Notifications; Profile ---------- */

// A different soft tint per person so members are easy to tell apart.
// Pastel discs with a dark initial (like the reference and the TV family cards).
const TINTS = ["#d9c8ff", "#ffd1dc", "#c9ecff", "#cdf2d5", "#ffe2bf", "#f3d1ff"];
const tintFor = (name) => TINTS[[...(name || "?")].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length];
const memberDisc = (m, cls = "") => `<span class="member-disc ${cls}" style="background:${tintFor(m.first)}">${escapeHtml((m.first[0] || "?").toUpperCase())}</span>`;
// How many moments a person has shared here: the demo number, or counted from the feed.
const momentsBy = (f, m) => m.moments ?? f.moments.filter((x) => x.author === `${m.first} ${m.last}`.trim() || (m.isMe && isMineMoment(x))).length;
const familyInitial = (f) => (f.name.replace(/^The /, "")[0] || "?").toUpperCase();
const formatPin = (pin) => pin;
const tvCountText = (f) => (f.tvs.length ? plural(f.tvs.length, "TV") : "No TV yet");

function familyRow(f, attrs) {
  return `
    <button class="list-row" type="button" ${attrs}>
      <span class="row-avatar"><span class="avatar-disc is-pastel" style="background:${tintFor(f.name)}">${familyInitial(f)}</span>${tvOnList(f).length ? `<span class="row-tv-dot"></span>` : ""}</span>
      <span class="row-text"><span class="row-title">${escapeHtml(f.name)}</span>
        <span class="row-sub">${f.forWhom ? `For ${escapeHtml(f.forWhom)} · ` : ""}${plural(f.members.length, "member")} · ${tvCountText(f)}</span>
        <span class="row-sub">${f.role === "admin" ? "Admin" : "Member"} · PIN ${formatPin(f.pin)}</span></span>
      <img src="assets/icon-chevron-right.svg" alt="" width="20" height="20">
    </button>`;
}

const TAB_ENTER = {
  families(route, screen) {
    const list = families();
    screen.querySelector("[data-families-list]").innerHTML = list.length
      ? list.map((f) => familyRow(f, `data-open-family="${f.id}"`)).join("")
      : `<p class="empty-note">No family yet. Join one with a PIN or start your own.</p>`;
    screen.querySelector("[data-add-sheet]").hidden = route !== "families-add";
    paintNav(screen, "families");
  },
  family(_, screen) {
    const f = families().find((x) => x.id === loadSession().familyView) || currentFamily();
    if (!f) return go("families", { replace: true });
    saveSession({ familyView: f.id });
    screen.querySelector("[data-family-title]").textContent = f.name;
    screen.querySelector("[data-family-edit]").hidden = f.role !== "admin";
    screen.querySelector("[data-family-counts]").textContent = [f.forWhom ? `For ${f.forWhom}` : "", plural(f.members.length, "member"), tvCountText(f)].filter(Boolean).join(" · ");
    // Who's in the family at a glance: up to five faces, then "+N".
    const stackMembers = [...f.members].sort((x, y) => (y.admin ? 1 : 0) - (x.admin ? 1 : 0));
    screen.querySelector("[data-family-stack]").innerHTML = stackMembers.slice(0, 5).map((m) => memberDisc(m, "is-stack")).join("")
      + (f.members.length > 5 ? `<span class="member-disc is-stack is-more">+${f.members.length - 5}</span>` : "");
    // TVs: one grouped card, a row per TV with its state, and "Add a TV" at the end.
    screen.querySelector("[data-tv-label]").textContent = f.tvs.length > 1 ? `TVs · ${f.tvs.length}` : "TV";
    screen.querySelector("[data-family-tvs]").innerHTML = f.tvs.map((t) => `
        <div class="group-row">
          <span class="row-icon is-glass"><img src="assets/icon-tv.svg" alt="" width="20" height="20"></span>
          <span class="row-text"><span class="row-title">${escapeHtml(t.name)}</span><span class="row-sub">${t.state === "on" ? (t.place ? escapeHtml(t.place) : "Playing now") : "Waiting for the code"}</span></span>
          <span class="state-pill ${t.state === "on" ? "is-on" : "is-waiting"}">${t.state === "on" ? "On" : "Waiting"}</span>
        </div>`).join("") + `
        <button class="group-row group-add" type="button" data-connect-family="${f.id}">
          <span class="row-icon is-add"><img src="assets/icon-plus.svg" alt="" width="18" height="18"></span>
          <span class="row-text"><span class="row-title">${f.tvs.length ? "Add another TV" : "Connect a TV"}</span>${f.tvs.length ? "" : `<span class="row-sub">So moments play on the big screen</span>`}</span>
        </button>`;

    // Members: first four, then "Show all N" (expands in place). You first, admins next.
    const sorted = [...f.members].sort((x, y) => (y.isMe ? 2 : y.admin ? 1 : 0) - (x.isMe ? 2 : x.admin ? 1 : 0));
    const expanded = loadSession().membersOpen === f.id;
    const shown = expanded ? sorted : sorted.slice(0, 4);
    screen.querySelector("[data-members-label]").textContent = `Members · ${f.members.length}`;
    screen.querySelector("[data-family-members]").innerHTML = shown.map((m) => `
      <button class="group-row" type="button" data-todo="Member details">
        <span class="member-avatar">${memberDisc(m)}${m.admin ? `<span class="admin-badge" title="Admin"><img src="assets/icon-star.svg" alt="" width="10" height="10"></span>` : ""}</span>
        <span class="row-text"><span class="row-title">${escapeHtml(`${m.first} ${m.last}`.trim())}${m.isMe ? ` <span class="you-tag">(You)</span>` : ""}</span>
          <span class="row-sub">${[m.rel, m.admin ? "Admin" : "", (momentsBy(f, m) ? plural(momentsBy(f, m), "moment") : "No moments yet")].filter(Boolean).join(" · ")}</span></span>
        <img src="assets/icon-chevron-right.svg" alt="" width="18" height="18">
      </button>`).join("") + (f.members.length > 4 ? `
      <button class="group-row group-more" type="button" data-toggle-members="${f.id}" aria-expanded="${expanded}">
        ${expanded ? "Show fewer" : `Show all ${f.members.length} members`}
      </button>` : "");
    screen.querySelector("[data-family-pin]").innerHTML = String(f.pin).split("").map((d) => `<span>${escapeHtml(d)}</span>`).join("");
  },
  "family-edit"(_, screen) {
    const f = families().find((x) => x.id === loadSession().familyView) || currentFamily();
    if (!f) return go("families", { replace: true });
    const form = screen.querySelector("form");
    form.name.value = f.name;
    form.forWhom.value = f.forWhom || "";
    screen.querySelector("[data-edit-initial]").textContent = familyInitial(f);
    screen.querySelector("[data-for-hint]").textContent = `Shown as “For ${f.forWhom || "…"}” on the family screen and in the TV greeting.`;
    const deleteSub = screen.querySelector("[data-delete-sub]");
    if (deleteSub) deleteSub.textContent = f.tvs.length ? `Removes it for all ${plural(f.members.length, "member")} and unpairs ${f.tvs.map((t) => t.name).join(" and ")}. This can’t be undone.` : `Removes it for all ${plural(f.members.length, "member")}. This can’t be undone.`;
    screen.querySelector("[data-delete-block]").hidden = f.role !== "admin";
    // Save only lights up once something has changed.
    form.dataset.original = JSON.stringify([f.name, f.forWhom || ""]);
    form.querySelector("[type=submit]").disabled = true;
  },
  "family-new"(_, screen) {
    const form = screen.querySelector("form");
    form.name.value = "";
    screen.querySelector("[data-new-initial]").textContent = "?";
    form.querySelector("[type=submit]").disabled = true;
  },
  notifications(_, screen) {
    const events = loadSession().events || [];
    const unread = events.filter((e) => e.unread).length;
    const badge = screen.querySelector("[data-unread-badge]");
    badge.hidden = !unread;
    badge.textContent = unread;
    screen.querySelector("[data-notifications-empty]").hidden = !!events.length;
    const groups = [["Today", events.filter((e) => !e.ago || /min|hr|now/.test(e.ago))], ["Earlier", events.filter((e) => e.ago && !/min|hr|now/.test(e.ago))]];
    screen.querySelector("[data-notifications-list]").innerHTML = groups.filter(([, l]) => l.length).map(([label, l]) => `
      <p class="list-label">${label}</p>
      ${l.map((e) => `
        <div class="note-row${e.unread ? " is-unread" : ""}">
          ${e.icon ? `<span class="note-icon"><span class="mask-icon" style="--icon:url(assets/icon-${e.icon}.svg)"></span></span>` : `<span class="avatar-disc">${escapeHtml((e.who || "T")[0])}</span>`}
          <span class="note-text"><span class="note-body">${e.text}</span><span class="note-time">${e.ago || timeAgo(e.at)}</span></span>
          ${e.thumb ? `<img class="note-thumb" src="${photoSrc(e.thumb)}" alt="">` : ""}
        </div>`).join("")}`).join("");
    paintNav(screen, "notifications");
  },
  profile(_, screen) {
    const s = loadSession();
    const list = families();
    const mine = list.flatMap((f) => f.moments.filter(isMineMoment));
    screen.querySelector("[data-profile-name]").textContent = meName();
    screen.querySelector("[data-profile-avatar]").innerHTML = s.provider
      ? `<img src="assets/avatar-sarah.png" alt="">`
      : `<span class="avatar-disc avatar-disc-lg">${escapeHtml(me().first[0] || "?")}</span>`;
    screen.querySelector("[data-profile-families-count]").textContent = list.length;
    screen.querySelector("[data-profile-families]").innerHTML = list.length
      ? list.map((f) => `
        <button class="family-chip" type="button" data-open-family="${f.id}">
          <span class="family-chip-disc" style="background:${tintFor(f.name)}">${familyInitial(f)}</span>
          <span class="family-chip-text"><span>${escapeHtml(f.name)}</span><small class="${f.role === "admin" ? "is-owner" : ""}">${f.role === "admin" ? "Owner" : "Member"}</small></span>
        </button>`).join("")
      : `<p class="empty-note">No family yet.</p>`;
    const hasStories = mine.some((m) => m.kind === "bulk");
    screen.querySelector("[data-profile-stories]").hidden = !hasStories;
    const photos = mine.flatMap((m) => (m.photos.length >= (m.count || 0) ? m.photos : cycle(m.photos, Math.min(m.count || m.photos.length, 9))));
    screen.querySelector("[data-profile-moments-count]").textContent = mine.reduce((n, m) => n + (m.count || m.photos.length), 0);
    screen.querySelector("[data-profile-grid]").innerHTML = photos.length
      ? photos.slice(0, 9).map((p) => `<img src="${photoSrc(p)}" alt="" loading="lazy" decoding="async">`).join("")
      : `<div class="moments-empty"><p>Moments you share show here.</p><button class="btn btn-white" type="button" data-picker>Share a moment</button></div>`;
    paintNav(screen, "profile");
  },
};

function timeAgo(at) {
  const min = Math.round((Date.now() - (at || Date.now())) / 60000);
  return min < 1 ? "Just now" : min < 60 ? `${min} min ago` : `${Math.round(min / 60)} hr ago`;
}

/* ---------- Clicks on Home and the tabs ---------- */

function handleHomeClick(el, e) {
  const screen = el.closest("[data-screen]");
  if (el.dataset.nav) {
    if (location.hash.slice(1) === "notifications" && el.dataset.nav !== "notifications") markAllRead();
    go(el.dataset.nav);
  } else if (el.hasAttribute("data-group-toggle")) {
    const menu = screen.querySelector("[data-group-menu]");
    menu.hidden = !menu.hidden;
    el.setAttribute("aria-expanded", String(!menu.hidden));
    if (!menu.hidden) menu.querySelector("button")?.focus();
  } else if (el.dataset.switchFamily) {
    saveSession({ familyId: el.dataset.switchFamily });
    renderHome("home", screen);
  } else if (el.hasAttribute("data-like")) {
    const id = el.closest("[data-moment]").dataset.moment;
    const f = currentFamily();
    updateFamily(f.id, (fam) => ({ moments: fam.moments.map((m) => (m.id === id ? { ...m, liked: !m.liked } : m)) }));
    const m = momentById(id);
    el.setAttribute("aria-pressed", String(!!m.liked));
    el.querySelector("[data-like-count]").textContent = (m.likes || 0) + (m.liked ? 1 : 0);
  } else if (el.hasAttribute("data-save")) {
    openSaveSheet(el.closest("[data-moment]").dataset.moment);
  } else if (el.hasAttribute("data-more")) {
    openMoreSheet(el.closest("[data-moment]").dataset.moment);
  } else if (el.dataset.saveItem !== undefined) {
    const i = Number(el.dataset.saveItem);
    saveDraft.has(i) ? saveDraft.delete(i) : saveDraft.add(i);
    paintSaveSheet(el.closest("[data-overlay]"), el.closest("[data-overlay]").querySelectorAll("[data-save-item]").length);
  } else if (el.hasAttribute("data-save-confirm")) {
    closeOverlays();
    toast(`Saved ${plural(saveDraft.size, "item")} to your phone`);
  } else if (el.dataset.moreAction) {
    const layer = el.closest("[data-overlay]");
    const id = layer.dataset.moment;
    closeOverlays();
    const act = el.dataset.moreAction;
    if (act === "save") openSaveSheet(id);
    else if (act === "copy") shareText(`https://teatime.app/m/${id}`, "Link copied");
    else if (act === "share-other") {
      const other = families().find((f) => f.id !== currentFamily().id);
      const m = momentById(id);
      updateFamily(other.id, (fam) => ({ moments: [{ ...m, id: `${m.id}-${other.id}` }, ...fam.moments] }));
      toast(`Shared to ${other.name}`);
    } else if (act === "delete") {
      confirmSheet({
        title: "Delete this moment?", body: "It comes off the TV and out of everyone’s feed. This can’t be undone.", action: "Delete moment", danger: true,
        onConfirm: () => {
          const f = currentFamily();
          updateFamily(f.id, (fam) => ({ moments: fam.moments.filter((m) => m.id !== id) }));
          renderHome("home", device.querySelector('[data-screen="home"]'));
          toast("Moment deleted");
        },
      });
    }
  } else if (el.hasAttribute("data-confirm-yes")) {
    closeOverlays();
    const fn = confirmAction;
    confirmAction = null;
    fn?.();
  } else if (el.hasAttribute("data-overlay-close")) {
    closeOverlays();
  } else if (el.hasAttribute("data-dismiss-nudge")) {
    saveSession({ inviteDismissed: true });
    renderHome("home", screen);
  } else if (el.dataset.openFamily) {
    saveSession({ familyView: el.dataset.openFamily });
    go("family");
  } else if (el.dataset.toggleMembers) {
    const open = loadSession().membersOpen === el.dataset.toggleMembers;
    saveSession({ membersOpen: open ? null : el.dataset.toggleMembers });
    TAB_ENTER.family("family", screen);
  } else if (el.dataset.connectFamily) {
    saveSession({ familyId: el.dataset.connectFamily, path: "d" });
    go("b3");
  } else if (el.hasAttribute("data-share-pin")) {
    const f = families().find((x) => x.id === loadSession().familyView) || currentFamily();
    shareText(`Join ${f.name} on TeaTime so you can send photos to the TV too. Family PIN: ${f.pin}`, "PIN copied. Paste it into WhatsApp or Messages.");
  } else if (el.hasAttribute("data-leave-family") || el.hasAttribute("data-delete-family")) {
    const f = families().find((x) => x.id === loadSession().familyView) || currentFamily();
    const del = el.hasAttribute("data-delete-family");
    confirmSheet({
      title: del ? `Delete ${f.name}?` : `Leave ${f.name}?`,
      body: del
        ? `It’s removed for all ${plural(f.members.length, "member")}${f.tvs.length ? ` and ${f.tvs.map((t) => t.name).join(" and ")} ${f.tvs.length > 1 ? "are" : "is"} unpaired` : ""}. This can’t be undone.`
        : "You stop seeing its moments and TV. Ask for the PIN to come back.",
      action: del ? "Delete family" : "Leave family",
      danger: true,
      onConfirm: () => {
        const rest = families().filter((x) => x.id !== f.id);
        saveFamilies(rest, rest[0]?.id ?? null);
        go("families");
        toast(del ? `${f.name} deleted` : `You left ${f.name}`);
      },
    });
  } else if (el.hasAttribute("data-mark-read")) {
    markAllRead();
    TAB_ENTER.notifications("notifications", screen);
  } else {
    return false;
  }
  return true;
}

function markAllRead() {
  saveSession({ events: (loadSession().events || []).map((e) => ({ ...e, unread: false })) });
}

function initTabForms() {
  const edit = document.getElementById("family-edit-form");
  edit.addEventListener("input", () => {
    const changed = JSON.stringify([edit.name.value.trim(), edit.forWhom.value.trim()]) !== edit.dataset.original;
    edit.querySelector("[type=submit]").disabled = !changed || !edit.name.value.trim();
    device.querySelector("[data-for-hint]").textContent = `Shown as “For ${edit.forWhom.value.trim() || "…"}” on the family screen and in the TV greeting.`;
    device.querySelector("[data-edit-initial]").textContent = (edit.name.value.replace(/^The /, "")[0] || "?").toUpperCase();
  });
  edit.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = loadSession().familyView || currentFamily()?.id;
    if (!edit.name.value.trim()) return edit.name.focus();
    updateFamily(id, { name: edit.name.value.trim(), forWhom: edit.forWhom.value.trim() });
    go("family", { replace: true });
    toast("Family updated");
  });
  const create = document.getElementById("family-new-form");
  create.addEventListener("input", () => {
    create.querySelector("[type=submit]").disabled = !create.name.value.trim();
    device.querySelector("[data-new-initial]").textContent = (create.name.value.replace(/^The /, "")[0] || "?").toUpperCase();
  });
  create.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = create.name.value.trim();
    if (!name) return;
    const id = `f${Date.now()}`;
    const list = families();
    list.push({ id, name, forWhom: "", role: "admin", pin: String(1000 + Math.floor(Math.random() * 9000)), members: [{ ...me(), rel: "", admin: true, isMe: true }], tvs: [], moments: [] });
    saveFamilies(list, id);
    saveSession({ familyView: id });
    go("family", { replace: true });
    toast(`${name} created`);
  });
}

/* ---------- Scenario presets (review list "Start as…") ---------- */

// Each preset fills in the choices a person would have made, then opens the screen it leads to.
function freshState(extra = {}) {
  sessionStorage.removeItem(SESSION_KEY);
  saveSession({ path: "a", first: "Sarah", last: "Johnson", provider: "google", uploads: 0, events: [], families: [], ...extra });
}
function bulkMoment() {
  return { kind: "bulk", photos: cycle(PHOTO_SET, 8), count: TOTAL_FOUND, meta: `${TOTAL_FOUND} photos · May – Oct 2026`, caption: "" };
}
const PRESETS = {
  "p-bulk": () => { freshState(); ensureOwnFamily("The Johnsons", { tvs: [{ name: "Lisa’s TV", place: "Living room", state: "on" }] }); addMyMoment(bulkMoment()); saveSession({ uploads: 1 }); return "home"; },
  "p-arriving": () => { PRESETS["p-bulk"](); startBulkUpload(); return "home"; },
  "p-own": () => { freshState(); ensureOwnFamily("The Johnsons", { tvs: [{ name: "Lisa’s TV", place: "Living room", state: "on" }] }); addMyMoment({ kind: "own", photos: ["birthday", "beach", "dog", "dinner", "trophy", "drawing"], count: 6, meta: "Just now · 6 photos", caption: "Lily’s 6th birthday 🎂" }); saveSession({ uploads: 1 }); return "home"; },
  "p-waiting-mum": () => { freshState({ path: "b" }); saveSetup({ who: "Mum", tv: "Google TV" }); ensureOwnFamily("The Johnsons"); addMyMoment(bulkMoment()); tvSetupSent(); saveSession({ uploads: 1 }); return "home"; },
  "p-skipped": () => { freshState({ path: "d" }); ensureOwnFamily("The Johnsons"); return "home"; },
  "p-no-tv": () => { freshState({ path: "d" }); ensureOwnFamily("The Johnsons"); addMyMoment({ kind: "own", photos: ["roses", "dinner", "dog"], count: 3, meta: "Just now · 3 photos", caption: "" }); saveSession({ uploads: 1, connectSeen: true }); return "home"; },
  "p-invite": () => { PRESETS["p-no-tv"](); updateFamily("own", { tvs: [{ name: "Living room TV", place: "Living room", state: "on" }] }); saveSession({ inviteNudge: true }); return "home"; },
  "p-joined": () => { freshState({ path: "b", first: "Tom", last: "Nguyen" }); joinFamily(johnsonsFamily("member")); seedFamilyEvents(); queuePush("You’ve joined The Johnsons. Their moments are playing on Lisa’s TV."); return "home"; },
  "p-asked": () => { freshState({ path: "b", first: "Tom", last: "Nguyen", joinVia: "tvqr" }); ensureOwnFamily("The Nguyens"); saveSession({ joinPending: true }); return "home-sent"; },
  "p-admin": () => {
    freshState();
    const fam = johnsonsFamily("admin");
    fam.members = [{ ...me(), rel: "Daughter", admin: true, isMe: true }, ...fam.members.filter((m) => m.first !== "Sarah" && m.first !== "Tom")];
    saveFamilies([fam], "johnsons");
    seedFamilyEvents();
    return "home-approve";
  },
  "p-two": () => {
    freshState();
    const j = johnsonsFamily("admin");
    j.members = [{ ...me(), rel: "Daughter", admin: true, isMe: true, moments: 14 }, ...j.members.filter((m) => m.first !== "Sarah")];
    j.tvs.push({ name: "Mum’s TV", place: "Bedroom", state: "on" });
    const nan = nanFamily();
    nan.members.push({ ...me(), rel: "Granddaughter", isMe: true });
    saveFamilies([j, nan], "johnsons");
    seedFamilyEvents();
    addEvent({ kind: "person", who: "Lisa", text: "<b>Lisa</b> saw your photo on the big screen", thumb: "newborn" });
    return "home";
  },
  "p-paywall": () => { PRESETS["p-bulk"](); saveSession({ uploads: 3 }); return "home"; },
};
