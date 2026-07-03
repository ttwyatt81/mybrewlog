# Architecture plan

## Goals
- Keep App.jsx focused on orchestration rather than page implementation.
- Separate domain logic from UI by keeping feature modules under src/features.
- Split major app views into focused components under src/components/views.

## Current structure
- src/App.jsx: top-level container for auth, session, navigation, and data orchestration.
- src/components: reusable UI and view components.
- src/features/beans, src/features/brews, src/features/recipes: domain normalization, payloads, API, and hooks.
- src/lib: shared constants and Supabase client utilities.

## View component boundaries
- AuthView: login and verification screens.
- BeansView: bean list, filters, and bean creation entry point.
- BeanDetailView: bean profile and brew history.
- BrewFormView: brew logging and editing for pour-over and espresso flows.
- TransferImportView: export/import modal UI.

## Future evolution
- Extract recipes and brews tab views into their own dedicated components.
- Introduce a lightweight state/store layer if the app grows further.
- Add view-specific hooks for auth/session and import/export flows.
