# ThoughtSpot — Data Connections, the Semantic Layer, and Dataset Formatting

Research pass for the Spiff design team. All UI labels are quoted verbatim from ThoughtSpot
Cloud public docs unless flagged otherwise.

---

## 1. Connections

**Sources:** `docs.thoughtspot.com/cloud/latest/connections` · `/connect-data` · `/connections-snowflake-add`

**31+ connection types.** Warehouses: Snowflake, BigQuery, Databricks, Redshift, Athena,
Azure Synapse. Relational: PostgreSQL, MySQL, Oracle, SQL Server, Aurora & RDS, Google Cloud
SQL. Federation/specialised: ClickHouse, Denodo, Dremio, Presto, Trino, Starburst, SAP HANA,
Teradata, SingleStore, Iomete, AlloyDB, **Looker**, **Generic JDBC**.

**Connect flow** (Snowflake, verbatim): `Data workspace` → `Connections` →
**`+ Create connection`** → pick tile → **`Next`** → **`Connection name`** + description →
**`Next`** → authentication (`Use OAuth`, `OAuth with PKCE`, `Use External OAuth`,
`OAuth Client Credentials`, `Key Pair`, `Service Account`, `Personal Access Token`) →
credentials (**`Account name or Snowflake URL`**, `User`, `Private Key`, `Passphrase`,
**`Role`**, **`Warehouse`**, **`Database`**; an **`Advanced Config`** menu adds free-form
**`Key`**/**`Value`** pairs) → **`Continue`** → **select tables and columns** →
**`Create connection`** (or **`Save and exit`** to defer table selection). Primary/foreign
keys and existing joins are imported automatically.

**Live query vs imported.** Connections (historically *Embrace*) run **"live queries on
external databases"** — no ETL. The one materialised copy: ThoughtSpot **"fetches unique
values for all attribute data"**, by default **every 24 hours**, to power search typeahead.
So value suggestions can be stale even when results are live.

**Connection health.** Docs describe constraints, not a dashboard: *"Connections does not
support joins across connections"*; no column deletion after creation; slow rendering above a
few thousand tables. **Flag: no per-connection green/red status indicator found in docs** —
only a **`Usage`** *"System Liveboard displaying connection statistics."*

---

## 2. Models (the semantic layer)

**Sources:** `/semantic-layer` · `/models-simplify.html` · `/models.html` · `/tables-join.html` · `/join-add` · `thoughtspot.com/product/spotter-semantics`

A **Model** is *"a logical view created on top of a more complex data model, to enable
business users to more easily consume data."* Models superseded **Worksheets**; docs call
them *"the primary data object for search and analytics in ThoughtSpot."*

The editor is **tabbed** — a good IA in itself: **Tables** (drag in, join) · **Columns**
(pick + configure) · **Formulas** · **Filters** (persistent, model-scoped) · **Parameters**
· **Instructions** (natural-language AI rules) · **Settings**.

Three source paths: **`Build your own with cloud data`**, **`dbt`**, **`TML`**. **Settings**
carries *"Data model join rule"* — **`Apply joins progressively (recommended for most cases)`**
vs **`Apply all joins`** — plus an option to *"disable row level security for your data model."*

**Joins.** `Columns` tab → **`Joins`** tab → **`+ Add join`** → the **`Create Join`** dialog:
**`Join name`**, **`Table 1`**, **`Table 2`**, matched column pairs (**`+Add column`** for
composite keys), join type (`INNER`, `FULL OUTER`, `LEFT OUTER`, `RIGHT OUTER`), cardinality
(`Many:1`, `1:Many`, `1:1`). Non-equi joins (`<`, `>`, `<=`, `>=`, `!=`) are **Beta** with
`All`/`Any` matching; range joins are **TML-only**. Quoted best practice: *"creating a
many-to-one join from a fact table to a dimension table simplifies your search."*

---

## 3. Column-level configuration

**Sources:** `/data-modeling-settings` · `/tml-properties` · `/data-modeling-index` · `/data-modeling-patterns` · `/data-modeling-geo-data` · `/data-modeling-aggreg-additive` · `/data-modeling-attributable-dimension` · `/spotter-ai-context`

Columns are edited in a **spreadsheet-like grid** with **ALL-CAPS property headers**
(`COLUMN NAME`, `GEO CONFIG`, `INDEX PRIORITY`, `CALENDAR TYPE`…). **Double-click a cell** to
edit, then **`Save Changes`**; bulk edit via the **`Edit`** menu. Full list in the inventory
below; the notable ones:

- **`Column Type`** — `ATTRIBUTE` (*"a characteristic or trait… such as `name`, `address`, or
  `id number`"*) or `MEASURE` (*"a numeric value that can be compared… like `sales`"*).
  Attributes drive the x-axis, measures the y-axis.
- **`Additive`** (`YES`/`NO`) gates aggregations on numeric attributes. `NO` → only
  **`UNIQUE COUNT OF`**, **`TOTAL COUNT OF`**. `YES` → also **`TOTAL OF, AVG OF, STD
  DEVIATION OF, VARIANCE OF, MIN OF, MAX OF`**. Note the user-facing names are *English
  phrases*, not SQL functions.
- **`Synonyms`** — *"synonyms that can be used in the search bar to refer to a column."*
  A plain list; the cheapest discovery feature in the product.
- **`Index Priority`** — integer **1–10**, default **1**. Docs recommend **8–10** for
  important columns, **1–3** for low priority. *"Influence[s] the ranking of the column's
  name"* and feeds **usage based ranking (UBR)**.
- **`Index Type`** — columns above **100,000 unique values** won't index under `DEFAULT`;
  only `PREFIX_ONLY` is recommended at high cardinality.
- **`Format Pattern`** — Java notation: `#,###`, `#,##0.##` (12345.6789 → `12,345.68`), `#%`,
  `#.00%`, `MM/dd/yyyy`, `MM/dd/yyyy HH:mm`, `MMM`.
- **`Currency Type`** — the **`Specify Currency Type`** dialog gives exactly three options:
  **`Infer From Browser`**, **`From a column`** (VARCHAR of ISO codes), **`Specify ISO Code`**.
- **`Geo Config`** — the **`Specify Geographic Configuration`** dialog: Latitude, Longitude,
  Zip Code, US States, US Counties, Countries, international sub-nation regions, **`Custom
  map`**. Since 9.4.0.cl an **`Auto select`** classifier detects geo columns.
- **`Attribution Dimension`** (`YES`/`NO`) only matters over a **chasm trap** — *"two or more
  fact tables have no direct relationship to each other except through shared dimensions."*
  Docs admit their own bug: *"this setting is at the table level rather than the column level.
  Note that the current UI implies this is a column-level setting."*
- **`AI Context`** — a field *"next to the Column Description field"*, **max 400 characters**
  (auto-gen targets 150–250), created via **`AI Context > Generate AI Context`**. Disambiguates
  similar columns, encodes rules ("exclude nulls"), explains non-standard formats.

**Formulas** (`/model-formula.html`): `Formulas` tab → **`Add formula`**. The editor
**colour-codes tokens** — *blue* for "formula operators and functions", *purple* for "the names
of columns", *black* for constants. An **`Advanced settings`** gear overrides the output's
**`Data type`**, measure-or-attribute, and **`Default Aggregation`**. A separate "Formula
function reference" page holds the function library (not enumerated in this pass).

**Custom calendars** (`/connections-cust-cal-create`): `Data workspace` → `Utilities` →
**`Custom calendar`**. Fields: Calendar Name, Connection, Database, Schema; method (**Create**,
**`Upload File`**, **`Existing Table`**); Table, **Start Date**/**End Date** (`MM/DD/YYYY`),
**Calendar Type** (`MONTH_OFFSET`, `FOUR_FOUR_FIVE`, `FOUR_FIVE_FOUR`, `FIVE_FOUR_FOUR`),
**Monthly offset**, **Start day of week**, **Quarter name prefix** (`Q`), **Year name prefix**
(`FY`). Applied per column via the **`CALENDAR TYPE`** cell on a DATE/DATE_TIME column.

---

## 4. Row-level security

**Source:** `/security-rls-implement`

RLS is defined on the **table**, not the model: `Data workspace` → double-click a table →
**`Row security`** tab → **`+ Add row security`** → the **Rule Builder**. Each rule has a
**Rule Name** and an expression — *"an expression that gets evaluated for every row and group
combination"* — using **`ts_groups`** and **`ts_username`**. Operators `in`, `=`, `!=`; a
**green indicator** signals validity; aggregate functions unsupported. Rules **propagate
automatically** to derived Models and Answers; a `FALSE` result shows **`No data to display.`**
Relevant to Spiff's "runs as its owner" invariant: *define once at the table, inherit
downstream*, with one explicit model-level escape hatch that is off by default.

---

## 5. Data quality & trust

**Sources:** `/liveboard-verify` · `thoughtspot.com/blog/verified-liveboards` · `/search-data-refresh-time` · `/data-source-delete` · `/system-model` · `/spotter-model` · `/data-model-instructions` · `/spotter-business-terms` · `/spotter-reference-questions`

**Verified Liveboards** — the clearest certification pattern here. Admins grant a **`Can
verify`** privilege; holders are **verifiers** (the blog calls them *Data Stewards*). Flow:
author's ellipses menu → **`Request verification`** (optional note; pick which stewards to
notify — they get an email with a direct link), or a steward self-marks via **`Mark as
verified`**; the verifier clicks **`Approve`** or **`Decline`**. Result: *"a blue verified
label will be added to the top left of the Liveboard"*, and the icon *"appears on the home
page and the Liveboards page."* **`Show Liveboard details`** reveals verifier name and date.
Critically, **editing breaks the seal**: *"a yellow warning banner… indicating it has been
edited after verification."* Managed at **`Data` → `Liveboard verification`** (verified /
pending / rejected). **Flag: no equivalent "verified Model" badge found in public docs.**

