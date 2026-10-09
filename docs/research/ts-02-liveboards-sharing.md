# ThoughtSpot Research 02 — Liveboards, Sharing, Scheduling, Alerting, Collaboration

Researched 2026-08-31 from thoughtspot.com product pages, docs.thoughtspot.com (Cloud
"latest" / 26.8.0.cl) and developers.thoughtspot.com. Quoted strings are copied verbatim.
Anything unconfirmed is flagged **[UNVERIFIED]**.

---

## 1. Liveboards

Sources: `/cloud/latest/liveboards` · `/cloud/latest/liveboard-experience-new` ·
`/cloud/latest/liveboard-layout-edit` · `/cloud/latest/liveboard-notes` ·
`thoughtspot.com/product/visualize`

"Liveboards are the ThoughtSpot term for a dashboard. They group and manage related search
result visuals." The differentiator is that they are live, not rendered: "Liveboards always
have the most current data." Marketing: "Unlike static dashboards, Liveboards provide a
real-time, interactive view of your data," versus traditional dashboards described as
"limited and cumbersome, requiring manual input."

- **Tiles.** Users "pin charts and tables to any Liveboard" they created or can edit.
- **Tabs** (since 8.7.0.cl): "Separate your Liveboard into multiple tabs, grouping specific
  visualizations together in each tab" — e.g. an exec KPI tab plus a manager detail tab.
  Added via **+ Add tab** in edit mode; a tile moves with **More → Move to tab**.
- **Note tiles.** **Edit → Add note** places a rich-text tile anywhere: H1–H2, bold/italic/
  underline/strikethrough, lists, tables, hyperlinks, images (max 5 MB), iFrame embeds. Used
  for "defining terminology used in the dashboard" and explaining complex visualizations.
- **Layout.** Edit mode only ("To make changes to your Liveboard… you must be in edit mode");
  **Edit** sits upper-right, greyed out without privileges. Drag by the bar atop a tile;
  resize freehand from the corner or pick from the **Tile size** menu (five presets). It is a
  "relative flow layout"; the new experience promises "Other tiles will not move unexpectedly."
- **Undo / redo / reset** sit left of **Explore**; reset restores "its last saved state."
- **More options menu**: **Present** (live slideshow), **Download as PDF**, **Export TML**,
  **Create schedule** / **Manage schedule**, verification actions.

Removed in the new experience: sharing an individual visualization (replaced by copy-link),
switching Liveboards from the title, copy-embed-link.

---

## 2. Filters, cross-filtering, personalised views

Sources: `/cloud/latest/liveboard-filters` · `/liveboard-filters-cross` ·
`/personalized-liveboard-views`

**Filter chips** run in a row beneath the Liveboard name and description; clicking one opens
the filter window. Two modes: in *view mode* a read-only user changes filter **values** only
(include/exclude); in *edit mode* you control defaults, which visualizations the filter
applies to, and linked filters.

**Liveboard-level vs visualization-level.** By default a filter applies to all visualizations
based on Models, but a creator can "specify the visualizations or tabs that a Liveboard filter
should apply to." Types: bulk, exclude, **linked** (columns across Models), and **mandatory**
(asterisked; "visualizations won't load until values are selected").

**Key governance nuance:** "When you apply a filter, the Liveboard is not automatically saved
with your filter applied." Persisting one needs edit access to the Liveboard *and* view access
to the data source. That is what makes read-only exploration safe.

**Cross filters** ("brushing and linking"): right-click a data point → **Filter** to filter the
whole board by that value. They land in the same filter bar; removed via **Remove filter**, the
hover **x**, or **Clear all** (which clears cross filters but preserves permanent ones). They
are "not permanent, and do not appear to other users," apply only to attributes, and dates are
unsupported.

**Personalised views** are the standout. Apply filters → **Save** → **Save view** → name it →
optionally tick **Make view available to all users** (needs edit permission) → **Save**. The
view "retain[s] the filter values, and remain[s] synced with the original Liveboard" — a
bookmark, not a fork; the URL carries a `view_ID`. Unsaved edits show "a dot… next to the view
name"; click the name → **Update**. Managed via **Select view → Manage views**. Limits: not in
ThoughtSpot Mobile; "New filters can't be added in a personalized Liveboard, they must be added
in the original"; deleting the original deletes all its views; with RLS on, "the filter chip
preview and tooltip do not follow RLS."

