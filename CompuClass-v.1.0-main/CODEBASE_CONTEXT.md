# CompuClass v1.0 — Codebase Context

## Overview

CompuClass is a React Native / Expo mobile app (iOS + Android) for teaching computer hardware to students. It has two user roles: **student** and **lecturer**. The backend is **Supabase** (Postgres + Auth + Storage). AI features use **Google Gemini 1.5 Flash**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.5 via Expo SDK 54 |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| Backend | Supabase JS v2 (Auth, Postgres, Storage) |
| AI | Google Gemini 1.5 Flash (free tier) |
| Local DB | expo-sqlite (offline sync) |
| Storage | AsyncStorage (session persistence) |
| 3D/AR | expo-gl + Three.js + custom WebGL components |
| Styling | React Native StyleSheet (no external UI lib) |

---

## Project Structure

```
CompuClass-v.1.0-main/
├── App.js                  # Root — auth state, navigation shell, sidebar
├── index.js
├── config/
│   └── supabase.js         # Supabase client init
├── context/
│   └── ThemeContext.js     # Theme provider (light-only, dark stubbed)
├── hooks/
│   └── useOffline.js       # NetInfo online/offline hook
├── services/
│   ├── authService.js      # signIn, signUp, signOut, profile CRUD
│   ├── lecturerService.js  # folders, documents, quizzes, classes, students
│   ├── aiService.js        # Gemini quiz generation + chatbot
│   ├── gamificationservice.js # XP/level/streak stats, badges, leaderboard
│   └── offlineService.js   # SQLite local cache + sync
├── screens/                # 23 screens (see below)
├── components/
│   ├── Sidebar.js          # Slide-in drawer (swipe or menu button)
│   ├── RealAR.js           # Full PC 3D model viewer
│   ├── RamAR.js            # RAM 3D viewer
│   ├── MotherboardAR.js    # Motherboard 3D viewer
│   ├── CPUAR.js            # CPU 3D viewer
│   ├── GPUAR.js            # GPU 3D viewer
│   ├── StorageAR.js        # Storage 3D viewer
│   ├── PSUAR.js            # PSU 3D viewer
│   ├── SimpleAR.js         # Simplified AR component
│   ├── WebAR.js            # WebView-based AR
│   └── SwipeableScreen.js  # Swipeable wrapper
├── utils/
│   └── logger.js
├── assets/                 # Images, 3D models (.glb, .gltf)
├── .env                    # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GEMINI_API_KEY
├── supabase-setup.sql      # Full DB schema + RLS + triggers
└── app.json                # Expo config (bundle IDs, permissions)
```

---

## Authentication & App Flow (App.js)

The app has three top-level states managed in `AppContent`:

1. **Onboarding** (`isFirstLaunch = true`) → `OnboardingScreen`
2. **Auth** (`isLoggedIn = false`) → `LoginScreen` / `SignUpScreen` / `ForgotPasswordScreen`
3. **Main app** (`isLoggedIn = true`) → Tab navigator

On startup, `checkUser()` calls `supabase.auth.getSession()`. If a valid session exists, it fetches the user profile and sets `userRole` (`student` or `lecturer`).

The tab bar is a **custom floating pill** (`CustomTabBar`) with 4 visible tabs. Hidden tabs (PC Lab, Windows 11, Quiz, Troubleshoot, Materials, Settings, Chatbot) are navigated to via the sidebar or dashboard cards.

The **sidebar** (`Sidebar.js`) slides in from the left — triggered by the header menu button or a right-swipe gesture (disabled on PC Lab screen).

---

## User Roles

### Student
- Default role assigned on signup
- Tab bar: Home (Dashboard), Search, Profile
- Can access: PC Lab, Quiz, Troubleshooting, Materials, Windows 11 Simulator, Chatbot, Settings

### Lecturer
- Assigned if email is `lecturer@compuclass.com` OR set manually in DB
- Tab bar: Lecturer (replaces Home), Search, Profile
- Can access: Lecturer Dashboard, Folder management, Content upload, Quiz creation, Class management, Student progress

