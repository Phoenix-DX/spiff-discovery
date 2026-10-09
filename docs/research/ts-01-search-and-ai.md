# ThoughtSpot — Search & Conversational-AI Experience

Research pass for the Spiff design team. Everything below is drawn from thoughtspot.com and
docs.thoughtspot.com (Cloud 26.8.0.cl unless noted), fetched 2026-08-31. Quoted strings are
verbatim from those pages. Where I could not verify a detail I say so explicitly rather than guess.

---

## 1. The product family and its naming

Source: <https://www.thoughtspot.com/>, <https://www.thoughtspot.com/product/agents>

ThoughtSpot brands itself the **"ThoughtSpot Agentic Analytics Platform"**, headline *"Data to
Decisions, Powered by Agents"*. The agent family is named as a set, which is itself a design lesson —
one recognisable stem, four jobs:

| Name | Positioning line |
|---|---|
| **Spotter** | "AI Analyst" — *"Governed Answers, Fast"* |
| **SpotterModel** | AI-assisted semantic modelling |
| **SpotterViz** | *"Data to Dashboards Instantly"* |
| **SpotterCode** | *"AI-Assisted Coding"* |
| **AgentSpot** | *"Multiplayer AI"* — teams "build, share, and collaborate with agents connected to company data" |

Marketing pillars: "Trusted Answers for Every Team", "Intelligence Inside Every Application",
"Governed Data-Driven Workflows", "Enterprise Grade From Day One". CTAs are "Request a demo",
"Get a personalized demo", "Try it free".

