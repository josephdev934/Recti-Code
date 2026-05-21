# ⚡ Recti Code — AI Code Review Platform

**Recti Code** is a premium, high-fidelity AI-powered code auditing and review workspace built with Next.js, Mongoose, and Google Gemini AI. It scans your source code, runs key audits, identifies security vulnerabilities, computes dynamic code health scores, and recommends performance-oriented refactoring diffs.

---

## 🤖 What the AI Audit Engine is Doing

When you submit a snippet or file of code in the **Recti Code** workspace, the system invokes the **Gemini AI Core Engine (`gemini-2.5-flash-lite`)** to perform a rigorous 5-dimensional structural analysis:

### 1. 🔍 Deep Defect Scanning (Bugs)
- Scans for syntax mistakes, logical bugs, reference errors, unhandled promise rejections, type safety failures, and runtime exceptions.
- Provides a direct description of the bug and outputs highly accurate, compile-safe corrected code.

### 2. ⚡ Performance Bottleneck Detection (Optimizations)
- Analyzes resource overheads, excessive iterations, redundant DB calls, memory leaks, or lack of caching.
- Employs dynamic tags such as `REDIS`, `PERFORMANCE`, and `DATABASE` to flag components that need tuning, showing you optimized alternatives.

### 3. 🛡️ Security Vulnerability Assessment (Security Fix)
- Inspects your code for high-impact security breaches, such as SQL Injections, Cross-Site Scripting (XSS), hardcoded environment credentials, unvalidated inputs, or weak password-hashing procedures.
- Provides secure alternative blocks with color-coded syntax replacements (`- deletions` and `+ additions`).

### 4. 📐 Best Practices & Lint Auditing
- Validates the code against modern industry conventions, readability standards, proper scoping (`let` / `const` vs `var`), variable naming schemas, and modularity principles.

### 5. 🏗️ Architecture & Clean Code Recommendations
- Advises on architectural improvements, solid design patterns, separation of concerns, and clean, reusable coding abstractions.

---

## 📊 Analytics & Interactive UI Translation

1. **Overall Health Score:** The AI computes an `overallScore` scale from `0` to `10`. The front-end translates this into a glowing color-coded `HEALTHY: XX%` dashboard banner.
2. **Visual Code Diffing:** Fixes returned by the AI are formatted inside a sleek dark code frame, displaying clear additions and deletions to let you copy and merge improvements instantly.
3. **Timeline-based Audits History:** Audited snippets are securely stored in **MongoDB** and grouped chronologically under `TODAY`, `YESTERDAY`, and `EARLIER` timelines with interactive badges denoting recommendations, refactoring, and severity levels.
4. **Smart Rate Limiting:** All incoming audit queries are tracked via an IP rate-limiter, protecting your API limits while ensuring a smooth developer experience.

