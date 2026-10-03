# Intranet flow recordings

## Unified shadcn/ui interface

- [Desktop ecosystem walkthrough](intranet-unified-flow.mp4) — 95 seconds, 52 chapters across Portal, users, Kuutio, and Työaika. [Chapters](intranet-unified-chapters.md).
- [Mobile walkthrough](intranet-unified-mobile.mp4) — 25 seconds at 390 px, with 12 chapters and no horizontal page overflow. [Chapters](intranet-unified-mobile-chapters.md).

These recordings show the current shared interface and real local browser interactions.

## Earlier interface

- [Desktop ecosystem flow](intranet-ecosystem-flow.mp4) — 94 seconds, 52 chapters covering the portal, users, Kuutio, and työaika. [Chapter list](intranet-ecosystem-chapters.md).
- [Mobile flow](intranet-mobile-flow.mp4) — 25 seconds at a 390 px viewport. [Chapter list](intranet-mobile-chapters.md).

The videos capture real local Firefox sessions. The desktop tour exercises registration, development password reset, sign-in and SSO, portal cards and booking, service and user administration, recurring Kuutio bookings and statistics, and työaika punching, roster, and monthly views. Temporary accounts, bookings, and worktimes were removed after capture. The three service registrations remain in the local development database so the apps can use SSO.

The recording scripts are [`scripts/record-intranet-flow.mjs`](../scripts/record-intranet-flow.mjs) and [`scripts/record-mobile-flow.mjs`](../scripts/record-mobile-flow.mjs). The reset link is shown directly only in development; production password reset requires configured email delivery.
