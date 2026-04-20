---
name: Full-Stack Coding Standards
description: Enforces clean architecture, modularity, and best practices for React, Tailwind, Node.js, and Express.js projects. Use when scaffolding, creating components or endpoints, refactoring, building features, or writing any code for a full-stack JavaScript project.
triggers: ["scaffold", "create component", "create endpoint", "refactor", "build feature", "write code", "add feature", "generate", "new page", "new route", "new service", "new controller", "update code", "fix code"]
---

# Full-Stack Coding Standards — Agent Instruction Manual

You are a senior full-stack engineer. Every single time you write, edit, or refactor code for this project, you MUST follow every rule in this document without exception. These rules exist to keep the codebase clean, safe, scalable, and understandable — even to someone who has never programmed before.

Before you write a single line of code, read this entire document. Then follow it precisely.

Never start server

---

## PART 1 — HOW TO THINK BEFORE WRITING CODE

Before generating any code, answer these questions internally:

1. **What is this piece of code supposed to do?** Name its single purpose in one sentence. If you cannot describe it in one sentence, it is doing too much — split it up.
2. **Where does it belong?** Every piece of code has a correct home folder. Check Part 3 (Folder Structure) before creating any file.
3. **Does this already exist?** Never duplicate logic. If a function or component already exists somewhere, reuse or extend it.
4. **Will a non-programmer understand what this does?** Name everything clearly. Code is written for humans first, computers second.

---

## PART 2 — THE GOLDEN RULES (Never Break These)

These rules apply to every file, every function, every line of code you write:

### Rule 1 — One Job Per File
Every file must do exactly one thing. A file that manages users should only manage users. A file that renders a button should only render a button. If a file is growing large or doing multiple unrelated things, split it into separate files.

### Rule 2 — Never Put Logic in Entry Points
`App.jsx`, `main.js`, and `index.js` are entry points — they are the "front door" of the application. Do NOT put business logic, data fetching, or complex functions inside them. Their only job is to wire together other modules. Think of them as a table of contents, not the book itself.

### Rule 3 — Name Everything Like a Human Would Read It
Variable names, function names, and file names must clearly describe what they are or what they do.

- ❌ Bad: `const d = getData()`
- ✅ Good: `const userProfileData = fetchUserProfileById(userId)`

- ❌ Bad: `function doThing(x) {}`
- ✅ Good: `function calculateOrderTotal(cartItems) {}`

If someone reads the name and still has to look inside the function to understand what it does, rename it.

### Rule 4 — Handle Every Error, Always
Never leave a situation where something can fail silently. Every asynchronous operation (API calls, database queries, file reads) must be wrapped in error handling. A user should never see a broken blank screen — they should always get a clear, graceful error message.

### Rule 5 — No Magic Numbers or Hardcoded Values
Do not write raw numbers or strings directly into logic.

- ❌ Bad: `if (user.age > 18)`
- ✅ Good: `const MINIMUM_LEGAL_AGE = 18; if (user.age > MINIMUM_LEGAL_AGE)`

Store constants in a dedicated constants file. This makes changing values safe and easy later.

---

## PART 3 — FOLDER STRUCTURE (Exactly Where Every File Lives)

This is the required folder layout. Never invent new top-level folders. Every new file must go into one of these locations.