Role is determined by `profiles.role` in Supabase, set via the `handle_new_user` trigger on signup.

---

## Screens (23 total)

| Screen | Role | Description |
|---|---|---|
| `OnboardingScreen` | All | First-launch walkthrough (image slides) |
| `LoginScreen` | All | Email/password sign in |
| `SignUpScreen` | All | Register with name, email, password, role |
| `ForgotPasswordScreen` | All | Password reset via email |
| `DashboardScreen` | Student | Hero card, streak banner, XP badge, feature grid, quick access |
| `PCLabScreen` | Student | 3D model viewer + drag-and-drop PC assembly game |
| `QuizScreen` | Student | Lists assigned quizzes; runs quiz with per-question timers, server-side grading, XP/combo/badge results |
| `LeaderboardScreen` | Student | Class and global rankings by XP, medals for top three, pull-to-refresh |
| `TroubleshootingScreen` | Student | 5 guided troubleshooting scenarios (static data) |
| `SearchScreen` | Student | Live search quizzes + documents from Supabase |
| `StudentMaterialsScreen` | Student | Browse and open uploaded documents |
| `Windows11SimulatorScreen` | Student | Interactive Windows 11 UI simulation |
| `ChatbotScreen` | Student | AI chat (CompuBot) powered by Gemini |
| `ProfileScreen` | All | View/edit profile, change password, XP bar with level progress, streak, badge grid |
| `SettingsScreen` | All | Notifications toggle, sound toggle, export data |
| `LecturerDashboardScreen` | Lecturer | Folder list, quick actions (upload, quiz, classes, progress) |
| `FolderContentScreen` | Lecturer | Documents and quizzes inside a folder |
| `ContentUploadScreen` | Lecturer | Upload PDF/docs to a folder via Supabase Storage |
| `QuizCreationScreen` | Lecturer | Create quiz manually or AI-generate from uploaded file |
| `QuizDetailScreen` | Lecturer | View quiz questions, share to classes |
| `ClassManagementScreen` | Lecturer | Create classes, add/remove students |
| `ClassDetailScreen` | Lecturer | View students in a class |
| `StudentProgressScreen` | Lecturer | Per-student quiz scores and material views |

---

## Services

### `authService.js`
- `signIn(email, password)` — Supabase email/password auth
- `signUp(email, password, fullName, role)` — creates auth user + profile via DB trigger
- `signOut()` — clears Supabase session + AsyncStorage
- `getCurrentUser()` — gets auth user + joins `profiles` table
- `getOfflineUser()` — reads cached user from AsyncStorage
- `isSessionValid()` — checks 30-minute session window in AsyncStorage
- `resetPassword(email)` — sends Supabase reset email
- `updateProfile(fullName, avatarFile)` — updates auth metadata + `profiles` table + uploads avatar to Storage
- `updatePassword(currentPassword, newPassword)` — Supabase `updateUser`

### `lecturerService.js`
Covers all lecturer CRUD operations:
- **Folders**: `createFolder`, `getFolders`, `deleteFolder`
- **Documents**: `uploadDocument` (to Supabase Storage + DB), `getDocuments`, `deleteDocument`
- **Quizzes**: `createQuiz`, `getQuizzes`, `getQuizDetail`, `deleteQuiz`, `shareQuizToClasses`
- **Classes**: `createClass`, `getClasses`, `getClassDetail`, `assignStudentsToClass`, `getClassStudents`, `removeStudentFromClass`
- **Students**: `getStudents` (via RPC `get_students_with_emails`), `addStudent`, `getStudentProgress`, `getStudentDetail`
- **AI**: `generateAIQuiz(file, title, questionCount)` — delegates to `aiService`

### `aiService.js`
Uses Google Gemini 1.5 Flash (`EXPO_PUBLIC_GEMINI_API_KEY`):
- `generateQuizFromFile(file, title, questionCount)` — routes to PDF or text path
- `generateQuizFromPDF(file, title, questionCount)` — sends base64 PDF inline to Gemini
- `generateQuizFromText(text, title, questionCount)` — sends extracted text to Gemini
- `extractTextFromFile(file)` — reads file as string via `expo-file-system`
- `chatWithAI(messages)` — multi-turn chat with CompuBot system prompt

