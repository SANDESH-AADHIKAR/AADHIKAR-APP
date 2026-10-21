# Aadhikar AI — Roadmap

Tracking the hackathon build-out. Work top to bottom unless a task is marked as parallelizable.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Recommended order at a glance

| Order | Task                                     | Original # | Why here                                                                    | Size |
| ----- | ---------------------------------------- | ---------- | --------------------------------------------------------------------------- | ---- |
| 1     | Fix chat keyboard + multiline composer   | #2, #3     | P0 — chat is the core demo; both bugs live in one component                 | S–M  |
| 2     | Group/sort schemes by category           | #1         | Quick win; fixes the interleaved categories at the bottom of the list       | S    |
| 3     | Supabase setup + move schemes to a table | #6         | Foundation for auth and profiles; removes the static data source            | M    |
| 4     | Auth + gate the AI behind login          | #7         | Needs Supabase; unlocks profiles; moves the Gemini key server-side          | L    |
| 5     | Multilingual foundation + translations   | #4         | Needed before onboarding's language step; affects all UI and AI replies     | L    |
| 6     | Onboarding + profile storage             | #8         | Needs auth, Supabase and i18n; feeds personalization into the AI            | M–L  |
| 7     | Voice typing                             | #5         | Independent; start a technical spike early, integrate after composer + i18n | M–L  |
| 8     | Polish and hardening                     | —          | Loading/error states, dark-mode persistence, cleanup, README                | M    |

Coupling notes:

- **#2 + #3** are the same chat composer bug — do them together.
- **#4 + #8** share language state and translations.
- **#6 + #7** share the Supabase setup.
- **#5** is independent and can be developed in parallel, but should ship after i18n so it respects the selected language.

---

## Phase 1 — Core UX fixes

### 1.1 Chat composer: keyboard overlap (#2)

- [x] Diagnose keyboard behavior on iOS, Android and web.
- [x] Wrap the app in `KeyboardProvider` from `react-native-keyboard-controller` (already installed).
- [x] Replace the current `KeyboardAvoidingView` usage with a keyboard-aware view/sticky composer.
- [x] Verify the input stays visible above the keyboard with the tab bar present.
- [x] Test on Android (resize/edge-to-edge).

### 1.2 Chat composer: multiline auto-grow (#3)

- [x] Make the `TextInput` grow from ~48px to ~112px using `onContentSizeChange`.
- [x] After the max height, let the input scroll internally instead of pushing the chat up.
- [x] Keep the send button anchored at the bottom.
- [x] Ensure the chat list shrinks/scrolls correctly while the composer grows.
- [x] Test with 1 line, 3 lines, and more than the max height.

### 1.3 Schemes list: group and sort by category (#1)

- [x] Reorder the static seed array by category and renumber IDs sequentially from 1–50.
- [x] Replace the flat `FlatList` with a `SectionList` grouped in the fixed `CATEGORIES` order.
- [x] Add category section headers and counts.
- [x] Keep search results grouped by category.
- [x] Preserve grouping when filtering by a single category.
- [x] Reuse the same ordering after the Supabase migration.

---

## Phase 2 — Backend foundation (Supabase)

### 2.1 Supabase project + client (#6)

- [x] Create the Supabase project.
- [x] Add `lib/supabase.ts` with the React Native client (URL + publishable key + AsyncStorage session persistence).
- [x] Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the local `.env` (user-managed; `.env.example` left untouched).
- [x] Confirm env vars are read correctly at build time.
- [x] Do not commit `.env`.
- [x] Keep the secret/service role key out of the client bundle; only the publishable key is used.

### 2.2 Schemes table + seed (#6)

- [x] Write setup SQL with the table, RLS policy, grants, indexes and 50-row seed (applied, then removed from the repo to avoid duplication).
- [x] Run the setup SQL in Supabase and confirm 50 active rows.
- [x] Create `schemes` table: `id`, `slug`, `name`, `category`, `benefits`, `eligibility`, `link`, `level` (central/state), `state`, optional `documents`, `tags`.
- [x] Seed the existing 50 schemes.
- [x] Enable RLS with public `select` access.
- [x] Add a `useSchemes` hook with loading, error, refresh and retry states.
- [x] Replace `SCHEMES_DB` imports on Home and Schemes with fetched data.
- [x] Remove the static `SCHEMES_DB` array; keep only the shared category order.
- [x] Preserve category grouping, section headers and search/filter behavior.
- [x] Build the AI grounding context from the fetched scheme list (the edge function will query Supabase directly later).
- [ ] Optional: subscribe to realtime scheme changes.

### 2.3 Auth (#7)

- [ ] Choose the auth method (email + password recommended for the hackathon).
- [ ] Add an `AuthProvider` with session persistence.
- [ ] Create sign-in and sign-up screens.
- [ ] Restructure the root layout from `Slot` to a `Stack` with protected route groups.
- [ ] Gate the chat/AI feature behind auth; keep browsing public.
- [ ] Handle sign-out and session refresh.
- [ ] Add auth form validation, loading, error and password visibility states.
- [ ] Fix root navigation so `app/modal.tsx` and `+not-found.tsx` behave correctly if they are kept.

### 2.4 Gemini Edge Function proxy (#7)