**Freshness.** *"Last data refresh time"* is a **hover tooltip**, not persistent chrome — on
a data source name, a column header, or a column in an Answer. It also shows *"when it was
created and by whom"* and, at column level, **sample values from that column**.

**Dependents / impact.** Every data source has a **`Dependents`** tab listing *"the names of
the dependent objects (Models and Liveboards), and the columns they use."* Deleting a source
with dependents raises *"Cannot delete because of dependent objects"* with each dependent as
a clickable link.

**Usage & popularity** is system data, not inline badges: **`Product Usage`** (*"what existing
Models, tables, and views users search on"*), **`TS: BI Server`**, **`TS: AI and BI Stats`**,
**`TS: Login Activity Tracking`**, **`TS: Provisioned Users`**, **`TS: Object tracking (Beta)`**.
Ranking uses **UBR**.

**Model readiness.** A **"Spotter optimization"** tab surfaces recommendations, not a score:
**`Enable indexing`** (with **`View suggestions`**), **`Fix date value issues`**, **`Fix column
type mismatches`**. **Flag: no numeric health/quality score documented.**

**Governed definitions**, three overlapping mechanisms:
- **`Data model instructions`** — up to **10,000 characters** of global rules per model, from
  the caret beside the data source name in the search bar or the model's **`Instructions`**
  tab. Doc example: *"When calculating revenue, always exclude transactions where
  Account_Type = 'Internal Test'."* Caveat: they do *"not automatically override a user's
  direct query if they conflict."*
- **`Business terms`** — *"a global, reusable definition that maps a word or phrase to: A
  specific column or value. A filter. A calculation or formula."* At `Data workspace` →
  `Spotter memory` → `Memory sources` → **`Business terms`** → **`Add business term`**. Saved
  *at user level* unless you have model-editor rights, when it goes global. Now **legacy**,
  as are **reference questions** (saved Q&A pairs via **`+ Add to Coaching`** under an Answer).

---

## 6. Catalogue & discovery

**Source:** `/data-workspace` · `/spotter-getting-started` · `/spotter-capabilities`

**Data workspace** left nav: **Data objects** (Tables / Models / Views), **Connections**,
**Analyst Studio**, **Usage**, **Utilities** (Import/Export TML, Business data model editor,
Schema viewer, Liveboard schedules, Custom calendar, dbt Integration).

The object list is a table: **Name · Author · Type · Last modified · Tags**. Filters:
**`Source type`** (`all`, `Models only`, `tables only`, `views and SQL views only`), **Tag**,
**Author**, plus name search. Sort by Author / Name / Last modified. Checkbox multi-select
enables **share, delete, apply/remove tags, export as TML, edit as TML**.

Definitions users see: **Tables** = *"Raw tables imported or linked from a connected data
source"*; **Models** = *"The primary data object for search and analytics"*; **Views** =
*"Saved SQL-based definitions that produce a virtual table."*

**"What can I ask?"** is answered conversationally, not as a catalogue page — users ask *"Give
me a quick overview of this dataset. What is this data about?"*. Transparency: **`Show work`**
(*"How Spotter interprets your question"*) and **`Query tokens`** that *"represent the
simplified query, and show how the data in the answer was computed"* (hover a measure for a
natural-language description; hover a filter for an explanation plus the value filtered).
Classic search adds **`Query details`**, **`Query visualizer`**, **`Query SQL`**. Feedback is
**`Is this useful?`** (check / X). On cross-model search Spotter shows *"a percentage score of
its confidence in each choice and the reason it chose them."*