### `gamificationservice.js`
Thin wrapper over the gamification RPCs. Every method swallows errors and
returns a zeroed default, so Dashboard and Profile render 0 XP / Level 1 rather
than crashing if the backend is unavailable:
- `getMyStats()` — `get_my_stats` RPC → xp, level, current_streak, longest_streak, xp_for_current_level, xp_for_next_level
- `getMyBadges()` — `get_my_badges` RPC → earned badges
- `getLeaderboard(classId = null)` — `get_leaderboard` RPC; null classId means global scope

Note: quiz submission and grading do **not** go through this service — `QuizScreen`
calls `submit_quiz_attempt` and `get_quiz_questions_for_attempt` directly, and
`lecturerService.createQuiz` calls `set_question_gamification_settings`.

### `offlineService.js`
SQLite-backed offline cache (singleton `OfflineService` class):
- Tables: `courses`, `quiz_results`, `user_progress`
- `saveCourse`, `getCourses`, `saveQuizResult`
- `syncPendingData()` — pushes unsynced quiz results to Supabase when back online
- Network listener via `@react-native-community/netinfo`

---

## Database Schema (Supabase)

### Tables

| Table | Key Columns |
|---|---|
| `profiles` | `id` (FK auth.users), `full_name`, `role` (student/lecturer) |
| `folders` | `id`, `name`, `description`, `lecturer_id` |
| `documents` | `id`, `title`, `file_url`, `file_name`, `file_type`, `file_size`, `folder_id`, `lecturer_id` |
| `quizzes` | `id`, `title`, `description`, `passing_score` (default 70), `folder_id`, `lecturer_id` |
| `quiz_questions` | `id`, `quiz_id`, `question`, `options` (JSONB), `correct_answer`, `order_index` |
| `classes` | `id`, `name`, `description`, `lecturer_id` |
| `class_students` | `class_id`, `student_id`, `joined_at` (unique pair) |
| `quiz_assignments` | `quiz_id`, `class_id` (unique pair) |
| `quiz_attempts` | `id`, `user_id`, `quiz_id`, `score` (percentage), `completed_at` |
| `material_views` | `id`, `user_id`, `document_id`, `created_at` |

### Gamification RPCs — ⚠️ live in Supabase, not in `supabase-setup.sql`

The gamification feature depends on six Postgres functions that exist in the
Supabase project but are **not captured in this repo**. `supabase-setup.sql`
still reflects only the original schema, so the database cannot currently be
rebuilt from source. Capturing these is outstanding work.

| RPC | Called from | Purpose |
|---|---|---|
| `submit_quiz_attempt(p_quiz_id, p_answers)` | `QuizScreen` | Grades the attempt server-side; returns score, passed, correct_count, total_questions, xp_earned, max_combo, current_streak, leveled_up, new_level, new_badges[], review[] |
| `get_quiz_questions_for_attempt(p_quiz_id)` | `QuizScreen` | Returns questions **without** `correct_answer` so answers can't be read from the network response |
| `get_my_stats()` | `gamificationservice` | xp, level, streaks, level thresholds |
| `get_my_badges()` | `gamificationservice` | Badges earned by the current user |
| `get_leaderboard(p_class_id)` | `gamificationservice` | Rankings; null class id = global |
| `set_question_gamification_settings(p_question_id, p_time_limit_seconds, p_difficulty)` | `lecturerService.createQuiz` | Per-question timer and difficulty |

Backing storage (inferred from frontend usage, not yet verified against the
live database): a user stats table (xp, level, current/longest streak), a badges
table and a user_badges join table, `time_limit_seconds` and `difficulty`
columns on `quiz_questions`, and additional columns on `quiz_attempts`.