---

## 3. Sharing & permissions

Sources: `/cloud/latest/share-liveboards` · `/share-answers` · `/sharing` ·
`developers.thoughtspot.com/docs/access-control-sharing`

Framing: "Whenever you are working in ThoughtSpot, you are in your own private environment
until you share your work with others."

**Two modes**, per recipient, from a dropdown: **Can View** — "Provides read-only access";
**Can Edit** — "Allows modification. Enables renaming or deleting the shared object" (edits
save automatically). API equivalents `READ_ONLY` / `MODIFY`.

**Recipients** are users *or groups*. "You can only enter email addresses whose domains are in
your list of allowed domains" (an info icon reveals the list); an **x** removes a row. Under
multi-tenancy "you can only share with other users in your specific Org."

**Object access and data access are separate axes, shown inline.** If a recipient lacks data
access a black warning symbol appears; the sharer ticks **"Give view access to underlying data
sources."** If they don't own the source, "ThoughtSpot emails the owner or administrator to
request access," and once granted "the warning symbol turns into a green checkmark." This is
the best idea in the flow.

**Link sharing is deliberately not access-granting:** "Sending users this link does not share
the object with them. You must also share the object by selecting the **Share** button."

**What a recipient sees:** "the most recently saved version with the most recent data" — it
re-runs; it is not a snapshot. Shared Answers "appear in their most recent state — including
any filters added after the initial save."

**Cascade:** "If you share **Can View** or **Can Edit** privileges for an object with other
people, they can further share them with others." No documented "viewers cannot reshare" lock.

**Discoverability** is a third mode: marking an item discoverable exposes it to your groups
subject to data access; others must "request access."

Caveat: if a hidden column appears in a pinned Answer, "the entire Liveboard becomes read-only
to users," blocking filter changes and downloads.

**Re-running per viewer** is confirmed for interactive viewing (latest data, RLS applies) and
for scheduled delivery (§4). A developer-doc line — "When an object is shared, users can view
all the data regardless of the permissions set at the parent object level" — appears to concern
parent-object permissions rather than RLS; treat the exact interaction as **[UNVERIFIED]**.

---

## 4. Scheduling & delivery

Sources: `/cloud/latest/schedule-liveboards` · `/liveboard-schedule` ·
`/scheduled-liveboards-management` · `/cloud/10.13.0.cl/liveboard-gating-condition-example`

Entry: **More → Create schedule** (or **Manage schedule**). Global view: **Data > Utilities >
View Liveboard schedules**.

| Field | Detail |
|---|---|
| **Name** | Unique; "doesn't appear in the email" |
| **Add Comment** | Renders as "Description: `<your content>`" in the email body |
| **Frequency** | Every *n* minutes (5/10/15/20/30/45), Hourly, Daily, Weekly, Monthly. Anchored to "your time zone's start of day (00:00)", not creation time |
| **File type** | PDF · CSV · XLSX (+ advanced PDF layout / which visualizations / which tabs) |
| **Email body** | Optional commentary |
| **Add Snapshot of Liveboard** (Early Access) | PNG of the main tab |
| **AI Highlights** | "quick metric insights on how key performance indicators have changed" |
| **Gating Condition** | Boolean, e.g. `sum (revenue) > 100` |
| **Recipients** | Users, groups, external emails (admin-approved domains). Max 1,000 |
| **Views** | Send a saved personalised view instead of the default state |

PDF holds all visualizations in one attachment but tables are "limited to first 100 rows";
CSV/XLSX are table-data only, one attachment per table, all rows. A corrupted Liveboard blocks
CSV/XLSX entirely; PDF renders "empty/error slots." Email cap 22 MB; since 9.2.0.cl admins can
disable attachments. Email: from `admin`, subject "`<Liveboard name>` update", body = greeting
+ description + a **View Liveboard** button.