---

## A dataset's full property inventory

**Connection level** — Connection name · Description · Connection type · Authentication type
(OAuth / OAuth PKCE / External OAuth / OAuth Client Credentials / Key Pair / Service Account /
Personal Access Token) · Account or URL · User · Role · Warehouse · Database · Schema ·
Private Key / Passphrase · Advanced Config key–value pairs · Selected tables & columns ·
Imported primary/foreign keys · Attribute-value refresh cadence (default 24h)

**Table level** — `name` · `description` · `db` · `schema` · `db_table` · `connection` (GUID) ·
`guid` · joins (name, Table 1, Table 2, column pairs, type, cardinality) · `rls_rules` (rule
name + expression using `ts_groups` / `ts_username`) · Attribution Dimension (`YES`/`NO`,
table-scoped despite column-level UI) · Tags · Author · Last modified

**Model level** — `name` · `description` · Tags · Author · Created by/on · Last modified ·
`tables` · `joins` · `join_path` · `join_progressive` (`Apply joins progressively` vs `Apply
all joins`) · `is_bypass_rls` (default `false`) · `parameters` · persistent Filters ·
`column_groups` (organises the search panel) · Data model instructions (≤10,000 chars) ·
AI Context · `lesson_plans` · attached reference questions / business terms · Spotter
optimization findings