The Spotter page (<https://www.thoughtspot.com/product/agents/spotter>) is worth reading purely for
its trust framing: *"the most trusted enterprise analytics agent—delivering verifiable,
no-hallucination insights across all your data, everywhere you work."* Their differentiator claim is
explicitly **not** text-to-SQL: under **"Deterministic Insights, Full Verifiability"** they say Spotter
*"translates questions into search tokens grounded in your governed semantic layer—producing fully
traceable, auditable queries."* The token layer is the trust story. That is the single most
transferable idea on this page.

Also: **"Reasons Like Your Best Analyst"** — *"Breaks down questions, does multi-step reasoning, tests
assumptions, checks results, reruns analysis, and delivers recommended actions. Automatically."*

---

## 2. Spotter: the conversational surface

Source: <https://docs.thoughtspot.com/cloud/26.8.0.cl/spotter-getting-started>

**Three entry points**, which is a deliberate "meet the user where they are" pattern:
1. **Insights > Home** — a question box labelled **"Ask a question"** sits at the top of home.
2. **Insights > Spotter** — the dedicated conversation page.
3. **From a Liveboard visualisation** — a **Spotter** button appears on hover over an existing chart,
   so a conversation can start *from* a dashboard tile rather than a blank page.

**Submit affordance.** The user types and clicks the submit button or presses **Enter**. The submit
icon *becomes a stop button while the answer is generating*, letting the user halt and resubmit. This
is confirmed independently in the embed API as `enableStopAnswerGenerationEmbed` — *"Enables the stop
answer generation button in the Spotter embed UI."*

**The answer surface** (per turn):
- An **answer title** rendered as **search tokens** representing the interpreted query
- An interactive **chart or table**, with a **table/chart toggle**
- **Expand arrows** top-right for full-screen
- Action row beneath: **Edit**, **Download** (PNG / XLSX / CSV), **Save**, **Reset**

**Follow-ups.** *"Spotter treats successive questions in a conversation as a follow-up."* Critically,
**highlight changes appear in the search tokens** for each new question — the user sees precisely
*which token changed* between turn N and turn N+1. That is diff-based explainability, almost free.

**Explainability — "Show work".** The documented affordances:
- **"Show work"** displays how Spotter interpreted the question
- **Query tokens** show the simplified query; hovering a token reveals descriptions and calculations
- **"More details"** exposes column statistics and data types
- Hovering a formula reveals the calculation logic

**Feedback.** Two documented patterns: a default **check mark (approve) / X (reject)** pair, and —
when the admin setting **"Enable add to coaching from chat"** is on — a **thumbs up / thumbs down**
pair instead. Feedback is not cosmetic; see §6.

**Sample questions.** The initial screen of a conversation carries sample questions (confirmed by the
embed flag `hideSampleQuestions` — *"Hide sample questions on the initial screen of the
conversation"*). Documented self-orientation prompts users can ask include *"Give me a quick overview
of this dataset. What is this data about?"*, *"What columns can I use?"*, *"What are the key use cases
for this data?"*, *"Show me some sample questions."*

**Limitations text.** The embed config has `showSpotterLimitations` — *"show limitation text of the
spotter underneath the chat input"*. A persistent honesty line under the composer.

**Other confirmed chrome** (from `SpotterEmbedViewConfig`,
<https://developers.thoughtspot.com/docs/Interface_SpotterEmbedViewConfig>): a **past conversations
sidebar** (`enablePastConversationsSidebar`), a **Spotter sidebar** (`spotterSidebarConfig`), **tool
response cards** (`spotterChatConfig` — *"customizing Spotter chat UI branding in tool response
cards"*), and data-source controls `hideSourceSelection` / `disableSourceSelection` (the latter
*"Disables data source selection but still display the selected data source"* — read-only provenance).

---

## 3. Modes, versions and reasoning depth

Sources: <https://docs.thoughtspot.com/cloud/26.8.0.cl/spotter-versions>,
`/spotter-research-mode`, `/spotter-auto-mode`, `/spotter-advanced-analysis`

**Three generations coexist** — Spotter Classic (1), Spotter Agent (2), Spotter 3 — and the docs are
unusually frank about the trade-off: *"Later versions like Spotter 3 offer more in-depth insights into
your data...at the trade-off of sharing more of your data with the underlying LLM."* Classic *"does not
share actual data values with large language models"*; in Spotter 3 *"data is always shared with LLMs"*.
Spotter 3 exclusives: **Research mode**, **AI Insights (summaries)**, **Why questions**, **Cross data
model search**, **Spotter Connectors**, **Advanced analysis (code execution)**.

**Search mode vs Deep analysis / Research mode.** Their own analogy: Search mode is *"a high-speed
calculator"*; Deep analysis mode is *"the mathematician who shows the entire proof."*

| | Search mode | Deep analysis mode |
|---|---|---|
| Purpose | *"high-frequency, quick insights"* | *"high-stakes, multi-layered investigations"* |
| Reasoning budget | "Low" (speed) | *"High: Optimized to be comprehensive"* |
| Prompt depth | Single-dimensional ("What") | Multidimensional ("Why" and "what if") |
| Tool calls | SQL, Python, App Search (Instant) | SQL, Python, App Search (Iterative) |
| Output | *"Direct answer or visual"* | *"Comprehensive decision report"* + *"Automated narrative summary"* |

Deep mode builds *"a multi-step query plan"*, generates *"testable hypotheses"*, and *"autonomously
deep-dives, self-corrects its logic"* on anomalies.

**Auto mode** removes the up-front data-model picker. Activated by *"clicking on the Data model
dropdown in the search bar and clicking **Auto mode**."* Spotter then *"identifies which data sources
are needed to answer your query, searches across them, and combines the results into one synthesized
response."* Two named patterns: **Ad-hoc Pivot** (mid-conversation topic switch carrying context) and
**360-degree Query**. Crucially for governance UI: *"Every answer will explicitly state which data
models were used (for example, 'sourced from Sales Data and Support Data')"*, and model selection
shows a **confidence score** plus clarification flows. Documented caveats: Auto mode is *"currently
only supported if your question is in English"* and responses are currently text summaries rather than
integrated visualisations.

**Advanced analysis.** Spotter 3 executes Python and **shows it** — docs describe screenshots where
*"Spotter shows Python code for this query"* / *"Spotter publishes the Python it uses."* Named
techniques: forecasting via *"Seasonal ARIMA or Holt-Winters Exponential Smoothing"*, correlation via
*"Pearson correlations (p-value)"* and a *"correlation matrix"*, and query-on-query decomposition.

---

## 4. "Why" questions — the explainability set-piece

Source: <https://docs.thoughtspot.com/cloud/26.8.0.cl/spotter-why>

Ask *"Why did my sales drop last month?"* and the answer is a three-part structure, in this order:

1. **Analysis plan** — Spotter first shows how it read the question and *"which attributes it will
   analyze to find the answer"*, **before** running anything. Plan-then-execute, made visible.
2. **Change-analysis charts** that *"break down the contributions from different attributes"*.
3. **Narrative summary** — *"a concise, natural language summary of the key drivers so you can quickly
   understand the main takeaways."*

Honest constraints published alongside: works on *"simple, non-sliced charts"*; does not support
`growth of` and `versus` keywords, some complex formulas, or charts over ~1000 data points.

---

## 5. Classic tokenised search — the mechanics under the chat

Sources: `/search-data`, `/search-bar`, `/search-suggestion`, `/search-keyword`

This older surface is still the substrate Spotter compiles into, and its interaction design is the
richest material here.

- **Boxed search phrases.** Each phrase is chipped, and **colour-coded by role**: **measures = green,
  attributes = blue, filters = grey**. *"Your search phrases still appear as text when you are typing,
  but whenever you click out of the search bar, they are boxed."*
- **Search on enter.** Tokens can be added or removed *"without altering your existing search, until
  you press Enter... or select **Go** to the right of the search bar."* Compose freely, commit
  deliberately.
- **Token editing.** Selecting a chip highlights it and offers alternative suggestions; hovering shows
  an **x** to remove; you can click *between* chips to insert mid-query; chips can be merged.
- **Quick select.** *"the first suggestion is automatically highlighted, and you can use tab to
  navigate further."* Enter or Tab accepts.
- **Suggestion dropdown contents:** recent searches (yours *and* other users'), matching columns and
  phrases, **out-of-scope columns** (selecting one auto-adds it to scope), and existing **Liveboards**
  matching the query.
- **Ranking:** **Usage-Based Ranking (UBR)** — *"ThoughtSpot learns over time what columns are most
  important to you and to your company as a whole."*
- **Ambiguity:** auto-disambiguation offers a list of choices, and *"your choice is sticky. That means
  you won't have to select it again, in the scope of the current search."*
- **Spell check and synonyms** via WordNet; "Search help" tips fire when you Enter on an unrecognised term.
- **Phrasing guidance** is anti-conversational for this surface: prefer `"carroll alice"` over *"Find
  all books by Lewis Carroll..."*; *"Type slowly, and use the suggestions to find what you're
  looking for."*
- **Keyword families:** basic (`top`, `bottom`), date (`after`, `before`, `year-over-year`), time,
  text (`contains`), number (`sum`, `average`, `count`, `max`, `min`), comparative, and location
  (`near`, `farther than`, with radius in miles/km/metres). The docs point to a fuller "Keyword
  reference" I did not exhaustively enumerate — **flagged as incomplete**.

---

## 6. Coaching, guardrails and the feedback loop

Sources: `/spotter-reference-questions`, `/data-model-instructions`, `/spotter-security`,
`/spotter-conversations-liveboard`, `/spotter-limitations`

**Coaching from inside the chat.** Below an answer sits **"+ Add to Coaching"**. It opens a
**"Confirm reference question"** modal showing the most recent question (or a rephrased version that
retains conversation context), editable; then a **"Review business terms and mapped search tokens"**
modal where suggested term mappings can be accepted, rejected or ignored; then **"Done"**. Note the
published caveat: *"Reference questions do not preserve charting or visualization choices for future
queries."* ThoughtSpot now frames reference questions as *"legacy memory sources"* and steers new
setups to **"Add memory from conversations"**.

**Data model instructions** live on the Model's **Instructions** tab (or via the caret next to the
data source name in a conversation → **Data model instructions**), are *"global rules that guide how
Spotter interprets and answers questions on a data model"*, are **strictly enforced** and take
precedence over AI-generated memory. Buttons: **Save changes**, then **Regenerate last answer** to
verify. Real examples: *"When I ask for last month, use 'last 30 days' as a filter"*, *"Always exclude
rows where Account_Name = 'thoughtspot, inc.' from all analysis"*, *"For counting customers, always use
the unique count of 'Customer Cred ID'"*.

**Security posture.** Spotter sends *"the natural language query along with specific metadata to
LLMs... Model column names and descriptions, Sample data values..., Contextual metadata"* (plus
warehouse results in Spotter 3). Azure OpenAI: *"Customer data is not persisted or cached"* though
Spotter 3 results cache up to six hours by default, and up to 180 days if chat history is on. Vertex
AI: *"Customer data is not persisted or cached."* Governance default: *"All AI-powered features –
including Spotter, SpotIQ, AI Highlights, and AI Assist – are disabled by default."* Opt-in is
per-model and per-column.

**The admin feedback loop is a shipped product surface.** The **Spotter Conversations Liveboard**
tracks: "Active users (weekly)", "Conversations (weekly)", "Questions asked (weekly)", "Conversations
with feedback (weekly)", "Most active users", "Users providing feedback", "Feedback Response"
(upvote:downvote ratio), "Conversations by origin", "Conversations by Model", "Conversations by
Liveboard", "Avg Conversation Length", "Conversation length distribution", plus **"Downvoted
conversations"** and a **"Complete conversations log"**. The documented admin workflow: review
metrics → find problems via downvotes → adjust coaching and datasets → monitor improvement.

**Published limitations** (unusually candid, and worth imitating). Spotter *"understands standard
visualizations such as bar chart, line chart, or donut chart"* — advanced types need manual editing.
It does **not** support natural-language changes to *"chart configurations (changing colors or axes,
changing data label visibility, etc.)"*, cannot be coached on *"agent tonality, narrative style,
granular chart formatting"*, and *"does not support parameters"*. Spotter 2 *"doesn't have access to
your data; hence, in text responses, it only responds with the metadata."* Spotter Classic: why
questions *"not supported and should be avoided"*.

---

## 7. The Answer object and chart auto-selection

Sources: `/charts`, `/chart-types.html`, `/search-drill-down`, `/answer-experience-new`, `/chart-table`

**Auto-selection rules** (the clearest statement I found, from `/charts`):
- New query → ThoughtSpot *"analyzes the data and automatically selects the most appropriate chart"*.
- Follow-up query → *"should retain the existing chart type **unless** constraints force it to change"*.
- Drill-down → *"ensures a predictable user experience by maintaining the current chart type wherever
  possible"*.
- A chart requires *"at least one attribute and one measure"*; otherwise you get a table.
- *"Colors are maintained across searches within a session."*

**Stability over cleverness** is the principle: pick well once, then stop moving the furniture.

**Full chart list** (`/chart-types.html` splits "New charts" from "Classic charts"): Column, Stacked
column, Bar, Stacked bar, Line, Line column, Stacked line column, Line stacked column, Area, Stacked
area, KPI, Donut, Scatter, Bubble, Pareto, Waterfall, Treemap, Heatmap, Funnel, Sankey, Radar,
Candlestick, Pivot table, and Geo charts in **Geo bubble / Geo heatmap / Geo area** variants.
*Flag: the docs list these types but do **not** publish a per-type data-shape rule (how many
attributes/measures each needs) — I could not verify that mapping.*

**Answer anatomy.** Undo / redo / reset controls sit **to the right of the search bar** in a search or
saved Answer. Drill: right-click a chart object or data point → **"Drill down"** → a list of available
attributes and measures; you can drill by measure using the `BY` keyword; there is **no depth limit**;
an in-product back button steps back one level and its dropdown offers **Reset** (the browser back
button is explicitly documented as not working for unsaved Answers). A **Layout** menu (layout icon,
second from top, upper-right of the visualisation) handles chart configuration by dragging measures and
attributes as chips. Table results expose **"Edit table: Configure"**, **Visible Columns** / **Hidden
Columns**, a **Display** menu with text wrapping, table footer, **Content density** (Regular/Compact)
and **Table theme** (Outline / Row / Zebra), column summaries (total, average, standard deviation,
variance, min, max) and number formatting by category (number/percentage/currency) and units
(auto/none/thousand/million/billion/trillion). The **More** (…) menu carries **Make a copy**, **Show
Version History**, **Save**, create-a-view, download, and TML export. Conditional formatting appears as
**"Apply conditional formatting"** with **Edit** and **Flip Color** for gradients. *Flag: I could not
load a dedicated conditional-formatting page (404) so rule-builder microcopy is unverified.*
*Flag: I also could not verify how the "Change visualization" picker renders unsupported chart types —
whether greyed out, hidden, or tooltipped.*

**SpotIQ** (`/spotiq`, `/spotiq-change`) is the auto-insight engine: *"find interesting answers in your
data that you might not have found on your own."* Five insight categories: **Trends, Correlations,
Explanations of increases, Explanations of decreases, Outliers**. Invoked via **More menu → "SpotIQ
analyze"**; results live on a **SpotIQ** tab with **"Default preferences"** upper-right (null/zero
exclusion, date-boundary auto-tuning, p-values, correlation coefficients, correlation lag, relative
difference thresholds). *"SpotIQ also learns from your responses to your insights."*
**Change analysis**: ctrl/cmd-select two data points on a chart → right-click → **"Run change
analysis"**. Output opens on a **Change analysis summary tab** with **"View details"** and
**"Customize attributes"**; SpotIQ picks *"the top 5 most relevant columns, based on what it learned
from your past activity"*; **"Apply to all users"** persists a column choice; below the charts sit
**"additional insights"**; right-clicking an attribute value offers **"Analyze &lt;attribute_value&gt;"**
for iterative drilling, with undo/redo/reset upper-left.

