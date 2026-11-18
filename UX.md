# TeaTime — UX spec

## Onboarding v2.1
Source: Figma `Uk1zH52TS6WFucHkYVFKJY`, section `13871:2156` ("ONBOARDING v2.1", updated 18 Nov) and the flowchart `13903:5026` ("Onboarding v2.1 — flow, updated 17 Nov").
No welcome screen. Straight after sign-in the person names their family (E1), pre-filled from their surname, or joins one that already exists.

Seven journeys (one row each in Figma) plus the detail screens they share:
1. **Scanned the TV, new family.** TV QR → Sign in → E1 Name your family → Photo access → Moments found (Send now) → Home, moments arriving → Home, all in (with Stories).
2. **a · From an ad, TV in front of you.** Sign in → E1 → Photo access → Keep these → Which TV → TV in front of me → Home, moments arriving. **b · TV somewhere else / I don't know.** Which TV → Add another TV → Set-up message → Home, waiting → Home, connected.
3. **Skipped everything.** Sign in → E1 → Skip → empty Home → share with "+" → "Shared. Now connect a TV" → Home, waiting → TV connected, invite your family.
4. **Second member, family PIN.** Sign in → E1 → Join a family → E2 Enter the PIN → the family's Home. No approval.
5. **Second member, scanned the TV's small QR.** Sign in → F1 Join The Johnsons? → Ask to join → F2 Sent to Sarah → their own Home, waiting → (admin approves on F3) → the family's Home. Declined → E1 again.
6. **Care community.** Sign in → E1 → Care community → E4 Find their community → E5 Who lives there → E6 Is this them? (matched) or E7 You're set up (no match, not blocked) → Photo access → Keep these.
7. **After onboarding.** G1 Home with the moment's Stories → G2 / G3 a story playing · F4 paywall on the 4th upload.

Every frame in the section is built, except the old TV QR screen (kept in Figma only as "current design" for comparison).

