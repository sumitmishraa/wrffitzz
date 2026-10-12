---
name: plankton-code-quality
description: Multi-phase code quality and static analysis gate from ECC — enforces formatting, linting, complexity ratchets, and pre-commit checks.
---

# Plankton Code Quality & Static Analysis

Core rules:
1. **Formatting & Linting**: Zero syntax errors, zero unused imports, clean formatting.
2. **Component Complexity**: Break down monolithic components into reusable sub-components.
3. **Ratchet Ceiling**: Enforce regression prevention; never suppress errors with blanket ignores.
4. **Clean Builds**: Validate Next.js build and Turbopack dev outputs cleanly.