**Column level**
- `name` (Column Name) · `description` · **`AI Context`** (≤400 chars)
- `column_id` · `db_column_name` · `db_column_properties`
- `data_type` — **read only**: `INT32`, `INT64`, `BOOL`, `VARCHAR`, `DOUBLE`, `FLOAT`, `DATE`, `DATETIME`, `TIME`
- `column_type`: `ATTRIBUTE` | `MEASURE`
- `aggregation`: `NONE` (attribute default), `SUM` (measure default), `AVERAGE`, `MIN`, `MAX`, `STD_DEVIATION`, `VARIANCE`, `COUNT`, `COUNT_DISTINCT`
- `is_additive`: `YES`/`NO`
- `synonyms`: list of alternate search words
- `is_hidden`: `true`/`false`
- `index_type`: `DEFAULT`, `DONT_INDEX`, `PREFIX_ONLY`, `PREFIX_AND_SUBSTRING`, `PREFIX_AND_WORD_SUBSTRING`
- `index_priority`: 1–10 (default 1)
- Suggestion settings (data-value suggestions on/off)
- `format_pattern` (numbers and dates)
- `currency_type`: `Infer From Browser` | `From a column` | `Specify ISO Code`
- `geo_config` + `geometryType` (`POINT`, `LINE_STRING`, `POLYGON`, `MULTI_POINT`, `MULTI_POLYGON`) + `custom_file_guid`
- `calendar`: default (Gregorian) / fiscal / named custom calendar
- `spotiq_preference`: `EXCLUDE`
- `is_attribution_dimension` · `is_one_to_one`
- Formula columns additionally carry `properties` → `column_type` + `aggregation`
- Derived-but-surfaced: sample values (in tooltip) · last refreshed · created by

---

## Design lessons for Spiff

1. **Make provenance persistent, not a hover.** ThoughtSpot's freshness tooltip carries the
   right payload — last refreshed, created by whom, *sample values* — but is invisible until
   you hover. Put those three in permanent chrome on the dataset card.