### Screen map
| Route | Screen | Goes to |
|---|---|---|
| `#tv` | TV · Scan to send photos | QR → A1. "Start from an ad instead" → B1 (via `#ad`, which resets the journey) |
| `#ad` / `#tvqr` | Entry links, not screens | Set where the journey started, then open B1. `#tvqr` = scanned the small QR on the TV's Home, so sign-in continues to F1 |
| `#a1` / `#b1` | Sign in (A1 / B1 copy) | Apple → Apple sheet · Google → Google sheet · Phone number → C1 · Use email instead → toast "Not in this build yet" (no email screens designed yet) |
| sheet | Apple system sheet | Share / Hide My Email · Continue with Face ID → "Signing in with Apple…" → E1 (F1 after the small QR). Swipe down, tap outside or Esc → back with nothing shown |
| sheet | Google account sheet | Any account → "Signing in with Google…" → E1 (F1 after the small QR). Same close rules |
| `#c1` | C1 · Mobile number | Send code (enabled at 9+ digits) → C2. Back → sign in |
| `#c2` | C2 · Enter the code | 6 boxes on one code field (SMS autofill works). Continue at 6 digits → C3. "Send again" clears and confirms with a toast |
| `#c3` | C3 · Your name | Continue (first name needed) → E1 (F1 after the small QR). Name appears on Home |
| `#e1` | E1 · Name your family | Pre-filled "The {surname}s" (editable; Continue disabled when empty) → photo prompt. Join a family → E2 · Care community → E4. Back → sign in |
| `#e2` | E2 · Enter the family PIN | 4 boxes on one field. Join the family at 4 digits: right PIN → family Home (`#joined`); wrong PIN → boxes turn red with "That PIN doesn't match a family…", cleared as soon as they type. "Open it" (invite link) → "later release" toast |
| `#e4` | E4 · Find their community | Search focused on arrival; results as you type with the matching part highlighted ("Chelt" also finds Chelsea); count line; clear (×). Tap a result → E5 (no Continue). No results → "No communities match" + "Can't find it?" hint |
| `#e5` | E5 · Who lives at {community}? | First + last name (both needed) → Find them. Matched (ignoring case) → E6, otherwise → E7 |
| `#e6` | E6 · Is this {name}? | Resident card (initial, name, room). Yes, join {name}'s family → photo prompt · Not them — tell the community → E7 |
| `#e7` | E7 · You're set up | Family made, community told, nothing blocked. Go to Home → photo prompt (flowchart: photos as in Flow 2) |
| `#f1` | F1 · Join The Johnsons? | Ask to join → F2 · Not this family → E1. Back → sign in |
| `#declined` | E1 after a decline | Toast "The Johnsons declined your request…", then the normal E1 |
| `#f4` | F4 · Paywall | Shown instead of sending the 4th upload. Subscribe → the upload goes through (demo toast, no payment) · Not now → nothing uploaded, back to Home · Back → the New moment screen, caption kept |
| `#g2` / `#g3` | A story playing | ~3 s per photo, auto-advancing; segmented progress; chip shows the month (timeline) or the place. Tap the right ⅔ → next, left ⅓ → back, hold → pause; ← → keys, Space pauses; X, Esc or the last photo → back to where it opened. Switching away from the app pauses it |
| `#a2` / `#b-a2` | Photo access (system prompt) | Allow → A3 / B2 · Limit Access or Don't Allow → limited screen |
| `#photos-off` | We can't see your photos yet | Allow photo access → A3 / B2 · Pick photos myself → picker · Skip → empty Home |
| `#a3` / `#b2` | 128 photos | Send now → Home with the bulk moment arriving (path A) / Keep these → B3 · "+120" → All 128 · Choose my own → picker · Skip → empty Home |
| `#all-photos` | All 128 photos | All ticked; tap to leave out; button counts what's left ("Send 127 photos" / "Keep 127 photos") → A4 / B3. Back discards changes |
| `#picker` | Choose my own · picker | Tap to number photos (max 10, toast past that); preview shows the last tapped; Next · N → New moment. X → where it was opened from |
| `#moment` | New moment | Caption optional; "Sharing to" = current family + free uploads left. Share → uploads over the preview → Shared → Home (D3 sheet on the first share with no TV; B3 during path B onboarding) |
| `#b3` | Where should they play? | Row 1 → B4 · row 2 → B5 · Later → Home (moments waiting for a TV) |
| `#b4` | Open TeaTime on the TV | Scan the TV's code → TV on → Home (kept photos arrive) · Later as B3 |
| `#b5` | Add another TV | Send set-up → B6 |
| `#b6` | Send this to Mum | Share message → Home "Waiting for Mum's TV" → 5 s → connected + push |

### Scenarios
| Scenario | Behaviour |
|---|---|
| Phone | Screens fill the phone. Status bar and home indicator are the OS's; content respects safe-area insets. |
| Desktop / review | Phone shown as a 375×812 device. On wide screens a side list jumps to any screen, grouped by row. |
| Refresh / switch away and back | Each screen has its own URL; path, phone number, name, picked photos, caption and B5 details are kept for the session, so a refresh lands in the same place with nothing lost. |
| Shared screens | The app remembers the journey (A, B, D, the small QR), so sign-in, the photo prompt, Which TV and the set-up message each continue the right way. |
| Family name | Whatever is chosen on E1 (or the joined / care family) shows as "Sharing to" on New moment, in the invite text and in the timeline story's title. |
| Uploads | Bulk "Send now" / "Keep these" = upload 1; each moment shared after that is one more. The 4th asks for a subscription first; after subscribing nothing is asked again. Care-community families skip the paywall. |
| Sign-in fails | Offline when signing in → toast "Couldn't sign in with Apple/Google. Try again."; buttons are ready again. |
| Closing a system sheet | Returns to sign in with nothing shown (per design note). |
| Name left empty (B5) | Wording falls back: "Send the set-up", "Waiting for their TV". |
| Different TV picked (B5) | Step 1 of the message names that TV's store. |
| Sharing (set-up, invite) | Phone share sheet. Closing it keeps you where you are. Where sharing isn't available the text is copied and a toast says so. |
| Picker over 10 | Toast "Up to 10 photos or videos per moment" (Figma Toast default). |
| Outside v2.1 | Feed actions, nav tabs, albums, camera, switching group, "Got a code from family?" → toast "Not in this build yet: …". |
| Slow network | Dark background from first paint. Photos load only when their screen opens; tiles keep their size. |
| Keyboard / screen reader | Each screen moves focus to its heading, forms to their first field. Sheets close with Esc. Visible focus ring. |
| Reduced motion | Sheets, notification and press feedback don't animate. |

