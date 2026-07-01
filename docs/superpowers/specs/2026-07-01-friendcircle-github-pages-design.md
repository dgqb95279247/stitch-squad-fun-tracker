# FriendCircle GitHub Pages Design

Date: 2026-07-01
Status: Approved for implementation
Decision: Build a static multi-page website for GitHub Pages using the existing FriendCircle prototypes as the visual and structural baseline.

## Goal

Turn the current prototype files into a polished, deployable website that can be hosted directly from a GitHub repository with GitHub Pages.

The site should feel like a lightweight product demo for a friend activity tracker called FriendCircle / YouQuan. It should preserve the current soft, social, blue-led visual identity while fixing content consistency, navigation, encoding issues, and deployment readiness.

## Why This Approach

Three approaches were considered:

1. Static multi-page site
2. Vite multi-page site
3. Single-page app with simulated routing

The selected approach is the static multi-page site because it offers the fastest path to a reliable GitHub Pages deployment, requires the least rework of the existing HTML prototypes, and avoids adding build complexity that the current project files do not need.

## Site Structure

The finished site will live at the repository root and use direct HTML entry points:

- `index.html`: Home
- `stats.html`: Stats and leaderboard
- `record.html`: Record activity
- `detail.html`: Activity detail

Supporting assets will be organized under:

- `assets/css/`: shared styles
- `assets/js/`: shared interactions and page helpers
- `assets/images/`: local images, icons, and optional preview graphics

This structure is intentionally GitHub Pages friendly and does not depend on a build step.

## Content Model

The site will keep the existing FriendCircle theme.

Core story:

- A small circle of friends tracks game nights and social activities
- Each page demonstrates one part of the product experience
- The website is a polished prototype, not a fully backed application

Primary pages:

1. Home
Shows greeting, member balances, quick CTA, and recent activities.

2. Stats
Shows leaderboard, win-rate comparison, and settlement overview.

3. Record
Shows a clean activity entry form with game type, participants, location, and a media upload area.

4. Detail
Shows one completed session with scores, expense split, photo highlights, and comments.

## Visual Direction

The design must follow the intent captured in `kinship_play/DESIGN.md`:

- bright blue primary identity
- soft rounded cards
- airy backgrounds
- gentle shadow depth
- friendly typography hierarchy

The implementation will unify the visual language across all pages by:

- keeping a shared color token set
- using consistent spacing and card radii
- standardizing headings, labels, and button treatments
- removing inconsistent English/Chinese mixing where it feels accidental
- replacing broken or garbled text with clean Simplified Chinese copy

## Typography

The current prototypes use Quicksand for headlines and Be Vietnam Pro for body text. That pairing will be preserved because it already matches the existing design language well.

Usage rules:

- Quicksand for branding and large page headings
- Be Vietnam Pro for supporting copy, labels, and data-heavy sections
- readable Chinese copy should still render acceptably with web-safe fallbacks

## Navigation and Interaction

The site should behave like a lightweight product demo rather than a dead mockup.

Interaction scope:

- bottom navigation should work across main pages
- top-level CTA buttons should link to the appropriate page
- back actions on detail-style screens should link to the most logical source page instead of relying only on browser history
- lightweight hover and press states should remain
- decorative controls that have no real data action may stay presentational

No backend, authentication, or persistent data entry will be added in this implementation.

## Technical Cleanup

The current prototype set contains issues that must be normalized during implementation:

- text encoding problems causing garbled characters
- duplicated font includes
- inconsistent page titles and language tags
- repeated inline Tailwind configuration blocks
- page-specific styles embedded directly in each file

Implementation should consolidate these into cleaner shared assets where practical, while still keeping the final site simple and static.

## Resource Strategy

Because GitHub Pages serves static files well, the site should prefer:

- local shared CSS and JS files for maintainability
- relative links between pages
- stable external font/CDN references only where they meaningfully reduce setup complexity

If a prototype depends on remote imagery that is not essential, it may be replaced with simpler local-friendly placeholders or retained if it remains stable and visually useful.

## Accessibility and Responsiveness

The site should work well on desktop and mobile.

Minimum expectations:

- navigation remains usable on narrow screens
- content cards do not overflow horizontally
- text remains legible without zooming
- interactive items have visible hover or active states
- images include meaningful `alt` text when they convey content

## GitHub Pages Deployment Requirements

The repository should be ready for direct GitHub hosting after implementation.

That means:

- repository root contains the entry pages
- all asset paths are relative and portable
- no local-only absolute paths remain
- a `README.md` explains how to deploy with GitHub Pages

Optional but helpful:

- a simple project description
- a page list
- a note that the site is a static prototype/demo

## Verification Plan

Implementation will be considered ready when the following checks pass:

1. All four pages open locally without missing assets
2. Navigation links connect the pages correctly
3. Text is no longer garbled
4. Mobile viewport layout remains intact
5. Shared styles load correctly from the asset folder
6. The repository structure is suitable for GitHub Pages publishing

## Out of Scope

The following are intentionally excluded from this implementation:

- backend APIs
- real account systems
- real photo upload
- real activity persistence
- data synchronization
- admin tooling

## Implementation Notes

The implementation should prioritize reuse over unnecessary reinvention. Existing prototype structure may be adapted, split, or simplified, but the final result should feel cohesive rather than like four isolated screenshots turned into pages.

The main success criterion is a clean, navigable, polished static website that looks intentional and can be published to GitHub Pages without extra tooling.
