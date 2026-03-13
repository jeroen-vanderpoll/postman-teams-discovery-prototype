# DatabaseTable Controls Pattern (Slack Hybrid v1)

This document defines the reusable controls pattern for `DatabaseTable` in the
playground prototype.

## Controls anatomy

- Semantic input with placeholder: `Tell us what you're looking for`
- `Filters` icon button opens a structured modal
- `Columns` icon button controls visible columns
- `Ask AI` action for fast intent-driven filtering
- List/card toggle remains available
- Sorting is list-only for MVP

## Filter contract rules

- Filters must map to real data from columns (`column.id` + `getValue`).
- Filter sections should reflect filterable, visible table columns.
- Do not introduce pseudo fields that are not present in the dataset.
- Multi-select sections are include-only and start unchecked.
- No `All ...` pseudo-option rows for multi-select sections.

## Dataset mapping (playground)

- Teams:
  - Membership: `Member`, `Collaborator`, `Not a member`
  - Semantic intents map to membership combinations
- Workspaces:
  - Type (`access`): `Internal`, `Partner`, `Public`
  - Role: `Admin`, `Editor`, `Viewer`
- Members:
  - Membership: `Member`, `Collaborator`
  - Role: `Manager`, `Developer`

## Semantic input behavior (MVP)

- Input accepts free text and attempts intent parsing.
- Supported intents resolve to filters and optional list sort.
- If parsing fails, fallback to plain text search.

## View parity rules

- List and card share the same search/filter state per dataset.
- Card view does not expose sorting controls in MVP.
- List keeps sorting interactions.

## Defaults and reset policy

- Default is all columns visible.
- No persistent table configuration in playground.
- Switching dataset tab or reloading resets to defaults.

## Out of scope for v1

- Full query syntax (JQL-like grammar)
- Saved views and user-level persistence
- Server-side filtering/sorting
