# Aadhikar AI

A multilingual civic-tech app that helps Indian citizens discover government schemes, check eligibility, and get step-by-step application guidance from an AI assistant.

Built with Expo, React Native, Supabase, and Google Gemini. Runs on Android, iOS, and the web from a single codebase.

## Features

- **50 government schemes** — browse, search, and filter schemes grouped by category (Agriculture, Education, Health, Finance, Housing, Social, Women).
- **5 languages** — English, हिन्दी (Hindi), मराठी (Marathi), ગુજરાતી (Gujarati), and বাংলা (Bengali). UI strings and scheme content are both localized.
- **AI assistant** — chat with Aadhikar AI for personalized scheme recommendations, eligibility checks, document lists, and application steps. Replies stream in as they are generated and are grounded in the live scheme catalog.
- **Voice input & speech output** — dictate questions with speech-to-text and listen to replies using text-to-speech.
- **Chat history** — conversations are saved on-device per signed-in user. Start new chats or reopen past ones.
- **Authentication** — email/password sign-in via Supabase. Browsing schemes is public; the AI chat requires an account.
- **Light / dark theme** — theme toggle on the home screen, with system dark mode support.
- **Official links** — every scheme card links to its government portal.

## Tech Stack

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Framework | Expo SDK 56, React Native 0.85, React 19         |
| Routing   | Expo Router (file-based, typed routes)           |
| Language  | TypeScript                                       |
| Styling   | NativeWind 5 + Tailwind CSS 4, Gluestack UI      |
| Backend   | Supabase (Postgres, Auth, Row Level Security)    |
| AI        | Google Gemini REST API (SSE streaming)           |
| i18n      | i18next + react-i18next + expo-localization      |
| Voice     | expo-speech-recognition, expo-speech             |
| Storage   | AsyncStorage (language preference, chat history) |

## Project Structure

```
app/                     Expo Router screens
  (tabs)/                Home, Schemes, Chat tabs
  auth.tsx               Sign in / sign up
  _layout.tsx            Providers, theme, fonts, splash screen
components/              App components + Gluestack UI primitives
  SchemeCard.tsx         Scheme list card
  LanguagePicker.tsx     Language switcher
  MarkdownMessage.tsx    Markdown rendering for AI replies
constants/               Theme tokens, categories, shared types
hooks/
  useSchemes.ts          Fetches schemes and localizes them
  useVoiceInput.ts       Speech-to-text controller
lib/
  supabase.ts            Supabase client
  i18n.ts                i18next setup
  gemini.ts              Gemini client, prompts, streaming
  voice.ts               Speech locale + error helpers
locales/                 en / hi / mr / gj / be translation files
providers/
  AuthProvider.tsx       Supabase auth context
supabase/
  add_gj_be_scheme_translations.sql
assets/                  Images, icons, fonts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm (the repo uses `legacy-peer-deps`, configured in `.npmrc`)
- Expo Go or a development build for mobile, or a modern browser for web
- A Supabase project
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Install

```bash
git clone https://github.com/SANDESH-AADHIKAR/AADHIKAR-APP.git
cd aadhikar-ai
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable                               | Required | Description                           |
| -------------------------------------- | -------- | ------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`             | Yes      | Supabase project URL                  |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | Supabase publishable (anon) key       |
| `EXPO_PUBLIC_GEMINI_API_KEY`           | Yes      | Google AI Studio API key              |
| `EXPO_PUBLIC_GEMINI_MODEL`             | No       | Defaults to `gemini-3.5-flash-lite`   |
| `EXPO_PUBLIC_GEMINI_THINKING_LEVEL`    | No       | `MINIMAL`, `LOW`, `MEDIUM`, or `HIGH` |

> Never commit `.env`. Only use the Supabase **publishable/anon** key in the client — never the service role key.

### Run

```bash
npm start          # Expo dev server (choose platform)
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

### Build