```
project-root/
│
├── frontend/                        ← Everything the user sees in the browser
│   └── src/
│       ├── components/              ← Small, reusable UI building blocks (buttons, cards, modals)
│       │   └── Button/
│       │       ├── Button.jsx       ← The component itself
│       │       └── Button.test.jsx  ← Tests for this component (if applicable)
│       │
│       ├── pages/                   ← Full pages made by combining components (e.g. LoginPage, Dashboard)
│       │   └── Dashboard.jsx
│       │
│       ├── hooks/                   ← Custom React logic that can be reused across components
│       │   └── useAuthStatus.js
│       │
│       ├── services/                ← All API call functions (talking to the backend)
│       │   └── userService.js
│       │
│       ├── context/                 ← Global state shared across the whole app (e.g. logged-in user)
│       │   └── AuthContext.jsx
│       │
│       ├── utils/                   ← Small helper functions with no UI (date formatting, text trimming, etc.)
│       │   └── formatCurrency.js
│       │
│       ├── constants/               ← Fixed values used across the app (API URLs, role names, limits)
│       │   └── appConstants.js
│       │
│       └── App.jsx                  ← ONLY wires together pages and global providers. No logic here.
│
├── backend/                         ← Everything that runs on the server (invisible to the user)
│   └── src/
│       ├── routes/                  ← Defines URL paths and connects them to controllers
│       │   └── user-routes.js
│       │
│       ├── controllers/             ← Receives requests, calls services, sends responses
│       │   └── userController.js
│       │
│       ├── services/                ← All business logic and database operations live here
│       │   └── userService.js
│       │
│       ├── middleware/              ← Shared logic that runs between a request and a response
│       │   ├── authMiddleware.js    ← Checks if the user is logged in
│       │   └── errorMiddleware.js   ← Centralized error handler (catches all unhandled errors)
│       │
│       ├── models/                  ← Database schema definitions (what shape data is stored in)
│       │   └── userModel.js
│       │
│       ├── config/                  ← App configuration (database connection, environment setup)
│       │   └── db.js
│       │
│       ├── constants/               ← Fixed backend values (HTTP status codes, role names, limits)
│       │   └── httpStatus.js
│       │
│       └── index.js                 ← ONLY starts the server and connects middleware. No logic here.
│
├── .env                             ← Secret keys and environment variables. NEVER commit this to git.
├── .env.example                     ← A safe template showing what variables are needed (no real values)
└── README.md                        ← Instructions for how to run this project
```

---

## PART 4 — FRONTEND RULES (React + Tailwind CSS)

### 4.1 — Always Use Functional Components
Every React component must be a function. Never use class-based components.

```jsx
// ✅ CORRECT — Functional component
export default function UserCard({ name, email }) {
  return (
    <div className="rounded-xl p-4 bg-white shadow">
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-sm text-gray-500">{email}</p>
    </div>
  );
}

// ❌ WRONG — Class component. Never do this.
class UserCard extends React.Component { ... }
```

### 4.2 — Component Size Rule
If a component file exceeds ~100 lines, it is almost certainly doing too much. Split it. Extract inner pieces into their own component files inside `src/components/`.

### 4.3 — File Naming
| Type | Convention | Example |
|---|---|---|
| React Component | PascalCase | `UserProfileCard.jsx` |
| Custom Hook | camelCase starting with "use" | `useFormValidation.js` |
| Utility function | camelCase | `formatDate.js` |
| Context | PascalCase + "Context" | `ThemeContext.jsx` |
| Page | PascalCase + "Page" | `SettingsPage.jsx` |

### 4.4 — Styling with Tailwind
Use Tailwind CSS utility classes directly in JSX. Do not write separate CSS files unless the animation is too complex for Tailwind to handle (e.g. keyframe-heavy custom animations). Never use inline `style={{}}` props for anything that Tailwind can handle.

```jsx
// ✅ Correct
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
  Submit
</button>

// ❌ Wrong
<button style={{ backgroundColor: 'blue', color: 'white' }}>Submit</button>
```

### 4.5 — Data Fetching
Never call `fetch()` or `axios` directly inside a component. All API calls must live in `src/services/`. The component calls the service function, not the API directly.

```js
// src/services/userService.js
export async function getUserById(userId) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}
```

```jsx
// src/components/UserProfile.jsx
import { getUserById } from '../services/userService';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserById(userId)
      .then(setUser)
      .catch(console.error);
  }, [userId]);
  ...
}
```

### 4.6 — Custom Hooks
If you find yourself writing the same `useState` + `useEffect` logic in more than one component, extract it into a custom hook in `src/hooks/`. Hooks must always start with the word `use`.

```js
// src/hooks/useUserProfile.js

/**
 * Fetches and returns a user's profile data by ID.
 * Handles loading and error states automatically.
 * @param {string} userId - The unique ID of the user to fetch.
 */
export function useUserProfile(userId) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUserById(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { user, isLoading, error };
}
```

---

## PART 5 — BACKEND RULES (Node.js + Express.js)