**Per-recipient security:** "Scheduled Liveboards adhere to row-level security rules."
ThoughtSpot-user recipients "see only data they have view-level access to"; external recipients
get data "based on the scheduler's permissions." Gating conditions evaluate per user — queries
"execute under their credentials to respect row-level security… If a recipient lacks data
access, the schedule skips sending to that user while delivering to others with access."

**Gating conditions** must return a single boolean (`sum (revenue) > 100` valid;
`is_weekend (commit_date)` invalid, "returns per-row results"), all columns from one source —
picking a column locks the source. Worked example: sales variance >20% DoD, product count
outside 4000–5500, customers below 20,000.

**Management:** bulk **Delete / Resume / Pause**; per-job Pause/Resume/Edit/Delete; expanding a
row shows "start and end times of the job, as well as the status." Non-admins see only their
own. "You can have up to 50 scheduled jobs on your cluster at time." Deleting a Liveboard
deletes its schedules. Scheduling for others needs the **"can schedule for others"** privilege,
which ThoughtSpot advises being conservative with. You cannot unsubscribe from a schedule you
created — "only the creator can manage it."

---

## 5. Monitoring / KPI alerts

Sources: `/cloud/latest/monitor` · `/monitor-alert-threshold` ·
`/cloud/10.10.0.cl/monitor-alert-attributes` · `developers.thoughtspot.com/docs/webhooks-kpi`

Alerts hang off **KPI charts**, not Liveboards. "KPI charts must be saved as Answers before
creating alerts," and "Pinned KPI visualizations in edit mode cannot have alerts created."