- [ ] Create a Supabase Edge Function that verifies the user's JWT.
- [ ] Store `GEMINI_API_KEY` as a server-side secret, not `EXPO_PUBLIC_*`.
- [ ] Move the Gemini system instruction and request logic into the function.
- [ ] Build the scheme context from the Supabase `schemes` table.
- [ ] Pass the selected language and user profile into the prompt.
- [ ] Stream the response back to the client.
- [ ] Update `lib/gemini.ts` to call the function with the user's access token.
- [ ] Remove/deprecate client-side `EXPO_PUBLIC_GEMINI_API_KEY`.
- [ ] Optional: add per-user rate limiting.
- [ ] Minimum fallback if time is tight: auth gate only, with the client key — document that this does not secure the key.

---

## Phase 3 — Personalization

### 3.1 Multilingual foundation (#4)

- [ ] Choose the i18n approach (lightweight provider/dictionaries or `i18next`).
- [ ] Add English, Hindi and Marathi dictionaries.
- [ ] Add a `LanguageProvider` and `t()` helper.
- [ ] Detect the device locale as the initial default.
- [ ] Persist language locally and, once auth exists, in the profile.
- [ ] Replace the `Languages` icon's current "go to chat" behavior with a real language picker (bottom sheet/modal).
- [ ] Add a language picker in onboarding and a way to change it later.
- [ ] Localize home, schemes, chat, auth, onboarding and error strings.
- [ ] Localize the welcome message and suggestion chips.
- [ ] Pass the selected language into the Gemini prompt; remove the hardcoded `Current language context: English`.
- [ ] Check layouts with longer Hindi/Marathi strings.
- [ ] Scope decision: translate scheme content (50 rows) or keep official names/descriptions in English for now.
- [ ] Stretch: add translated scheme name/benefit/eligibility columns.

### 3.2 Onboarding + profile (#8)

- [ ] Create `profiles` table with `onboarding_completed` and editable fields.
- [ ] Add a profile trigger or upsert after sign-up.
- [ ] Build a 5-step onboarding flow:
    - [ ] Language
    - [ ] Age + gender
    - [ ] Occupation (student, farmer, salaried, self-employed, homemaker, retired, other)
    - [ ] State + rural/urban
    - [ ] Household income bracket + family size (optional)
    - [ ] Review + consent
- [ ] Add progress indicator, back/next, validation and skip for optional fields.
- [ ] Redirect new users to onboarding; redirect completed users to Home/Chat.
- [ ] Inject the profile into the Gemini system prompt.
- [ ] Add an edit-profile path later.
- [ ] Stretch: "Recommended for you" schemes on Home based on profile.
- [ ] Avoid collecting sensitive identifiers (Aadhaar, bank details, OTPs).

---

## Phase 4 — Voice

### 4.1 Technical spike (#5)

- [ ] Choose the speech-to-text approach:
    - `expo-speech-recognition` on native + Web Speech API on web, or
    - record audio and transcribe via Gemini.
- [ ] Confirm whether a development build is required (likely yes on native).
- [ ] Add microphone/speech permissions to `app.json`.
- [ ] Test on a real device and on web (HTTPS required for Web Speech API).

### 4.2 Voice typing UI (#5)

- [ ] Add a mic button beside the send button.
- [ ] Implement start/stop recording with a clear recording state.
- [ ] Append interim/final transcripts into the input instead of replacing existing text.
- [ ] Map the selected language to the recognition locale (`en-IN`, `hi-IN`, `mr-IN`).
- [ ] Handle permission denied, unsupported device/browser and recognition errors.
- [ ] Disable or handle voice while another request is in flight.
- [ ] Web fallback for the demo if native voice slips.

---

## Phase 5 — Polish and hardening

- [ ] Loading skeletons and error/retry states for all network calls.
- [ ] Persist dark mode and language across restarts.
- [ ] Move the theme toggle somewhere accessible on every screen (or add a settings screen).
- [ ] Remove dead starter files: `app/modal.tsx`, `components/EditScreenInfo.tsx`, `components/Themed.tsx`, `constants/Colors.ts`, unused chat-ai kit if not adopting it.
- [ ] Fix `app.json` `"scheme": "starterkitexpo"`.
- [ ] Write the README (setup, env vars, Supabase, edge function, EAS build).
- [ ] Verify web export and EAS preview builds.
- [ ] Add basic tests for filtering, grouping, i18n helpers and profile mapping.

---

## Open decisions

1. **Languages:** English + Hindi + Marathi — confirm.
2. **Auth method:** email + password (simplest), magic link/OTP, or Google OAuth.
3. **AI security:** Supabase Edge Function proxy (recommended) vs. client key for the demo.
4. **Voice target:** web demo, native device, or both.
5. **Scheme content translation:** UI + AI only for now, or translate all 50 scheme descriptions.
6. **Onboarding fields:** confirm the five screens above or adjust.

---

## Environment variables

Update `.env.example` only; never commit `.env`.

| Variable                                | Where                         | Purpose                                          |
| --------------------------------------- | ----------------------------- | ------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`              | client                        | Supabase project URL                             |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  | client                        | Public publishable key (safe with RLS)           |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`         | client fallback               | Legacy anon key; used only if no publishable key |
| `GEMINI_API_KEY`                        | Supabase Edge Function secret | Server-side Gemini key                           |
| `EXPO_PUBLIC_GEMINI_API_KEY`            | client (temporary)            | Remove once the edge function proxy is live      |
| `EXPO_PUBLIC_GEMINI_MODEL`              | client/server                 | Optional model override                          |
| `EXPO_PUBLIC_GEMINI_THINKING_LEVEL`     | client/server                 | Optional thinking-level override                 |
