# 🔐 Vibe Coding Security Checklist

> Source: [mdsaban/vibe-checklist.md](https://gist.github.com/mdsaban/29ffbb6974ce2fa9acc37415b9a4b684)  
> Run these prompts after fast coding sessions to audit security.

---

## 0. Global System Prompt (set as project rule)

> You are an expert, security-conscious senior developer. While writing code, you must prioritize security over speed. Never hardcode API keys or secrets. Always validate and sanitize user input. Prefer established managed services (like Supabase/Firebase) over custom authentication. Flag any potentially insecure architectural decisions before writing the code.

---

## Codebase Audit Prompts

### 1. Find Leaked Secrets
> Scan all frontend and client-side files for hardcoded API keys, secrets, or tokens. If found, refactor the code to fetch these securely from the server using environment variables.

### 2. Audit Input Sanitization (XSS & SQLi)
> Review all API controllers and database queries. Identify any areas where user input is executed or saved without sanitization or parameterization. Rewrite these sections to strictly prevent SQL injection and XSS.

### 3. Implement Rate Limiting
> Analyze my API routes, specifically the endpoints that interact with external AI models (like OpenAI or Gemini). Implement a robust rate-limiting middleware to prevent scraping, bot attacks, and API billing abuse.

### 4. Check Auth Architecture
> Review my current authentication implementation. If there is any custom-rolled session management or password hashing, provide a migration plan to replace it with a secure, pre-built solution like Supabase, Clerk, or Firebase Auth.

### 5. Enforce API Versioning
> Review my current API routing structure. Refactor the routes to implement standard API versioning (e.g., prepending /api/v1/ to the endpoints) while ensuring no existing internal logic breaks.

### 6. Secure File Uploads
> Audit the file upload logic in the codebase. Ensure that there is strict server-side validation for MIME types and maximum file size limits. Confirm that uploaded files are stored in a non-executable directory and cannot overwrite system files.

### 7. Dependency Check
> Review my package.json. Identify any libraries that are known to be insecure, unmaintained, or redundant. Suggest secure, well-maintained alternatives.

---

## Kaelus.ai Status

| Check | Status | Notes |
|-------|--------|-------|
| Leaked Secrets | ✅ Clean | All secrets in `.env.local`, gitignored |
| Input Sanitization | ⚠️ Review needed | Chat API needs input validation |
| Rate Limiting | ✅ Basic | `lib/rate-limit.ts` exists, needs Redis |
| Auth Architecture | ✅ Supabase | Using Supabase Auth (managed) |
| API Versioning | ❌ Not implemented | Routes at `/api/` without versioning |
| File Uploads | N/A | No file upload features yet |
| Dependency Check | ⚠️ Review needed | Should run `npm audit` regularly |