## Home and the tabs (one Home, built from what the person did)
Figma draws many Home frames (A4, A5, A6, B7, B8, D1, D4, D5, G1, the joined family, two TVs, family dropdown…). They are states of **one** Home (`#home`), worked out in `home.js` from what the person actually did. Sources: onboarding section `13871:2156` and "Other key screens" `13880:4501`.

### What Home shows
| Part | Rule |
|---|---|
| Title | "Your moments" while it's just you; the family name once the family has other members. Chevron opens the family menu (all your families, a tick on the current one, "+ Create a family group"); picking one switches Home to that family. |
| TV chip | No TV → "No TV yet" (opens Which TV). One TV on → "{name} on" ("TV on" for an unnamed TV and while photos are still arriving). Two or more → "2 TVs on". |
| Members | "Just you" or "N members". |
| Feed | Every moment in the current family, newest first. Swipe up/down between moments, sideways through a moment's photos; "k / N" and the dots follow. Empty → "Share your first moment" (D1). |
| What you uploaded | **Send now / Keep these** → one bulk moment: "128 photos · May – Oct 2026" (or the count left after unticking), with the Timeline and Da Lat stories on it, caption prompt "Six months in one go — add a caption". **Choose my own** → a moment with exactly the photos picked ("Just now · 3 photos") and the caption typed; no stories. **Skip** → nothing. Later "+" shares stack on top. |
| Status pill | "Adding n of N photos" while a bulk upload arrives; "Waiting for Mum's TV" after a set-up message; "Waiting for a TV" when moments exist and there's no TV (opens Which TV); "Waiting for Sarah" while a join request is pending; nothing once it's all playing. |
| Invite nudge | Only after a TV joins **after** they shared (D5) and it's still just them. Not on the bulk-upload Home. |
| Sheets over Home | D3 "Shared. Now connect a TV" (first share with no TV, once) · F2 "Sent to Sarah" · F3 "Tom wants to join" (admin). Swipe down, tap outside or Esc closes to Home. |
| Push | TV connected ("Mum's TV is connected…"), joined ("You've joined The Johnsons…"), approved ("Sarah said yes…"). |
| Action rail | Like fills the heart and counts up · Comment → not built · Save → "Save to phone" sheet (choose photos, white ticks, "Save N items") · ⋯ → sheet: Save to phone, Copy link, and on your own moments Edit (not built), Share to another family (when you have one), Delete (asks first). |