**Start:** hover the KPI tile → **Monitor** icon (upper right), or **more options → Create
alert**. A type-picker offers **"KPI crosses a set limit"**, **"Values of an attribute crosses a
set limit"**, **"Regular updates on values of an attribute"**, plus scheduled (hourly/daily/
weekly/monthly) and **Anomaly** alerts (emails now show "upper and lower expected-behavior
boundaries").

**Threshold config:** optional **Alert name**; operators *Greater than, Greater than or equal
to, Less than, Less than or equal to, Equal to, Not equal to*; for time-series KPIs also
*Changes by (%)*, *Increases by (%)*, *Decreases by (%)*. Frequency shows a default with a
**change** link; hourly alerts are "sent at 30- or 60-minute mark"; timezone selectable, plus a
weekend-delivery choice. Optional **Custom message** and **Query details**.

**Recipients:** you auto-populate; add teammates or groups — but "Users must be removed from the
group to be removed from the alert schedule." View access lets you subscribe people who already
have view access; edit access lets you subscribe anyone. "Alert subscriptions respect RLS
settings — subscribers see only data within their permitted scope."

**Channels:** **Email** and **Custom channel** (webhook). **Slack is Early Access** — the
creator connects their Slack account and the **Spotter** app must be in the destination channel.
Webhooks POST JSON (`SchemaVersion: v1`, `EventSchemaType: MONITOR`, `NotificationType`,
`CurrentUser`, `MonitorRuleForWebhook`, `RuleExecutionDetails`). **Microsoft Teams as a native
alert channel is [UNVERIFIED]** — the Slack marketing page mentions Spotter in Slack and Teams,
but Monitor docs list only Email, Slack (EA) and Custom channel.

**Managing:** **Insights** tab → **Monitor subscriptions**, with **All** (created *or*
subscribed) vs **Yours**; subscribe/unsubscribe, edit, change notification settings. Also
**More → Manage alerts → Edit alert**. Alert emails link to view, modify or unsubscribe.

**Noise control is weak.** No per-alert snooze or mute is documented **[UNVERIFIED / not
found]**. Instead there is an admin floor — **Admin > Search & SpotIQ > SpotIQ Settings >
"Shortest time period to check alerts"** — which removes faster cadences from the user's picker
entirely. Plus a sampling caveat: "If your KPI temporarily satisfies the threshold condition,
but does not satisfy the condition at the time the threshold condition is next checked, you will
not receive an alert notification."

---

## 6. Collaboration

Sources: `/cloud/latest/liveboard-comment` · `/liveboard-verify` · `/chart-kpi`

**Comments** ("Collaborative Liveboards") are **disabled by default** and need admin activation.
Entry is "the Comment icon… to the left of the More menu icon." Comments live in a right sidebar
you can reposition ("select the dot icon and drag across the screen"); ESC or the **x** exits.
**@** mentions email the taggee; "a red dot appears on the comment icon" for unread. The
more-options menu offers share-to-Slack, unsubscribe from the thread, and resolve.

The clever part: comments pin to the **data state at creation**. If the visualization later
changes, comments become "unattached" but stay in the sidebar, and clicking the associated data
point shows the original values. Anyone with Liveboard access can comment — "there's no
group-based separation" — and you can tag any cluster user. Not supported in embedded.

**Verified Liveboards.** Admins grant the **"Can verify"** privilege. Authors/editors request
verification from the more-options menu with an optional message; verifiers are notified and
click **Approve**. A verified Liveboard "carries a banner that signifies that they have been
audited for correctness"; the icon "appears on the home page and the Liveboards page" and lists
sort on the **Verified** column. After an edit, "a banner appears that informs users the content
has been edited and may need to be re-verified," persisting until re-verified. Any verifier can
pick **Remove verification**.

**Following = the KPI Watchlist.** **"Add KPIs to your watchlist"** on Home, or **more options →
"Add to watchlist"** on a KPI tile or saved Answer. Adding auto-schedules an alert "based on each
KPI's cadence." Tiles show a **sparkline** where "the two most recent data points are
highlighted," plus percent change labelled WoW / DoD / MoM. The Liveboards doc mentions
"Following Liveboards or KPIs for scheduled updates," but I found no Liveboard-level Follow
control distinct from schedules/watchlist — **[UNVERIFIED]**.

---

## 7. Search & find

Sources: `/cloud/latest/thoughtspot-one-homepage` · `/cloud/26.7.0.cl/search-answers`

**Home** (via **Home** or the logo) is a find-first surface: 1) **Search Answers / "Search your
library"** — "search across all existing Answers, Liveboards, and visualizations in Liveboards,"
with a data-source dropdown, type-ahead, and results showing object type, author and location;
2) **KPI Watchlist** row with drag-to-reorder and per-KPI **More options**; 3) **Recently
viewed** — "all Answers and Liveboards you have access to, in order of how recently you viewed
them," 20 per page; 4) **Trending** — "the top 5 trending Liveboards and Answers among all users
in your environment on the right panel."

Filter by object type, **tags**, **authors** and a **favourites** toggle; sort by author, view
count, last viewed. Bulk actions: favourite, share, tag, delete, export TML. Index lag is
"within 10 minutes (typically under 5 minutes)" and covers new objects, deletions *and
permission changes*. English GA, other languages Beta.

---

## Design lessons for Spiff

1. **Make "live, re-run per viewer" visible, not a footnote.** ThoughtSpot's whole pitch is
   "Liveboards always have the most current data." Spiff should state it on the share dialog:
   *"Runs fresh for each person, using their own permissions."*
2. **Separate object access from data access and show both inline.** Warning symbol → **"Give
   view access to underlying data sources"** → green checkmark is the best pattern here. Show,
   per recipient, whether they will actually see anything, with a request-access path.
3. **Copy link ≠ grant access — say it in the UI.** "Sending users this link does not share the
   object with them." Non-technical users assume a URL is a permission.
4. **Exploring must never mutate the shared thing.** "When you apply a filter, the Liveboard is
   not automatically saved with your filter applied." Let anyone poke at a shared answer safely,
   with a clear "this change is only yours" affordance.
5. **Steal "Save view" over "Duplicate."** Personalised views keep filter state *and* stay synced
   to the original — personalisation without forking. Spiff's contrasting rule (sharing an
   automation *clones* it) should then be presented as a deliberate, explained choice.
