---
version: 1
slug: "src-features-dashboard-index-tsx"
primary_target: "src/features/dashboard/index.tsx"
related_targets: []
---

# Merchant dashboard

## Scope and mode

Operate surface for the Arabic RTL merchant portal. Redesign the authenticated merchant experience: home, orders, products, storefront themes, and store settings. Preserve authentication, API behavior, live updates, navigation destinations, existing light/dark colors, and the React/TanStack architecture. The user did not answer the scope question; the merchant-only scope is inferred from the request and current app.

## Direction contract

THESIS: Make the dashboard a queue-first merchant workspace: surface what needs attention before secondary store information, rather than leading with interchangeable metric tiles.

OWN-WORLD: Keep the current blue/navy light and dark theme tokens and Cairo Arabic typography. Use the existing blue for selected navigation and primary actions; use semantic status colors only for order and connection state. Retain familiar web controls and the sidebar/topbar navigation model.

STORY: The merchant can see the store identity, distinguish orders waiting for action from work already in progress, and reach products, orders, storefront appearance, or settings without hunting.

FIRST VIEWPORT: RTL shell with a compact brand-led sidebar and a single responsive top bar. Start the page with its title, context, and relevant action. On home, show store identity and its working links, then the four existing factual counters, followed by recent orders and products. At phone widths, collapse navigation into the existing sheet and stack content without horizontal scrolling.

FORM: Queue-first merchant workspace, selected as the closest fit to the existing order-first workflows and the user's performance and consistency constraints. This was inferred because the user was unavailable to lock a concept card. Signature: a compact, color-coded order-state cue paired with the real pending-order count. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
