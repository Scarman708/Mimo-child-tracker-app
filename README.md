# Mimo – Baby Care Tracker (React Native + Supabase)

## Setup
1. Create a project at https://supabase.com.
2. In the SQL editor run `supabase/migrations/0001_init.sql` (tables, RLS, storage bucket, `create_child` RPC).
3. Auth → Providers → Email: enabled. (For quick dev, disable "Confirm email".)
4. `cp .env.example .env` and fill in the project URL + anon key.
5. `npm install && npx expo start`  (press `a` for Android emulator, or scan QR with Expo Go).

## Build plan (screen by screen)
| Step | Screens | Status |
|---|---|---|
| 1 | 01 Welcome, 20 Sign-in/Recovery, 02 Create Child, 03 Shortcuts, 04 Today (shell), 05 Quick Log (menu) | DONE |
| 2 | 06 Breastfeeding, 09 Sleep (persisted timers), 10 Diaper | next |
| 3 | 07 Bottle, 08 Pumping, 11 Solids/Care | |
| 4 | 14 History, 21 Event detail/edit/delete | |
| 5 | 12 Growth/Milestones, 13 Health, 16 Child Hub | |
| 6 | 17 Family/invites, 18 Reminders | |
| 7 | 15 Reports + CSV/PDF, 19 Settings, 22 offline queue/sync | |

## Key decisions
- Auth tokens in expo-secure-store (Android Keystore); every table protected by RLS via membership/role.
- Event IDs are client-generated UUIDs (idempotent saves); deletes are soft (`deleted_at`).
- Child creation is one atomic RPC (child + admin membership + default shortcuts).