### What changes the state
| Choice | Effect |
|---|---|
| E1 Continue | Makes their family (admin, just them, family PIN). Path A (scanned the TV): that TV is added to the family. |
| A3 Send now · All 128 "Send N" | Bulk moment = upload 1; with a TV on, photos count in on Home. |
| B2 Keep these | Bulk moment kept for the TV, then Which TV. |
| B4 Scan the TV's code | TV on; kept photos start arriving. |
| B5/B6 Share message | That TV waits; 5 s later it's on (push), kept photos arrive. |
| New moment Share | Photos upload one by one over the preview ("Sharing to {family}… 2 of 3 photos", Cancel stops it), then **Shared** ("Mum will see it on the TV within a minute" / "It plays as soon as a TV is connected"), or D3 for the first share with no TV, or Which TV during path B onboarding. Leaving mid-upload sends nothing. |
| 4th upload | Paywall first. Subscribe → the same moment uploads. Not now → nothing sent, a notification says it's waiting. "N free uploads left" shows under "Sharing to". |
| E2 right PIN | Joins The Johnsons (their moments, Lisa's TV, 5 members) and opens Home. |
| F1 Ask to join | Their own empty Home + F2 sheet; 5 s later Sarah approves → Home switches to The Johnsons. |
| E6 / E7 | Family made for the resident ("Margaret's family", for Margaret), linked to the community; no paywall. |

### Tabs
| Route | Screen | Behaviour |
|---|---|---|
| `#families` | Families | One row per family: initial, green dot when its TV is on, "For X · N members · N TVs", "Admin/Member · PIN". Add family → sheet: Join with a family PIN (E2) · Create a new family. |
| `#family` | A family | Avatar, "For X", counts. **TVs** in one grouped card (row per TV with an On / Waiting pill, "Add another TV" / "Connect a TV" at the end → Which TV for that family; label "TVs · 2" when there are several). **Members · N** in one grouped card: you first, then admins (Admin pill), each with their own tint; first four, then "Show all N members" expands in place. Invite (header) and Share on the **Family PIN** card (digits shown large) open the share sheet. Edit only for admins. |
| `#family-edit` | Edit family | Family name and "Who is it for" fields (separate boxes; hint updates live). Save stays dimmed until something changes and the name isn’t empty. At the bottom, a pair of quiet text links: **Leave this family** (white) and **Delete this family** (red, admins only). Both open a confirm popup that says what happens (Delete names how many members and which TVs are unpaired). Change photo → not built. |
| `#family-new` | Create a new family | Name (button enabled once typed) → new family, admin, just you → its family screen. |
| `#notifications` | Notifications | From what happened (TV connected, joined, approvals, "Lisa saw your photo…", waiting for a subscription, the family's activity once you're in one). Unread rows tinted with the option's colour; count badge; ⋯ marks all read; leaving the tab marks them read. Empty → "Nothing yet". Nav bell shows a dot while anything is unread. |
| `#profile` | My profile | Name, photo (Apple/Google) or initial, families as chips (Owner/Member, open the family), Stories row only if they did a bulk upload, Moments grid of their own photos with the count. Settings and photo edit → not built. |

Bottom nav on Home and every tab: Home · Families · + (share) · Notifications · Profile. Same in every colour option: the selected tab is a filled white icon with a white dot, the others are white at 60%, and the gradient "+" is the only colour.

### Review list: "Start as…" presets
Each fills in the choices a person would have made and opens Home (or its sheet): uploaded everything + TV on · uploading · chose 6 photos + TV on · kept photos, waiting for Mum's TV · skipped everything · shared, no TV · TV on, invite family · joined by PIN · asked to join, waiting · admin with a request · two families, two TVs · 3 free uploads used. Everything else is reached by clicking through.

### Colour options (temporary, for the client to choose)
Source: Figma `13960:30674` ("CTA colour options"). The original pink-orange palette has been removed, leaving four options. Only buttons, links and selected states change. All four share option 2’s background: near-black #0E0C12 with the purple / pink glow at 45%.

| # | Option | Primary button | Text buttons / links | Selected (ticks, badges, chips) | Brand moments ("+", avatar ring) |
|---|---|---|---|---|---|
| 1 | Brand gradient (default) | Magenta → gold, white label | Gold | Magenta → gold | Magenta → gold |
| 2 | Strong blue | #2F6BFF, white label | White / links #5B8CFF | Blue | Magenta → gold |
| 3 | Analogous | Violet → pink, white label | White / links pink | Violet → pink | Violet → pink |
| 4 | Logo gold | #F2B53B, dark label #1A1226 | Gold | Gold, dark tick | Magenta → gold |

Option 2 colour rule (Instagram approach): blue = actions only (buttons, links, selected chips); white = navigation and "where am I" (active Home tab as a filled white house with a white dot, other tabs white at 60%, pagination dots white 100% / 40%); logo gradient = brand moments only ("+" share disc, avatar / TV rings, success). So the "+" is the only colour in the nav. The bottom nav follows this rule in all four options (selected tab = filled white icon + white dot, others white at 60%); only the pagination dots stay in each option’s accent in options 1, 3 and 4.

"Use email instead" (text button under the phone button on A1 / B1): gold in options 1 and 4, white in option 2, white at 60% in option 3.

All four share the same secondary button (2px white outline at 30%, as on the A1 option screens) and disabled button (grey fill, faded label).

| Scenario | Behaviour |
|---|---|
| Switching | Phone: round swatch tab on the left edge. Wide screen: "Colour N · name" pill bottom-right, outside the phone. Opens a list of the four options; tapping one applies it instantly, closes the list and shows a toast. |
| Sharing one option | The page address carries `?palette=N`, so a copied link opens on that option (e.g. `…/teatime-onboarding/?palette=3#a1`). |
| Coming back | This browser remembers the last pick. A link with `?palette=` wins. |
| Closing the list | Tap outside or Esc; focus returns to the switcher. Arrow keys move between options. |
| No flash | The option is applied before the page draws. |
| Compare | "Compare" pill next to the switcher (wide screens) or "Compare all four side by side" in the switcher list (phones). Shows the current screen in all four options: one row of four on a computer, 2 × 2 on a phone, whichever makes the phones bigger. |
| Moving through screens in Compare | Tap through any phone and all four follow. ‹ › step through the screens in review-list order; the dropdown jumps to any screen. Sheets, typing and photo picks stay in the phone you used. |
| Choosing from Compare | "Use this" under an option sets it, closes Compare and shows a toast. Close (X) or Esc returns to the same screen with the colour unchanged. |
| Sharing Compare | The address carries `?compare=1`, so a copied link opens straight into Compare on that screen. |

**When the client picks:** copy that option's values into `:root` in `styles.css`, then delete the other `[data-palette]` blocks, the switcher and Compare styles, the "Colour options" and "Compare" blocks in `app.js` (plus `EMBED`) and the head script in `index.html`. Or go back to the old palette with the `before-palettes` tag.

### Shortcuts and choices to confirm
- A known Apple / Google account or phone number would go straight to Home; this build treats every sign-in as new.
- B4's "Scan the TV's code" skips the camera (A0, not drawn in this section).
- B7 → B8 and D4 → D5 run on a 5 s timer to show the moment the other TV joins.
- D2 ("New moment — from +") is the same New moment screen, as the design note says.
- Path B's All-128 button says "Keep N photos" to match B2's "Keep these"; the design shows "Send".
- B5's "Their TV" options (Google TV, Android TV, Amazon Fire TV, Apple TV) are placeholders.
- Family PIN `4829` (E2 and the invite) is a placeholder; any other PIN shows the error.
- Communities and residents are placeholder data: Cheltenham Manor has Margaret Johnson (Room 12 · Lakeside wing), Cheltenham Gardens has Joan Smith. Several residents with the same name (a list with each family's admin) isn't built.
- "her" / "him" only appears where the design's own sample uses it (Margaret, Tom). Names typed by the family get "their" / "them".
- E7's button says "Go to Home" but the flowchart sends both E6 and E7 to photo access first; the build follows the flowchart. One of the two should change.
- F2 → approval runs on a 5 s timer (stand-in for the admin tapping Approve). Whoever scans the small QR signs in as "Tom Nguyen" so the F3 sheet matches.
- Uploads 2 and 3 from the daily photo scan aren't designed yet; in this build every "+" share counts as an upload.
- Subscribe on F4 takes no payment; price and plan name are "to confirm" in Figma.
- G1's dashed "AI groups coming later" circle (in the note, not in the frame) isn't drawn.

### Open questions (from the Figma section)
which entry comes first · app not installed after the scan · are bulk moments free, and when to ask for a subscription · bulk moments in the feed or in a "year" collection · typing a code on the TV vs "nothing typed on the TV" · "What TV is it?" when the sender doesn't know · second family member joining · care rooms · Samsung / LG "not supported yet" · photo date vs upload time on the TV · smart titles · the word on screen: photos, moments or stories.

### Asset note
The eight photos are the original Figma exports (~2 MB each, ~16 MB total). Fine for review; they need compressing before real users load them on mobile data.