**AI Highlights** (`/liveboard-ai-highlights`) — a button in the upper right of a Liveboard that
*"instantly extracts key metric changes from your Liveboard"*. Microcopy while waiting: *"Highlights
are typically generated in less than 30 seconds"*; CTA **"View AI Highlights"**. Output groups KPI
changes into **expected vs unexpected** based on an anomaly-detection confidence band; clicking a KPI
card expands to a natural-language summary plus change contributors; a feedback control at the bottom
asks whether *"the information was useful."* It analyses the first five time-series KPI charts per tab.

---

## 8. Design lessons for Spiff

1. **Make the interpretation the headline.** ThoughtSpot titles every answer with the *tokens it
   understood*, not the user's raw sentence. Spiff's answer header should be a re-statement of the
   parsed question — metric, grouping, filter, timeframe — so a wrong answer is visibly wrong before
   anyone reads the chart.
2. **Diff the tokens between turns.** Highlighting *what changed* in the interpretation on each
   follow-up is the cheapest, highest-value explainability move in this whole product. Steal it.
3. **Plan before execute, visibly.** The "Why" flow shows an **analysis plan** ("here are the
   attributes I'll test") *before* running. For a governed reporting agent this doubles as a consent
   moment and a place to catch a bad plan cheaply.
4. **Colour-code the grammar.** Green measures / blue attributes / grey filters teaches query
   structure without a tutorial. A user learns "this thing is a filter" by its colour.
5. **Compose freely, commit deliberately.** "Search on enter" — edits don't re-run until Enter/**Go**
   — respects both the user's train of thought and the cost of a query. Pair it with an explicit
   **Go**.
6. **Chips must be editable, removable, and insertable mid-string.** Click a chip → alternatives;
   hover → **x**; click between chips → insert. Tokens are only trustworthy if they're also the
   control surface.
7. **Sticky disambiguation.** When the user resolves an ambiguity, *"your choice is sticky"* for the
   rest of the session. Never ask the same clarifying question twice in one conversation.
8. **Give the composer a stop button.** The submit icon becoming a stop control during generation is a
   small thing that makes a slow agent feel governed rather than stuck.
9. **Two feedback modes, one of which teaches.** Plain approve/reject by default; thumbs + **"+ Add to
   Coaching"** when the user has rights to teach. Feedback that changes future behaviour needs a
   permission model — ThoughtSpot has **coaching permissions** as a distinct concept.
10. **Ship the feedback loop as a screen.** The Spotter Conversations Liveboard — downvoted
    conversations, feedback ratio, conversations by model — turns "we collect feedback" into an
    operable workflow. Spiff should have an equivalent owner-facing view from day one.
11. **State your sources in the answer.** Auto mode's *"sourced from Sales Data and Support Data"*
    plus a confidence score is exactly the provenance line a per-viewer, re-run-as-you answer needs.
12. **Publish your limitations, in product.** `showSpotterLimitations` puts limitation text *under the
    chat input*, and the docs list what the agent cannot do in blunt terms. Candour is a trust feature,
    and it pre-empts the "why didn't it do X" support ticket.
13. **Separate strict rules from learned memory.** Data model instructions are hand-written and
    *strictly enforced*; memory is AI-generated and *contextual*. Two different UI treatments, two
    different trust levels. Spiff's governance story maps onto this cleanly.
14. **Chart stability beats chart cleverness.** Auto-pick on a new question; *keep* the chart on
    follow-ups and drills unless the data shape forbids it; keep colours stable across a session.
15. **Offer a depth dial, not just a speed default.** "Search mode" vs "Deep analysis mode" with a
    stated reasoning budget sets expectations about latency and rigour before the user waits.
16. **Let the agent start from an existing artefact.** The **Spotter** button on hover over a
    Liveboard tile means the blank page is optional — conversations can begin from a chart someone
    already trusts.

---

## 9. Screens / components worth stealing

- **"Ask a question" home box** — a single persistent composer at the top of Home; the front door to everything.
- **Tokenised answer title** — the parsed query rendered as coloured, hoverable chips above the chart.
- **Token diff highlight** — per-turn emphasis on the chips that changed since the last question.
- **"Show work" panel** — how the question was interpreted, with hover-for-formula and **"More details"** column stats.
- **Analysis plan card** — pre-execution statement of which attributes the agent intends to test.
- **Narrative summary block** — plain-language key-drivers paragraph sitting above/below the chart.
- **Answer action row** — Edit · Download (PNG/XLSX/CSV) · Save · Reset, plus expand-to-fullscreen.
- **Table/chart toggle** — one control, same answer, two readings.
- **Stop-generation composer** — submit icon morphs into a stop button while streaming.
- **"+ Add to Coaching" → "Confirm reference question" → "Review business terms and mapped search tokens" → Done** — a three-step teach-the-agent flow launched from a single answer.
- **Data model dropdown with "Auto mode"** — source scoping living inside the search bar, with a source-attribution line in every answer.
- **Suggestion dropdown with recent searches + out-of-scope columns + matching Liveboards** — discovery, scope expansion and reuse in one list.
- **Sample-question empty state** — including meta-prompts like *"What columns can I use?"* and *"Show me some sample questions."*
- **Past conversations sidebar** — chat history as a first-class navigational rail.
- **Drill-down context menu** — right-click any point → attribute/measure list → filtered answer, with in-product back and Reset.
- **Layout chip panel** — drag measures/attributes as chips to reconfigure a chart.
- **SpotIQ change-analysis modal** — summary tab, "View details", "Customize attributes", "Apply to all users", iterative "Analyze &lt;value&gt;".
- **AI Highlights panel** — KPI cards split into *expected* vs *unexpected* change, each expanding to a narrative plus contributors, with a "was this useful" control.
- **Spotter Conversations Liveboard** — the agent's own analytics: adoption, feedback ratio, downvoted conversations, full conversation log.
- **Limitation strip under the chat input** — always-visible honesty about what the agent won't do.

---

## 10. Explicitly unverified

- Per-chart-type data-shape rules (which chart for how many attributes/measures) — listed as types only.
- The "Change visualization" picker's rendering of unsupported types (greyed / hidden / tooltip text).
- Conditional-formatting rule-builder microcopy — the dedicated docs page returned 404.
- The complete keyword reference (I captured families and representative keywords, not the full list).
- Exact placeholder text inside the Spotter composer, and exact empty-state copy beyond the sample-question pattern.
- Whether "Deep analysis mode" and "Research mode" are the same surface under two names — the docs page URL is `spotter-research-mode` but the body consistently says "Deep analysis mode".