```bash
npm run build        # Static web export to dist/
npm run build:preview
```

EAS build profiles are defined in `eas.json` (`development`, `preview`, `production`).

## Supabase Setup

The app expects a `schemes` table with public read access. The columns used at runtime are:

| Column                                     | Type     | Notes                                           |
| ------------------------------------------ | -------- | ----------------------------------------------- |
| `id`                                       | text/int | Primary key (`1`–`50`)                          |
| `category`                                 | text     | One of the categories in `constants/schemes.ts` |
| `name`, `benefits`, `eligibility`, `link`  | text     | English content                                 |
| `name_hi`, `benefits_hi`, `eligibility_hi` | text     | Hindi                                           |
| `name_mr`, `benefits_mr`, `eligibility_mr` | text     | Marathi                                         |
| `name_gj`, `benefits_gj`, `eligibility_gj` | text     | Gujarati                                        |
| `name_be`, `benefits_be`, `eligibility_be` | text     | Bengali                                         |
| `sort_order`                               | integer  | Optional ordering within a category             |
| `is_active`                                | boolean  | Only `true` rows are fetched                    |

Minimal table creation:

```sql
create table if not exists public.schemes (
  id          text primary key,
  category    text not null,
  name        text not null,
  benefits    text not null,
  eligibility text not null,
  link        text not null,
  sort_order  integer default 0,
  is_active   boolean default true,
  name_hi text, benefits_hi text, eligibility_hi text,
  name_mr text, benefits_mr text, eligibility_mr text,
  name_gj text, benefits_gj text, eligibility_gj text,
  name_be text, benefits_be text, eligibility_be text
);

alter table public.schemes enable row level security;

create policy "Public read schemes"
  on public.schemes for select
  using (true);
```

Seed the 50 schemes, then apply the translation migration:

```bash
# Run in the Supabase SQL editor
supabase/add_gj_be_scheme_translations.sql
```

The migration is idempotent: it adds the `_gj` / `_be` columns if missing and fills all 50 rows by `id`. It also ends with a count query to verify the data landed.

## How It Works

1. `useSchemes()` fetches active schemes from Supabase once and keeps the raw rows in memory.
2. When the language changes, the hook maps each row to the active language (`hi`, `mr`, `gj`, `be`) and falls back to English if a translation is empty. No extra network request is needed.
3. The Chat screen builds a compact scheme catalog from the localized rows and sends it as grounding context with every Gemini request, along with an instruction to answer in the current language.
4. Replies stream over SSE and render as markdown. Chat sessions are persisted to AsyncStorage under the signed-in user's id.

### Adding a language

1. Add `locales/<code>.json` with the same keys as `locales/en.json`.
2. Register it in `lib/i18n.ts` (`import`, `resources`, and the device-language allowlist).
3. Add the option to `components/LanguagePicker.tsx`.
4. Add the language name and speech locale in `app/(tabs)/chat.tsx` and `lib/voice.ts`.
5. If it is a scheme language, add `<field>_<code>` columns and update the select/mapping in `hooks/useSchemes.ts`.

## Scripts

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm start`       | Start the Expo dev server       |
| `npm run android` | Run on Android                  |
| `npm run ios`     | Run on iOS                      |
| `npm run web`     | Run in the browser              |
| `npm run build`   | Export the web build to `dist/` |
| `npm test`        | Jest in watch mode              |

## Security Notes

- `EXPO_PUBLIC_*` variables are inlined into the client bundle. The Gemini key is therefore visible to anyone with the app; this is acceptable for demos but should be moved behind a server or Supabase Edge Function before a public release.
- Supabase access is protected by Row Level Security. The client only ever uses the publishable key.
- The app never asks for Aadhaar numbers, bank account details, OTPs, or passwords. The AI is instructed to refuse such data.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for completed work, onboarding/personalization plans, and remaining hardening tasks.

## License

No license has been specified for this project yet.
