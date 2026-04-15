# Pencil Canvas Map

> **Auto-generated** from `design/main.pen.index` — do NOT hand-edit this file.
> Run `npm run build:canvas` to regenerate after editing the index source.
>
> **Version**: 4.5 · **Updated**: 2026-04-14
> **Canvas file**: `design/main.pen`

**Status key**: `[x]` locked · `[~]` wip · `[ ]` pending

---

## 01 — Pages (`5NJPi`)

Full-screen app state pages, organized into 3 row groups.

### Global (`PzPpA` → content `RMj5B`)

| Status | Wrapper ID | Screen ID | Frame Name                      | Brief Section                                                                                                                                                  | Flow Anchor                                                                                                                            | Impl Path |
| ------ | ---------- | --------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `[x]`  | `45wl2`    | `ie1cs`   | `Page / App — Empty Launch`     | [02-DESIGN-BRIEF-MAIN-CANVAS.md §state minimal empty launch](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#state-1-minimal-empty--launch) | [FLOWS.md §31-from-s0--app-empty-launch](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-FLOWS.md.md#31-from-s0--app-empty-launch) | —         |
| `[~]`  | `tGAyK`    | `OFOdW`   | `Page / App — Loading`          | —                                                                                                                                                              | App bootstrap / connecting                                                                                                             | —         |
| `[~]`  | `ocedw`    | `VDOQQ`   | `Page / App — Connection Error` | —                                                                                                                                                              | Server unreachable / WS failed                                                                                                         | —         |

### Project View (`izj6z` → content `rfqvC`)

| Status | Wrapper ID | Screen ID | Frame Name                                  | Brief Section                                                                                                                                                                  | Flow Anchor                                                                                                                    | Impl Path |
| ------ | ---------- | --------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| `[~]`  | `CaGMV`    | `xtDTP`   | `Page / Project View — Empty`               | [02-DESIGN-BRIEF-MAIN-CANVAS.md §empty state no sessions in project](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#26-empty-state-no-sessions-in-project) | [FLOWS.md §32-from-s1--project-view](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-FLOWS.md.md#32-from-s1--project-view) | —         |
| `[~]`  | `pg3Rz`    | `zadyX`   | `Page / Project View — Loading`             | [02-DESIGN-BRIEF-PROJECT-VIEW.md §key states](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#5-key-states)                                                | —                                                                                                                              | —         |
| `[~]`  | `6REQx`    | `cJEIL`   | `Page / Project View — Error`               | [02-DESIGN-BRIEF-PROJECT-VIEW.md §key states](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#5-key-states)                                                | —                                                                                                                              | —         |
| `[~]`  | `aefL4`    | `pEDCs`   | `Page / Project View`                       | [02-DESIGN-BRIEF-MAIN-CANVAS.md §state project view](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#state-2-project-view)                                  | [FLOWS.md §32-from-s1--project-view](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-FLOWS.md.md#32-from-s1--project-view) | —         |
| `[~]`  | `iiVvH`    | `8VN4G`   | `Page / Project View — Search No Results`   | [02-DESIGN-BRIEF-PROJECT-VIEW.md §key states](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#5-key-states)                                                | —                                                                                                                              | —         |
| `[~]`  | `HzF6J`    | `Wuw5j`   | `Page / Project View — Filtered No Results` | [02-DESIGN-BRIEF-PROJECT-VIEW.md §key states](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#5-key-states)                                                | —                                                                                                                              | —         |

### Session View (`hwM48` → content `sbtOq`)

| Status | Wrapper ID | Screen ID | Frame Name                     | Brief Section                                                                                                                                      | Flow Anchor                                                                                                                                  | Impl Path |
| ------ | ---------- | --------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `[x]`  | `R8izv`    | `WMUr3`   | `Page / Session View — Active` | [02-DESIGN-BRIEF-MAIN-CANVAS.md §state session view](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#state-3-session-view)      | [FLOWS.md §33-from-s2--session-view-active](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-FLOWS.md.md#33-from-s2--session-view-active) | —         |
| `[x]`  | `2YJX1`    | `f23nJ`   | `Page / Session View — Frozen` | [02-DESIGN-BRIEF-MAIN-CANVAS.md §frozen session state](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#34-frozen-session-state) | [FLOWS.md §34-from-s3--session-view-frozen](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-FLOWS.md.md#34-from-s3--session-view-frozen) | —         |

---

## 02 — 02 — Sidebar (`Z3eP8`)

| Status | Node ID | Frame Name                                                                       | Brief Section                                                                                                                                   | Impl Path |
| ------ | ------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `[~]`  | `LBXG2` | `Ref / Sidebar Active`                                                           | [02-DESIGN-BRIEF-SIDEBAR.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-SIDEBAR.md)                                                    | —         |
| `[~]`  | `x23KK` | `Cmp / Stream Card States · 5 groups · 11 variants`                              | [02-DESIGN-BRIEF-SIDEBAR.md §states](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-SIDEBAR.md#23-states)                                  | —         |
|        |         | > **Active States**: `IDunE` Fresh · `anDTJ` Running · `nPean` Waiting           |                                                                                                                                                 |           |
|        |         | > **Terminal States**: `CE4nf` Idle                                              |                                                                                                                                                 |           |
|        |         | > **Interaction States**: `egiNM` Hover · `aBwVM` Selected · `AgCZ6` ContextMenu |                                                                                                                                                 |           |
|        |         | > **Display Modes**: `BKSWO` MultiCollapsed · `UUzNq` MultiExpanded              |                                                                                                                                                 |           |
|        |         | > **Meta States**: `4ItZR` Skeleton · `N2YzK` Empty                              |                                                                                                                                                 |           |
| `[~]`  | `mLw4m` | `Cmp / Sidebar Rail`                                                             | [02-DESIGN-BRIEF-SIDEBAR.md §collapsed rail px wide](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-SIDEBAR.md#9-collapsed-rail-48px-wide) | —         |
| `[~]`  | `U1nEZ` | `Cmp / Recent Item · 3 states`                                                   | [02-DESIGN-BRIEF-SIDEBAR.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-SIDEBAR.md)                                                    | —         |
| `[~]`  | `272uN` | `Cmp / Sidebar Filter · 2 states`                                                | [02-DESIGN-BRIEF-SIDEBAR.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-SIDEBAR.md)                                                    | —         |
| `[~]`  | `fiA5n` | `Cmp / Workspace Indicator`                                                      | [02-DESIGN-BRIEF-SIDEBAR.md §workspace indicator](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-SIDEBAR.md#61-workspace-indicator)        | —         |

## 03 — 03 — Session (`nlmcQ`)

| Status | Node ID | Frame Name                                                                                                                  | Brief Section                                                                                                                                                           | Impl Path |
| ------ | ------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `[x]`  | `ja1S0` | `Cmp / Session Card States · v2`                                                                                            | [02-DESIGN-BRIEF-PROJECT-VIEW.md §session card anatomy](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#8-session-card-anatomy)                     | —         |
|        |         | > **Active States**: `J7orz` Running · `wNfjI` Waiting-perm · `ljc6o` Waiting-prompt                                        |                                                                                                                                                                         |           |
|        |         | > **Terminal States**: `PuKGN` Idle · `RLyt3` Complete-ok · `wYAtR` Complete-error · `wNAmX` Frozen · `WIuCB` Archived      |                                                                                                                                                                         |           |
|        |         | > **Interaction States**: `AVpEt` Hover · `i1Tts` Selected · `Qr4YK` Dragging · `5UPFT` ContextMenu                         |                                                                                                                                                                         |           |
|        |         | > **Meta States**: `Z0oyM` Skeleton                                                                                         |                                                                                                                                                                         |           |
| `[~]`  | `7GtoT` | `Cmp / Session View Header`                                                                                                 | [02-DESIGN-BRIEF-MAIN-CANVAS.md §session header](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#31-session-header)                                  | —         |
| `[~]`  | `OyNmD` | `Cmp / Status Bar · 2 states`                                                                                               | [02-DESIGN-BRIEF-STATUS-BAR.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-STATUS-BAR.md)                                                                      | —         |
| `[~]`  | `Cmp8e` | `Cmp / Status Bar Drawer`                                                                                                   | [02-DESIGN-BRIEF-STATUS-BAR.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-STATUS-BAR.md)                                                                      | —         |
| `[~]`  | `lgBrT` | `Cmp / Status Dropdown`                                                                                                     | [02-DESIGN-BRIEF-PROJECT-VIEW.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md)                                                                  | —         |
| `[~]`  | `oSO8K` | `Cmp / PV Header States · 4 variants`                                                                                       | [02-DESIGN-BRIEF-PROJECT-VIEW.md §chrome layers](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#chrome-layers)                                     | —         |
|        |         | > **Variants**: `jtKdt` PVHeader/Both · `EZoOs` PVHeader/RunningOnly · `s3oZj` PVHeader/WaitingOnly · `zxD3h` PVHeader/Idle |                                                                                                                                                                         |           |
| `[~]`  | `IOIFu` | `Cmp / PV Filter States · 2 variants · 40px`                                                                                | [02-DESIGN-BRIEF-PROJECT-VIEW.md §change c conditional filter row](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#change-c-conditional-filter-row) | —         |
|        |         | > **Variants**: `uU7S3` PVFilter/Default · `PEz9I` PVFilter/StatusActive                                                    |                                                                                                                                                                         |           |
| `[~]`  | `6x3TG` | `Cmp / PV Tabs Search · 2 variants · 44px`                                                                                  | [02-DESIGN-BRIEF-PROJECT-VIEW.md §change b ghost search in tabs](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-PROJECT-VIEW.md#change-b-ghost-search-in-tabs)     | —         |
|        |         | > **Variants**: `fHSyN` PVTabs/SearchGhost · `paYOl` PVTabs/SearchActive                                                    |                                                                                                                                                                         |           |

## 04 — 04 — Overlays (`7fmkI`)

| Status | Node ID | Frame Name                  | Brief Section                                                                                                                      | Impl Path |
| ------ | ------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `[~]`  | `iwfSI` | `Overlay / Search Modal`    | [02-DESIGN-BRIEF.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF.md)                                                       | —         |
| `[~]`  | `eVRx5` | `Overlay / Preview Floater` | [02-DESIGN-BRIEF-MAIN-CANVAS.md §session card](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#24-session-card) | —         |
| `[~]`  | `kK9NY` | `Overlay / Context Menu`    | [02-DESIGN-BRIEF-MAIN-CANVAS.md §session card](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-MAIN-CANVAS.md#24-session-card) | —         |

---

## Pending — 未开始

| Status | Planned Frame Name                  | Brief Section                                                                                      | Note                                         |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `[ ]`  | `Page / Session View + Drawer Open` | [02-DESIGN-BRIEF-STATUS-BAR.md](./.planning/phases/02-core-sessions/02-DESIGN-BRIEF-STATUS-BAR.md) | 5th page showing drawer in context, optional |

## Gap Analysis — Brief ↔ Canvas

### Open Gaps

| #   | Area         | Description                                                                                                      | Severity  | Note                                                      |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------- | --- | ------------------------------------ | --------- | ------------------------------------------------------------ |
| 1   | Session View | Brief §3.1 specifies [←] back button; canvas has project breadcrumb but no back arrow icon                       | low       | Visual detail; functionally equivalent                    |
| 2   | Session View | Brief §3.3 specifies Chat                                                                                        | Shell     | Files                                                     | Git | Tasks tab bar; canvas uses PillStrip | by-design | PillStrip is the wireframe interpretation of the tab concept |
| 4   | Project View | Brief §6 specifies composite icon (Provider logo + status dot overlay); canvas has separate icon, no overlay dot | medium    | Canvas shows concept; composite overlay is an impl detail |
| 5   | Project View | Brief §2.2 filter bar specifies tabbed filters; canvas has dropdowns                                             | by-design | Brief v1 had tabs; wireframe evolved to dropdown pattern  |
| 6   | Status Bar   | Brief specifies State A expanded tray in PV context; canvas only shows collapsed pill strip on session view      | low       | Status bar expanded tray visible in Cmp / Status Bar      |

### Resolved

| #   | Description                                                                                     | Resolution                                                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Pages flat — no grouping                                                                        | Reorganized into 3 row groups: Global / Project View / Session View                                                                                                                                                       |
| 2   | Missing App — Loading page                                                                      | Created tGAyK / OFOdW                                                                                                                                                                                                     |
| 3   | Missing App — Connection Error page                                                             | Created ocedw / VDOQQ                                                                                                                                                                                                     |
| 4   | Missing PV empty state page                                                                     | Created CaGMV / xtDTP                                                                                                                                                                                                     |
| 5   | Missing PV loading skeleton page                                                                | Created pg3Rz / zadyX                                                                                                                                                                                                     |
| 6   | Missing PV error page                                                                           | Created 6REQx / cJEIL                                                                                                                                                                                                     |
| 7   | Missing PV all-archived page                                                                    | Created 6zQQX / p0vjF                                                                                                                                                                                                     |
| 8   | Missing PV search no results page                                                               | Created iiVvH / 8VN4G                                                                                                                                                                                                     |
| 9   | Missing PV filtered no results page                                                             | Created HzF6J / Wuw5j                                                                                                                                                                                                     |
| 10  | PV empty state missing Git/Tasks tabs                                                           | Added tabs to xtDTP                                                                                                                                                                                                       |
| 11  | Session cards: wrong cornerRadius/shadow                                                        | Updated all cards per DESIGN.md                                                                                                                                                                                           |
| 12  | Session cards: provider icons all same                                                          | Differentiated: Claude=bot, Cursor=mouse-pointer-2, etc.                                                                                                                                                                  |
| 13  | Session Card: 4 states with colored backgrounds (v1)                                            | Rebuilt ja1S0 as v2 — 8 states + Hover + ContextMenu (10 variants); accent bar replaces tinted bg                                                                                                                         |
| 14  | SessionList missing LAST 7 DAYS group                                                           | Added McPTN grp-last7days with badge 5QZbT and sample card CiU1l                                                                                                                                                          |
| 15  | SessionList group headers missing count badges                                                  | All 5 headers now have count badges: 6P3eM / nWc25 / J4Ymg / 5QZbT / EF8tz                                                                                                                                                |
| 16  | PV chrome layer optimization (Amendment A): Header status pills, Tabs search, Filter simplified | All 6 PV pages updated — Header: added status-pills (running●/waiting○ counts); Tabs: appended ghost search input; Filter: removed searchWrap, height 40→32px. Search No Results page uses active search variant in Tabs. |

---

> Edit `design/main.pen.index` to update this map, then run `npm run build:canvas`.