6. **The unsaved-change dot + "Update" is a cheap, legible state model.** No modal, no save-bar.
7. **Gating conditions are the killer scheduling feature** — "only email me if revenue drops
   below X." Offer it in plain language, not a boolean expression box; ThoughtSpot's
   single-boolean / single-source constraints are exactly what trips business users up.
8. **Cadence pickers should be small and opinionated,** and must preview the literal next send.
   "Anchored to start of day (00:00), not creation time" is a real gotcha.
9. **Show per-recipient security consequences at schedule time.** Internal users get RLS-filtered
   data; external emails get *the scheduler's* data. That split is a leak risk buried in prose —
   render it as a visible list, or refuse the external case.
10. **Attach the "why" to the artefact.** Note tiles, the schedule's **Add Comment** →
    "Description:" line, and per-alert **Custom message** all give recipients context without a
    separate message. Cheap to build, high trust payoff.
11. **A trust badge needs a staleness rule.** The bit worth stealing isn't the badge — it's the
    banner saying content "has been edited and may need to be re-verified."
12. **Ship the noise story ThoughtSpot lacks.** No per-alert snooze exists; only an admin
    "Shortest time period to check alerts" floor, plus silent dropping of transient breaches.
    Spiff should offer per-alert snooze/cooldown and state the sampling behaviour plainly.
13. **Group subscriptions must have an individual exit.** "Users must be removed from the group
    to be removed from the alert schedule" is a support-ticket generator. Always allow a personal
    unsubscribe and show *why* someone is subscribed ("via GST Managers group").
14. **One management screen, not two.** ThoughtSpot splits schedules (**Data > Utilities**) from
    alerts (**Insights → Monitor subscriptions**). Spiff needs a single "everything scheduled or
    watched — mine and shared with me" view with pause/resume, last-run status and next run.
15. **Home should be a find surface, not a dashboard.** Search + watchlist + recently viewed +
    trending + tag/author/favourite filters is a strong, unglamorous template; "top 5 trending"
    is the cheapest social-proof discovery mechanism on the page.
16. **Be honest about freshness latency.** "ThoughtSpot indexes changes within 10 minutes" —
    including permission changes — prevents "why can't Bob see it yet?" tickets.

---

## Screens/components worth stealing

- **Share dialog with per-recipient data-access status** — warning symbol → "Give view access to underlying data sources" → green checkmark.
- **Can View / Can Edit dropdown per recipient row**, with an **x** to remove.
- **Allowed-domains info icon** beside the recipient field, for external sharing.
- **Copy link button paired with a disclaimer** that the link grants no access.
- **Filter chip bar** under the title, with **Clear all** that preserves permanent filters.
- **Filter modal with an "applies to these visualizations/tabs" selector** — scope made explicit.
- **Right-click data point → Filter** cross-filter, with **Remove filter** on the same menu.
- **Mandatory-filter asterisk** with tiles that refuse to load until a value is chosen.
- **Save → Save view** flow with a **"Make view available to all users"** checkbox.
- **View-name dot for unsaved changes** + click-name → **Update**.
- **Select view → Manage views** table (public toggle per view, delete).
- **Create schedule dialog** — Name / Add Comment / Frequency / File type / Email body / Recipients / Views / Gating Condition in one scroll.
- **Gating condition field** — "only deliver when this is true."
- **Schedules table** with bulk Pause / Resume / Delete and expandable per-run history.
- **KPI tile Monitor icon on hover** as the one-click entry into alerting.
- **Alert type picker** with plain-language options ("KPI crosses a set limit").
- **Monitor subscriptions list with All / Yours tabs.**
- **Comment sidebar** — draggable, @mentions, red unread dot, resolve, share-to-Slack.
- **Unattached-comment pattern** — a comment survives a chart change and still links to its original data point.
- **Verified badge + "may need to be re-verified" banner**; sortable **Verified** column.
- **Home KPI Watchlist row** — sparkline with the two latest points highlighted, WoW/DoD/MoM deltas.
- **Recently viewed + Trending (top 5) panels.**
- **Library search type-ahead** showing object type, author and location per result.
- **Note tile** — rich text, images and iFrames placed anywhere in the grid.
- **Tile size preset menu** alongside freehand corner-drag resize.