The backend is split into exactly three layers. Think of it like a restaurant:
- **Routes** = the front door and menu (no cooking happens here)
- **Controllers** = the waiter (takes orders, delivers plates, doesn't cook)
- **Services** = the kitchen (all actual cooking/logic happens here)

### 5.1 — Routes Layer (`/routes/`)
Routes only do two things: define the URL path and point to the right controller function. Zero logic allowed here.

```js
// backend/src/routes/user-routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:id', protect, userController.getUserById);
router.post('/', userController.createUser);

module.exports = router;
```

### 5.2 — Controllers Layer (`/controllers/`)
Controllers extract data from the request, pass it to the service, and send back the HTTP response with the correct status code. They do not contain business logic or database calls.

```js
// backend/src/controllers/userController.js
const userService = require('../services/userService');

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.findUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error); // Always pass errors to the centralized error handler
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const newUser = await userService.createNewUser(req.body);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
};
```

### 5.3 — Services Layer (`/services/`)
All business logic, data validation, calculations, and database queries live here. This is the most important layer. Always add JSDoc comments explaining **why** complex logic works the way it does.

```js
// backend/src/services/userService.js
const User = require('../models/userModel');

/**
 * Finds a single user by their unique database ID.
 * Throws a descriptive error if no user is found, so the controller
 * can return a proper 404 response to the client.
 * @param {string} userId - MongoDB ObjectId as a string.
 * @returns {Promise<User>} The found user document.
 */
exports.findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`No user found with ID: ${userId}`);
  }
  return user;
};
```

### 5.4 — Centralized Error Handling (`/middleware/errorMiddleware.js`)
One single middleware catches ALL errors across the entire app. Never write individual error responses scattered across controllers — always call `next(error)` and let this middleware handle it.

```js
// backend/src/middleware/errorMiddleware.js

/**
 * Global error handler. Must be registered as the LAST middleware in index.js.
 * Catches any error passed via next(error) from any route or controller.
 */
exports.globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  console.error(`[ERROR] ${statusCode} — ${message}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    // Only show stack trace during development, never in production
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
```

### 5.5 — File Naming (Backend)
| Type | Convention | Example |
|---|---|---|
| Route file | kebab-case | `user-routes.js` |
| Controller file | camelCase + "Controller" | `userController.js` |
| Service file | camelCase + "Service" | `userService.js` |
| Middleware file | camelCase + "Middleware" | `authMiddleware.js` |
| Model file | PascalCase (singular) | `User.js` |

---

## PART 6 — COMMENTS AND DOCUMENTATION

### When to Write a Comment
Only write comments when the code itself cannot explain the **why**. Do not comment what the code does — the names should do that. Comment why a decision was made.

```js
// ❌ Useless comment — the code already says this
// Multiply price by quantity
const total = price * quantity;

// ✅ Useful comment — explains a non-obvious reason
// We cap the discount at 50% per legal compliance requirements (Contract §4.2)
const discount = Math.min(rawDiscount, 0.50);
```

### JSDoc for All Service Functions and Custom Hooks
Every function in `/services/` and every custom hook in `/hooks/` must have a JSDoc block above it explaining: what it does, what arguments it takes, and what it returns.

```js
/**
 * Calculates the final checkout total including taxes and active discounts.
 * Tax rate is pulled from environment config to support regional differences.
 * @param {Array<CartItem>} cartItems - Array of items in the user's cart.
 * @param {string} couponCode - Optional promotional coupon code.
 * @returns {Promise<number>} The final total in cents (to avoid floating point errors).
 */
async function calculateCheckoutTotal(cartItems, couponCode) { ... }
```

---

## PART 7 — ENVIRONMENT AND SECURITY

- **Never hardcode secrets.** API keys, database passwords, and tokens must live only in `.env`. Never write them directly in code.
- **Never commit `.env` to git.** Always ensure `.env` is listed in `.gitignore`.
- **Always provide `.env.example`.** This file shows exactly what environment variables the project needs, but contains no real values — just placeholder descriptions.

```bash
# .env.example
DATABASE_URL=your_mongodb_connection_string_here
JWT_SECRET=a_long_random_secret_string
PORT=5000
NODE_ENV=development
```

---

## PART 8 — QUALITY CHECKLIST (Run Before Finalizing Any Code)

Before presenting code, mentally verify every item on this list:

- [ ] Every file has exactly one clear responsibility
- [ ] No logic exists in `App.jsx`, `main.js`, or `index.js`
- [ ] All variable and function names are self-descriptive
- [ ] All async code is wrapped in try/catch and errors are passed to `next(error)` or handled
- [ ] No secrets or API keys are hardcoded anywhere
- [ ] New files are placed in the correct folder per the structure in Part 3
- [ ] Frontend API calls live in `src/services/`, not inside components
- [ ] Backend business logic lives in `/services/`, not in routes or controllers
- [ ] JSDoc comments exist on all service functions and custom hooks
- [ ] No duplicate logic — reuse existing utilities and functions where possible
- [ ] Tailwind classes are used for styling; no inline styles
