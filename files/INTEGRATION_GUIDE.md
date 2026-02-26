# 🤝 Shared (Party) Habits — Integration Guide

## What's included

| File | Purpose |
|------|---------|
| `SharedHabitCard.jsx` | Displays one shared habit with member avatars, progress bar, and toggle |
| `CreateSharedHabit.jsx` | Form to create a party and invite teammates by username |
| `SharedHabits.jsx` | Full page/tab that orchestrates both + API calls |
| `sharedHabits.routes.js` | Express router — drop into your backend |

---

## 1. Backend setup

### Register the route (in your main `server.js` / `app.js`)
```js
const sharedHabitsRouter = require("./routes/sharedHabits");
app.use("/api/shared-habits", sharedHabitsRouter);
```

The router self-defines the Mongoose schema inline for simplicity.
You can also extract the schema to `models/SharedHabit.js` — the code shows both options.

### Endpoints created
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shared-habits` | Get all party habits for the logged-in user |
| POST | `/api/shared-habits` | Create a new party habit |
| POST | `/api/shared-habits/:id/toggle` | Toggle your own completion for today |
| POST | `/api/shared-habits/:id/leave` | Leave the party |
| DELETE | `/api/shared-habits/:id` | Creator deletes the habit |

---

## 2. Frontend — copy files

Move these 3 files into your `src/components/` folder:
- `SharedHabitCard.jsx`
- `CreateSharedHabit.jsx`
- `SharedHabits.jsx`

---

## 3. Wire up the tab in `App.jsx`

### Add import at the top
```jsx
import SharedHabits from "./components/SharedHabits";
import partyIcon from "./assets/icons/party.png"; // add an icon or reuse one
```

### Add the tab render (in the tab content section, alongside `activeTab === "goals"` etc.)
```jsx
{activeTab === "party" && <SharedHabits currentUser={user} />}
```

### Add the nav button (in `<div className="bottom-nav">`)
```jsx
<button
  className={activeTab === "party" ? "active" : ""}
  onClick={() => setActiveTab("party")}
>
  🤝  {/* or use an icon image */}
</button>
```

---

## 4. How it works

```
User creates a party habit → invites teammates by username
         ↓
All members see the habit in their "Party Habits" tab
         ↓
Each member taps their own ✓ button to mark complete
         ↓
Progress bar fills up as teammates complete
         ↓
When EVERYONE marks done → streak increments 🔥
         ↓
If any member misses midnight → streak resets for the whole team
```

### Streak logic
- Streak only increments when **all** members complete the habit **on the same calendar day**
- Consecutive days of full-team completion build the streak
- Missing a day resets the counter to 0
- The UI polls every 30 seconds so you can watch teammates check in live

---

## 5. Optional enhancements (future)

- **Push notifications** when a teammate completes — add a webhook/push call inside the `toggle` route
- **Invite links** — generate a token-based join link instead of username lookup
- **Party chat** — hook into your existing `ChatSystem` with the shared habit ID as the room
- **XP for party completion** — grant bonus XP to all members when `allDone` triggers in the toggle route
