# Agent Instructions

- After making code changes, run `npm run typecheck`.
- Prefer clean, beautiful, idiomatic, modern, and type-level typesafe code; use modern patterns and features.
- Encode domain and API wrappers with explicit, typesafe models; keep abstractions modular.
- Avoid redundancies; favor modular systems, clear abstractions, and proper configuration.
- Keep constants, hardcoded maps, and config-style values modularized in dedicated files/systems.
- Prioritize maintainable code and excellent UX; UI should be minimal, gorgeous, and eye-candy.
- Uniwind (Tailwind 4): avoid `className` directly on `Pressable`; wrap content in a child `View` with `className` instead. Use `cn()` from `@/utils/cn` to merge classNames (powered by tailwind-merge).
- When adding a new library import that wasn't previously used in the codebase: (1) search for existing usage patterns first (`grep -r "ComponentName" .`), (2) check if it requires a root-level provider (e.g., `GestureHandlerRootView`, `SafeAreaProvider`), and (3) consult the library's installation docs, not just the API docs. Common culprits: `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`.
- **UI Consistency**: When creating new screens or components, study existing patterns in the codebase first. Match header layouts, navigation patterns, spacing, and component structure to maintain visual and behavioral consistency.
- **Frontend Design (Distinctive UI)**: For web/UI work, commit to a clear visual direction (e.g., editorial, industrial, refined, etc.) with an explicit differentiation hook; use distinctive type pairing (avoid Inter/Roboto/Arial/system as primary fonts), define theme tokens with CSS variables, add atmospheric backgrounds (gradients, textures, shapes), and include a small number of meaningful animations (page-load/staggered reveal) rather than generic micro-motion. Avoid generic AI aesthetics, cookie-cutter layouts, or purple-on-white defaults.
- **Fail-fast configuration**: Essential configuration (API URLs, secrets, required env vars) must never have silent fallback defaults. If required config is missing, fail immediately with a clear error message explaining what's missing and how to fix it. This prevents apps from running in broken states and makes misconfiguration obvious during development/deployment rather than causing mysterious runtime issues.
- **Single source of truth for config**: All configuration values—required or optional—should flow through a single configuration system rather than being scattered across hardcoded values, multiple env files, or runtime fetches. Define all config in one place (e.g., environment variables), read it once at startup, and import from that single module throughout the codebase.
- **Async buttons**: When a button triggers an async action, disable it during the request (and adjust visual state), but do not change the button label to indicate loading.
- **Instant UI responses**: No artificial delays for UI elements - keyboard shortcuts info, tooltips, and overlays should appear immediately (not after 1-2 seconds). Loading states are only for actual async operations.
- **Creative & unique design**: Be creative with UI/UX - beautiful toolbars, distinctive interactions, professional polish. Avoid generic patterns; each feature should have thoughtful, memorable design.
- **Authentication & security**: Build secure, modular, extensible auth systems. Admin-only features should be completely invisible (not just disabled) to non-admin users. Use role-based access control.
- **Modular architecture**: Components should be reusable and composable. Plan for extensibility without over-engineering. Clear separation between UI, logic, and data layers.
- **No duplicate UI elements**: Audit interfaces for redundant controls (e.g., duplicate bookmark icons). Each action should have exactly one clear UI path.