### RLS Summary
- Students can only read/write their own data
- Lecturers can manage their own folders, documents, quizzes, classes
- Everyone can view documents and quizzes (open read)
- `get_students_with_emails()` — SECURITY DEFINER RPC to expose student emails to lecturers

### Trigger
`handle_new_user()` fires `AFTER INSERT ON auth.users` → inserts into `profiles`. Sets role to `lecturer` if email is `lecturer@compuclass.com`, otherwise `student`.

### Storage
Single public bucket: `documents` — used for both course files and user avatars.

---

## Environment Variables (.env)

```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co      # base URL only, no /rest/v1/
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
EXPO_PUBLIC_GEMINI_API_KEY=<gemini_key>
```

---

## Navigation Architecture

```
ThemeProvider
└── AppContent
    ├── OnboardingScreen          (pre-auth)
    ├── LoginScreen               (pre-auth)
    ├── SignUpScreen              (pre-auth)
    ├── ForgotPasswordScreen      (pre-auth)
    └── NavigationContainer       (post-auth)
        └── Tab.Navigator (custom floating pill bar)
            ├── Dashboard / Lecturer (role-dependent)
            │   └── LecturerStack (Stack.Navigator)
            │       ├── LecturerDashboard
            │       ├── FolderContent
            │       ├── StudentProgress
            │       ├── ClassManagement
            │       ├── ClassDetail
            │       ├── ContentUpload
            │       ├── QuizCreation
            │       └── QuizDetail
            ├── Search
            ├── Profile
            ├── PC Lab            (hidden tab, no tab button)
            ├── Windows 11        (hidden tab, no tab button)
            ├── Quiz              (hidden tab, no tab button)
            ├── Troubleshoot      (hidden tab, no tab button)
            ├── Leaderboard       (hidden tab, no tab button)
            ├── Materials         (hidden tab, no tab button)
            ├── Settings          (hidden tab, no tab button)
            └── Chatbot           (hidden tab, no tab button)
        └── Sidebar (Modal overlay, swipe or button)
```

---

## Design System

All colors are defined as local constants in each file (no shared theme file used in practice):

| Token | Hex |
|---|---|
| Primary Blue | `#2563EB` |
| Yellow / Secondary | `#FACC15` |
| Red / Danger | `#EF4444` |
| Green / Success | `#22C55E` |
| Purple | `#8B5CF6` |
| Background | `#F3F4F6` |
| Surface / Card | `#FFFFFF` |
| Text Primary | `#111827` |
| Text Muted | `#4B5563` |
| Border | `#E5E7EB` |

`ThemeContext` exists but dark mode is stubbed — `toggleTheme` is a no-op and both `lightTheme` and `darkTheme` export the same `appTheme` object.

Haptics (`expo-haptics`) are used throughout for button presses and feedback. Animated spring/sequence used for card press animations and sidebar transitions.

---

## Known Issues & Notes

- **The gamification SQL is not in the repo.** Six RPCs and their backing tables exist only in the live Supabase project (see the Gamification RPCs section above). Until they're dumped into `supabase-setup.sql`, a fresh clone cannot stand up a working database, and the quiz flow will fail on any project that lacks them.
- `QuizScreen` renders `result.review.map(...)` without a guard, so a `submit_quiz_attempt` response missing `review` would crash the results screen.
- **Dark mode** is scaffolded but not implemented — `toggleTheme` does nothing.
- `offlineService` is initialized but not actively called from most screens — it's a background sync utility.
- `useOffline` hook is imported in `App.js` but `isOnline` is not currently used to gate any UI.
- `StudentMaterialsScreen`, `Windows11SimulatorScreen`, `OnboardingScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `QuizCreationScreen`, `ContentUploadScreen`, `FolderContentScreen`, `ClassManagementScreen`, `ClassDetailScreen`, `QuizDetailScreen`, `StudentProgressScreen` were not fully read — their internal logic follows the same patterns as the screens documented above.
- The lecturer role trigger only auto-assigns `lecturer` for the hardcoded email `lecturer@compuclass.com`. All other signups become `student` regardless of the `role` field passed in `signUp()`.
