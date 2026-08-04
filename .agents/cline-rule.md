# Engineering Agent Rules

## 1. Understand Before Editing

Before making any code changes:

1. Inspect the relevant project structure.
2. Identify the files directly related to the task.
3. Read the existing implementation before proposing changes.
4. Trace imports, exports, dependencies, API calls, state, and data flow.
5. Check related components, services, hooks, controllers, models, routes, and utilities.
6. Look for existing patterns in the project and follow them instead of creating parallel implementations.
7. Do not modify files simply because they look related. Confirm their relevance first.

Never make assumptions about how the application works when the codebase can answer the question.

---

## 2. Search Before Creating

Before creating a new:

- component
- hook
- utility
- API service
- controller
- model
- route
- type/interface
- configuration
- helper

Search the repository to determine whether an equivalent implementation already exists.

Prefer reusing or extending existing code over duplicating functionality.

---

## 3. Trace Changes End-to-End

For any feature or bug, trace the complete flow.

For frontend features:

UI
→ component
→ state
→ hook/service
→ API request
→ backend endpoint
→ controller
→ service/business logic
→ database
→ response
→ frontend state
→ UI

For mobile applications also check:

screen
→ navigation
→ permissions
→ device APIs
→ network availability
→ API
→ error handling
→ loading states

Do not fix only the first visible error if the underlying flow has additional problems.

---

## 4. Find Problems Before Implementing

Before implementing a requested feature, inspect the existing code for likely problems that could affect it.

Check for:

- broken imports
- incorrect paths
- unused imports
- undefined variables
- incorrect types
- missing null/undefined handling
- incorrect API URLs
- inconsistent environment variables
- missing error handling
- race conditions
- stale state
- incorrect async/await usage
- unhandled promises
- incorrect navigation
- missing loading states
- missing empty states
- authentication problems
- authorization problems
- database assumptions
- inconsistent API response shapes
- hardcoded secrets
- hardcoded production URLs
- platform-specific issues
- incorrect Expo/React Native assumptions

Fix issues that are directly relevant to the requested work.

Do not perform unrelated refactors unless they are necessary.

---

## 5. Verify Assumptions

When uncertain about a behavior:

1. Search the codebase.
2. Inspect configuration.
3. Check package versions.
4. Check documentation when necessary.
5. Run the relevant command or test.
6. Only then make a conclusion.

Do not invent APIs, package behavior, file paths, configuration options, or framework behavior.

---

## 6. Make Small, Safe Changes

Prefer the smallest change that correctly solves the problem.

Do not rewrite entire files when a targeted change is sufficient.

Preserve:

- existing architecture
- naming conventions
- coding style
- component structure
- API contracts
- database schema
- existing behavior

Avoid introducing new dependencies unless they provide a clear benefit.

---

## 7. Check Both Sides of Every API Change

Whenever an API endpoint changes, inspect both frontend and backend.

Verify:

- URL
- HTTP method
- request body
- query parameters
- headers
- authentication
- response shape
- status codes
- error responses
- loading state
- error state
- TypeScript types/interfaces

Never assume the frontend and backend contracts match.

---

## 8. Validate Database Changes

Before modifying database-related code:

1. Inspect the existing schema.
2. Check migrations.
3. Check models.
4. Check relationships.
5. Check existing queries.
6. Check constraints and nullable fields.

After changes, verify that existing functionality is not broken.

Never silently change database behavior without understanding the existing data model.

---

## 9. Error Handling

Do not hide errors.

Avoid patterns such as:

```js
catch (error) {
  console.log(error);
}