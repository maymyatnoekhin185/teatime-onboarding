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
| `#joined` | Home · family moments | The family's feed (Sarah's moments, Lisa's TV on, 5 in the family). Push: "You've joined The Johnsons" (PIN) or "Sarah said yes" (approval) |
| `#e4` | E4 · Find their community | Search focused on arrival; results as you type with the matching part highlighted ("Chelt" also finds Chelsea); count line; clear (×). Tap a result → E5 (no Continue). No results → "No communities match" + "Can't find it?" hint |
| `#e5` | E5 · Who lives at {community}? | First + last name (both needed) → Find them. Matched (ignoring case) → E6, otherwise → E7 |
| `#e6` | E6 · Is this {name}? | Resident card (initial, name, room). Yes, join {name}'s family → photo prompt · Not them — tell the community → E7 |
| `#e7` | E7 · You're set up | Family made, community told, nothing blocked. Go to Home → photo prompt (flowchart: photos as in Flow 2) |
| `#f1` | F1 · Join The Johnsons? | Ask to join → F2 · Not this family → E1. Back → sign in |
| `#f2` → `#f2-home` | Sent to Sarah (sheet) → their own Home, "Waiting for Sarah" | Got it, swipe down, tap outside or Esc → Home. After 5 s a push "Sarah said yes…" slides in and stays; tap → `#joined` |
| `#f3` → `#f3-home` | Admin's Home with "Tom wants to join" | Approve / Decline → sheet closes with a toast saying what happened |
| `#declined` | E1 after a decline | Toast "The Johnsons declined your request…", then the normal E1 |
| `#f4` | F4 · Paywall | Shown instead of sending the 4th upload. Subscribe → the upload goes through (demo toast, no payment) · Not now → nothing uploaded, back to Home · Back → the New moment screen, caption kept |
| `#g1` | G1 · Home with Stories | The 100-photo upload as one moment; Timeline and Da Lat circles on the right open G2 / G3. A5 shows the same circles |
| `#g2` / `#g3` | A story playing | ~3 s per photo, auto-advancing; segmented progress; chip shows the month (timeline) or the place. Tap the right ⅔ → next, left ⅓ → back, hold → pause; ← → keys, Space pauses; X, Esc or the last photo → back to where it opened. Switching away from the app pauses it |
| `#a2` / `#b-a2` | Photo access (system prompt) | Allow → A3 / B2 · Limit Access or Don't Allow → limited screen |
| `#photos-off` | We can't see your photos yet | Allow photo access → A3 / B2 · Pick photos myself → picker · Skip → D1 |
| `#a3` / `#b2` | 128 photos | Send now → A4 / Keep these → B3 · "+120" → All 128 · Choose my own → picker · Skip → D1 |
| `#all-photos` | All 128 photos | All ticked; tap to leave out; button counts what's left ("Send 127 photos" / "Keep 127 photos") → A4 / B3. Back discards changes |
| `#picker` | Choose my own · picker | Tap to number photos (max 10, toast past that); preview shows the last tapped; Next · N → New moment. X → where it was opened from |
| `#moment` | New moment | Caption optional. Share → A6 (path A) · B3 (path B) · D3 (from D1/D4 "+") · same Home (from any other Home "+") |
| `#a4` | Home, moments arriving | Pill counts up to the chosen total, then → A5 |
| `#a5` | Home, all in, TV named | End of path A |
| `#a6` | Home after "Choose my own" | Shows the person's own moment (first photo, count, caption or "Add a caption") |
| `#b3` | Where should they play? | Row 1 → B4 · row 2 → B5 · Later → B7 (path B) / D4 (row D) |
| `#b4` | Open TeaTime on the TV | Scan the TV's code → A4 (path B) / D5 (row D) · Later as B3 |
| `#b5` | Add another TV | Send set-up → B6 |
| `#b6` | Send this to Mum | Share message → B7 (path B) / D4 waiting for that TV (row D) |
| `#b7` → `#b8` | Waiting for Mum's TV → connected | After 5 s; push notification slides in |
| `#d1` | Home, nothing shared yet | Share a moment / "+" → picker · "No TV yet" → B3 |
| `#d3` | Shared. Now connect a TV | Sheet over D4. Connect a TV → B3 · swipe down, tap outside or Esc → D4 |
| `#d4` | Home, waiting for a TV | Pill and "No TV yet" → B3. If a set-up message was sent: "Waiting for Mum's TV", then D5 after 5 s |
| `#d5` | TV connected, invite your family | Invite → share sheet with the family code |

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

### Colour options (temporary, for the client to choose)
Source: Figma `13960:30674` ("CTA colour options"). The original pink-orange palette has been removed, leaving four options. Only buttons, links and selected states change; the background stays the same except in option 2.

| # | Option | Primary button | Text buttons / links | Selected (ticks, badges, chips) | Brand moments ("+", avatar ring) |
|---|---|---|---|---|---|
| 1 | Brand gradient (default) | Magenta → gold, white label | Gold | Magenta → gold | Magenta → gold |
| 2 | Strong blue | #2F6BFF, white label | White / links #5B8CFF | Blue | Magenta → gold. Background #0E0C12, softer glow |
| 3 | Analogous | Violet → pink, white label | White / links pink | Violet → pink | Violet → pink |
| 4 | Logo gold | #F2B53B, dark label #1A1226 | Gold | Gold, dark tick | Magenta → gold |

Option 2 colour rule (Instagram approach): blue = actions only (buttons, links, selected chips); white = navigation and "where am I" (active Home tab as a filled white house with a white dot, other tabs white at 60%, pagination dots white 100% / 40%); logo gradient = brand moments only ("+" share disc, avatar / TV rings, success). So the "+" is the only colour in the nav. Options 1, 3 and 4 keep the active tab and active dot in their accent colour.

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
- D4 is built from the Home layer under D3's sheet.
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