2. **Sample values are the fastest trust signal a non-technical person has.** `GST-2024-0871`
   beats any type annotation. Show them wherever a column name appears.
3. **Steal the whole verification lifecycle, not just the badge.** Request → notify a named
   steward → Approve/Decline → badge with verifier name and date → **yellow "edited since
   verification" banner**. That last step is what makes the badge honest.
4. **Certify the thing people share, not the plumbing.** ThoughtSpot verifies Liveboards, not
   Models. Spiff's certifiable unit should be the answer or automation someone forwards.
5. **Synonyms are the highest-leverage, lowest-cost field.** One box where an owner writes
   "turnover, revenue, sales" beats any join config for a non-technical searcher.
6. **Two axes only: attribute vs measure** — "thing you group by" and "number you do maths on."
   Use the English aggregation names (**`TOTAL OF`, `AVG OF`, `UNIQUE COUNT OF`**), not SQL.
7. **Give every dataset a Dependents view.** "3 automations and 2 shared answers use this,"
   with links, turns a scary edit into an informed one.
8. **Search ranking is a designable property.** `Index Priority` 1–10 lets an owner say "when
   someone types 'client', mean *this* column." Expose it as "Promote in search."
9. **Write governed rules in English and store them.** `Data model instructions` (10k chars)
   and `AI Context` (400 chars/column) are just prose — and the most modern part of the
   product. A single agreed metric definition needs no DSL.
10. **Two-tier definitions: personal, then promoted.** A business term saves *at user level*
    unless you have editor rights, when it goes global. That gradient fits Spiff's ownership model.
11. **Show the work in tokens.** `Show work` plus hoverable `Query tokens` describing a measure
    or filter in natural language is the best "how did you get this number" pattern here.
12. **Confidence needs a reason, not just a number.** Spotter shows a percentage *and* why it
    picked that model.
13. **Recommendations beat scores.** ThoughtSpot ships "fix these three things" instead of a
    health grade. Actionable > gradeable.
14. **Never render a property at a scope it doesn't belong to.** ThoughtSpot documents its own
    bug: Attribution Dimension is table-level but shown in a column grid.
15. **Keep the catalogue list boring and filterable.** Name · Author · Type · Last modified ·
    Tags, filtered by source type, tag and author. Add "Verified" and "Last refreshed" as
    sortable columns and you are ahead.

---

## Screens/components worth stealing

- **Column grid as spreadsheet** — one row per column, ALL-CAPS property headers, double-click
  a cell to edit, `Save Changes` at top, multi-select for bulk edit. Scales to 200 columns
  with no modals.
- **Tabbed model editor** — Tables / Columns / Formulas / Filters / Parameters / Instructions /
  Settings: a clean IA for "everything about this dataset."
- **`Create Join` dialog** plus a schema canvas where joins are drawn by dragging a `+`.
- **Verified badge + edited-since-verification banner + `Show Liveboard details`** panel.
- **`Dependents` tab** listing dependent objects *and the columns they use*.
- **Freshness tooltip** on a source name or column header: last refresh, creator, sample values.
- **`Specify Currency Type`** / **`Specify Geographic Configuration`** — tiny single-purpose
  modals launched from one grid cell.
- **Formula editor with token colour-coding** plus an `Advanced settings` gear for output
  type and aggregation.
- **Spotter optimization tab** — a punch-list of fixable data issues with `View suggestions`.
- **`Show work` / `Query tokens`** transparency panel with `Is this useful?` check/X feedback.
- **RLS Rule Builder** — name + expression, live green validity indicator, `ts_groups` /
  `ts_username` variables.

---

## Flagged as unverified

- No per-connection **health/status indicator** found in public docs (only a `Usage` system
  Liveboard and documented limitations).
- No **"verified/certified Model"** badge found — verification is documented for Liveboards only.
- No **numeric model health or quality score**; Spotter readiness is a recommendation list.
- **Data workspace tab labels** vary between doc versions (10.x vs 26.x) — treat as
  approximately current, not pixel-exact.
- The **formula function reference** was not enumerated in this pass.
- `lesson_plans` and `column_groups` appear in TML properties but I found no UI documentation
  for them; treat as code-only until confirmed.
