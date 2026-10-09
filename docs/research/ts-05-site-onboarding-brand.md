# ThoughtSpot — Marketing Site, Onboarding, Adoption & Design Language

**Observed** 30–31 Aug 2026 across thoughtspot.com, docs.thoughtspot.com and
developers.thoughtspot.com. All quotes are verbatim. In-product screens are reconstructed
from documentation, not from a live trial account; gaps are flagged `[UNVERIFIED]`.

---

## Full site map as observed

**Global header** — two persistent CTAs, right-aligned: **"Get demo"** and **"Free trial"**.
Language switcher: English / Deutsch / 日本語 / French.

| Nav item | Children |
|---|---|
| **Agents** | AgentSpot; Spotter: AI Analyst; SpotterModel; SpotterViz; SpotterCode |
| **Product** | BI Agents; Semantic Layer; AI-Augmented Dashboards; Automated Insights; Actionable Insights; Any Data Anywhere; Enterprise Analytics; Embedded Analytics; Analyst Studio |
| **Solutions** | *By role:* Business Leader, Data Leader, Data Analyst, Product Leader, Developer, Sales Operations · *By industry:* Financial Services, Retail & CPG, Healthcare & Life Sciences, Technology & Software, Supply Chain, Media & Telecom · *By size:* Startup, Enterprise |
| **Customers** | (single page, filterable) |
| **Pricing** | (single page) |
| **Resources** | Data Trends Blog; Analyst Reports; Case Studies; Ebooks; Glossary; Product Videos; Webinars; Documentation; Training |
| **Company** | Team; Careers; Trust Center; Partners; Contact Us; Support Center; Press Releases; Blog; In the News |

**URLs confirmed reachable:** `/` · `/agentspot` · `/product/agents` (+ `/spotter`,
`/spotterviz`) · `/product/analytics` (+ `/spotiq`) · `/product/visualize` ·
`/product/automated-analytics` · `/business-leader` · `/data-leader` · `/analyst` ·
`/product-leader` · `/solutions/teams` · `/customers` · `/pricing` · `/trial` · `/trust` ·
`/brand` · `/resources` · `/training` · `/spotter-embed` · `/dataspot` ·
`docs.thoughtspot.com/cloud/26.8.0.cl/index.html` · `developers.thoughtspot.com/getstarted` ·
`training.thoughtspot.com` · `community.thoughtspot.com`

**Notable:** persona pages sit at the **root** (`/business-leader`, `/analyst`, `/data-leader`)
rather than under `/solutions/`, which the nav implies. The footer adds a **Comparisons**
column — Sigma, Domo, Omni, Power BI, Tableau — a bottom-funnel bake-off shelf kept out of
the main nav.

**Docs IA** (`docs.thoughtspot.com`): product-line tabs across the top — *Cloud, Software,
Mobile, AgentSpot, Embedded*. Landing page leads with four agent cards, then eight icon
tiles: "What's new" · "Administration" · "Deploying ThoughtSpot" · "Getting started for end
users" · "Embedded" · "Homepage and navigation" · "Liveboards" · "Spotter semantics". Note
that the *end user* has a named front door of their own, peer to Administration.

**Pricing page (`/pricing`)** — published, self-serve, two product families. *ThoughtSpot
Analytics:* **Essentials** from $25/user/mo (5–50 users, 25M rows) — *"For small teams to find
and share insights with AI analytics"*; **Pro** from $50/user/mo (to 1,000 users, 250M rows,
*"Unlimited LLM tokens included"*, Spotter at 25 queries/user/mo), also offered usage-based
from $0.10/credit; **Enterprise** custom. *ThoughtSpot Embedded:* **Developer** free for one
year (10 users), **Enterprise** flexible. Every Analytics tier's CTA is **"Try for free"** —
the trial, not the demo, is the default next step at every price point.

---

## Positioning and language

The site is mid-pivot from "search analytics" to **"agentic analytics."** The homepage runs
two stacked heroes: a launch bar for **"Introducing AgentSpot" — "Multiplayer AI so anyone
can build, share, and collaborate with agents connected to company data, context and tools"**
— above the evergreen hero, **"Data to Decisions, Powered by Agents Analytics and BI"** /
*"Agentic Analytics Platform that empowers every decision with live, explainable AI insights
– right inside your tools and workflows."*

**The vocabulary, as a set of oppositions.** Almost every claim is built as *trusted thing vs.
stale thing*:

- *"Don't let your data die in dashboards"*, *"static, stale dashboards"* (`/business-leader`)
- *"Answers You Can Trust. Decisions You Can Move On."* (`/product/agents/spotter`)
- *"Accuracy Starts Before Analysis"* — *"Business logic, joins, calendars, calculations, and
  security are governed before teams ask the first question."* (homepage)
- *"Governed Answers, Fast"* — *"trusted answers grounded in verified business definitions."*
- *"Enterprise-grade guardrails with consumer-grade UX"* (`/data-leader`)

**"Self-service" is used as a reclaimed term, not a neutral one.** The recurring heading is
*"Self-service analytics the way it was meant to be"* — an admission that the category
promised this and failed. On `/product/analytics`: *"ThoughtSpot Analytics empowers
everyone—from the C-suite to frontline teams—to get immediate answers to their business
questions and make fact-driven decisions."*

**Jargon substitutions worth stealing.** They rarely say "dashboard" (→ **Liveboard**),
"query" (→ **ask** / **just ask**), "report" (→ **Answer**, capital A), "model retraining"
(→ **coaching**), "NL2SQL" (→ *"translates questions into search tokens grounded in your
governed semantic layer"*). The Spotter hero is **"An Analyst At Your Fingertips"** —
a *person* metaphor, not a tool metaphor, repeated as *"Give everyone an analyst at their
fingertips."* The most human line on the site is `/business-leader`'s *"It's time you and
your data had a chat."*

**Proof is numeric and placed early.** On `/product/agents/spotter`: *"99.6% Reduction in
time-to-insight"*, *"62% Customer adoption in production in <1 year"*, *"2x Leader in Gartner
Magic Quadrant for Data & Analytics."*

---

## Personas and how each is served

Six role pages, each with its own hero promise and its own villain:

| Persona | Headline | Sub | Villain named |
|---|---|---|---|
| Business Leader | *"The search is over"* | *"Find trusted insights when and where you work"* | *"waiting for reports or dashboards from your data team"*; *"traditional BI roadblocks"* |
| Data Analyst | *"Less Dashboard Busywork. More Business Impact."* | *"Ditch the backlog of one-off requests…"* | the ad-hoc request queue |
| Data Leader | *"Embrace the new AI"* | *"Turn data into your team's shared language"* | *"From chaos to confidence, at enterprise scale"* |
| Product Leader / Developer | (embedded analytics framing) | — | build-vs-buy cost |

The **analyst page is the tell**: rather than positioning self-service as *replacing*
analysts, it sells analysts their own liberation — *"There was a very heavy dependency on the
analyst, but they don't want to work on a lot of small, ad hoc questions. They're here to
solve bigger, more strategic questions."* And Spotter's second benefit pillar is explicitly
about the analyst's workload: *"By letting business teams answer more questions on their own,
Spotter reduces ad hoc requests to data teams, and frees them to focus on what matters
most—governance, models, and high-value analysis."* The gatekeeper is made a beneficiary.

Customer quotes dramatise the same shift: *"My team is out of the dashboarding business."*
(HP) · *"I just typed into the search bar and a visualization appeared. She said, 'Oh my
gosh—this is great!'"* (Wellthy) · *"90% of the company still depends on the 10% that is the
data team. That is not data democratization."* (Lyft).

---

## Onboarding a non-technical user: the pattern

Reconstructed from `/trial`, `docs.thoughtspot.com/cloud/latest/getting-started-free-trial`,
and `.../user-onboarding-experience`.

**0 — The offer.** `/trial`: a **14-day free trial**, *"No credit card required"*, framed in
consumer terms — *"Experience search & AI-driven analytics as easy as your favorite app."*
Logos (Capital One, Nasdaq, Unilever, LegalZoom) plus SOC / GDPR / HIPAA / ISO / STAR badges
sit on the *signup* page: risk-reduction at the moment of hesitation. CTA:
**"Start your 14-day free trial."**

**1 — Account activation.** Create a Community account → welcome email → activation link →
set password (8+ chars, upper, lower, number, special). Community membership is bundled into
signup, so the user joins the peer network before they see the product.

**2 — First sign-in: a four-step welcome flow**, not a feature tour.
- **"Step 1: Get Started"** — an overview of the onboarding process plus a short video.
  Buttons: **Continue**, or **"Exit to homepage"** top-right. Skippable from screen one.
- **"Step 2: Recommended data source"** — introduces *one* data source, pre-selected by the
  administrator. The new user is not asked to choose a source; the choice was made for them.
- **"Step 3: Select a Liveboard"** — pick one starter Liveboard to explore.
- **"Step 4: View your insights"** — look at that Liveboard, and a **Follow** button offers
  to *"receive periodic emails about this Liveboard."*

The flow's whole job is to end with the user *owning one board they care about* and
*subscribed to it*. It is re-runnable: Profile → **Experience** → **"Revisit onboarding
experience."**

**3 — Data without data.** The trial ships pre-loaded: *"Spotter comes pre-populated with
sample data, so you can immediately try digging into data analysis."* A named starter object
appears in the developer walkthrough — the **"Sales West - Overview"** Liveboard. Only after
the user has felt a result does the product invite **"Try Spotter on your own data"**, with
three graded on-ramps: **CSV upload**, **Google Sheets**, or a **cloud data warehouse**.

**4 — The nine-step trial checklist** in docs: search with Spotter on sample data → connect
your own data → model data for searches → create a Model → learn search essentials → invite
up to 5 teammates → share a Liveboard. Note where "invite teammates" and "share" fall: at the
*end*, as the pay-off, not as setup friction at the start.

**5 — Landing in the product.** Home modules, verbatim: a search bar with a **Sources**
dropdown and **Search data** button; a KPI band headed **"Track important KPIs"** whose empty
state reads **"Add KPIs to your watchlist"**, each card offering **"Create alert"**;
**"Recently viewed"**; and a right rail, **"Trending Liveboards and Answers"** — top 5 with
view counts. Nav: Home · Search · Answers · Liveboards · SpotIQ · Monitor · Data · Admin,
with **Admin** and **SpotIQ** shown only to users holding the privilege — the nav itself is
permission-shaped.

---

## Adoption mechanics

- **Social proof inside the product.** "Trending Liveboards and Answers" with view counts, and
  **"Popular"** KPIs, let a newcomer follow the herd rather than face a blank canvas.
- **Follow / Watchlist / Monitor** convert a one-off look into a recurring email. Adoption is
  designed as *subscription*, not as *return visits*.
- **Coaching, as a first-class loop.** An **Add Coaching** flow: submit a question, correct
  the answer, click **Done** to save it as a *reference question*; Spotter then proposes
  **business terms** a human accepts, edits or rejects — e.g. *"we can change the business
  term to 'revenue' instead of 'the revenue' and modify the mapped search tokens."* Docs
  advise validating with **early adopters** before wide rollout. Feedback becomes a
  governance artefact, not a thumbs-up into a void.
- **Explainability on demand:** users can *"ask questions about how calculated fields such as
  formulas are generated"*, and Spotter *"suggest[s] questions you can ask to improve your
  understanding of the data analysis."*
- **ThoughtSpot University** — instructor-led, eLearning with **role-based learning paths**
  (Business Leaders, Data Leaders, Data Analysts, Product Leaders, Developers, Sales Ops),
  **badges** on path completion, and tiered **certification**. Practice happens *"in a live
  ThoughtSpot environment."*
- **Resources hub** filterable on four axes at once — role, format ("ebook", "Webinar",
  "Case study", "Hands-on lab"…), topic ("Data Literacy", "Self Service Analytics"…), industry.
- **Community account bundled at signup**, plus a public **Glossary** doing category education
  for non-technical readers. `[UNVERIFIED: glossary URL 404'd on /resources/glossary; it is
  linked from the footer as "Glossary".]`

---

## Visual and verbal design language

From the published brand page, `thoughtspot.com/brand`:

**Palette — exact values.**
- *Primary:* Dark Spot `#08062B` · Dark Tint `#122246` · Navy Spot `#1B3E61` ·
  Navy Tint `#045D7F` · Blue Spot `#346DC9` · Blue Tint `#275595` · **Cyan Spot `#04D1FF`** ·
  Cyan Tint `#9FE9FF` · White Spot `#FFFFFF` · White Tint `#EEF7FF`
- *Secondary:* Purple Spot `#3D2894` · Blurple Spot `#714BFB`
- *Tertiary (accent/data):* `#8AAFFF` · `#32D9DF` · `#C493FF` · `#FF92A8` · `#FFC052` · `#6DD267`

The system is a **near-black navy ground** (`#08062B`) with **one electric cyan** (`#04D1FF`)
doing all the pointing. Everything between is a ladder of blues. The six tertiaries are a
ready-made categorical chart palette, tuned for the dark ground. Note the naming convention:
every colour is a *"Spot"* with a matching *"Tint"* — the brand word is welded into the
palette.

**Typography.** **Geist Mono** is the named brand typeface — *"legible, modern, and
confident"* — in **Medium** and **Regular** only, used for hierarchy through weight rather
than through many sizes. A monospace as a display face is a deliberate signal: technical
credibility, machine-adjacent, contemporary. `[UNVERIFIED: the brand page names no separate
body/UI typeface; the running body face on the marketing site is not documented publicly.]`

**Brand page sections:** Logo · Partner Branding · Typography · Color Palette · **Winning With
Insights** · Our brand in action · **Distinctive by Design**. Voice guidance is a single
sentence: ensure each brand interaction is *"consistent, positive, sophisticated, and easy to
understand."* Partner lock-ups must be *"equally weighted and monochromatic."*

**Composition.** Abstract geometric marks and shapes rather than illustration or stock
photography; product screenshots used as evidence beneath claims; heavy use of two- and
three-up card grids ("Faster Decisions / Scale Data Impact / Ship Faster"); a repeating
section rhythm of *short imperative heading → one-sentence proof → screenshot or logo band*.
Headings are title-cased and short — 3 to 6 words, verb-forward. CTA labels are frequently
**ALL CAPS** ("REQUEST A DEMO", "TRY SPOTTER NOW", "SEE IT IN ACTION", "SAY HELLO").
`[UNVERIFIED: gradient and motion specifics — the brand page documents neither, and CSS was
not retrievable.]`

---

## Trust signals for a sceptical buyer

- **Trust Center** (`/trust`) opens on a values sentence, not a certificate wall: *"Nothing is
  more important than the trust of customers, our team, our ecosystem, our shareholders and
  our community."* Three sections: **Enterprise-Grade AI** · **Security** · **Privacy &
  Compliance**, each with "Learn more". Certifications: SOC 1/2/3, ISO 27001, CSA STAR,
  HIPAA, GDPR, EU-US DPF, Swiss-US DPF, UK Extension, CCPA. A gated **Security Portal** exists
  for enterprise buyers.
- **The accuracy argument is architectural, not statistical.** They pre-empt the hallucination
  objection with a named section — *"How does Spotter guarantee no hallucinations?"* — and
  answer with mechanism: *"Instead of direct text-to-SQL, Spotter translates questions into
  search tokens grounded in your governed semantic layer—producing fully traceable, auditable
  queries"*, plus *"Foundational models and text-to-SQL solutions just don't cut it."*
- **AgentSpot's governance copy** is the closest analogue to Spiff's invariants: *"Every
  request, tool call and model interaction gets logged — full auditability, no black boxes"*
  · *"Fine-grained control over what every person can see and do"* · *"Each user's sessions,
  files, memory, and work is completely secure and private"* · and the sharing model,
  *"Anyone can build and share agents across the org. One person's solution becomes everyone's
  superpower."*
- **Analyst validation** as a repeated band: 2026 Gartner Leader, Nucleus Leader, G2 Leader —
  and compliance badges appear on the *signup* page, not only on the trust page.

---

## Design lessons for Spiff

1. **Two heroes, one page.** A launch ribbon for what's new above a stable evergreen promise
   — so Spiff's core pitch never has to be rewritten to announce something.
2. **Name the villain in the sub-head.** Every persona page names a specific indignity
   ("waiting for reports from your data team"). Spiff's — waiting on the GST reporting queue
   — belongs in the first two lines, in the user's own words.
3. **Sell the gatekeeper their own liberation.** The analyst page is the smartest move on the
   site. Spiff's reporting team must read the pitch and see *less queue*, not *less job*.
4. **Give the AI a human role, not a product name.** *"An Analyst At Your Fingertips"* sets
   honest expectations about fallibility and about asking follow-ups.
5. **Replace jargon with owned nouns.** Liveboard, Answer, Model, coaching. Fix Spiff's 4–5
   nouns early and use them everywhere — nav, empty states, docs, deck.
6. **Put the accuracy *mechanism* in the copy.** "Grounded in your governed semantic layer →
   traceable, auditable queries" beats any accuracy percentage. Show the trace; don't assert
   the trust.
7. **Pre-empt the objection with a heading.** Title a section with the sceptic's question:
   *"How do I know this number is right?"* · *"Who can see this?"*
8. **Onboard to one board, not to a tour.** Four steps ending in *one Liveboard the user
   follows*. Spiff's first run should end with one report the user owns and subscribes to.
9. **Ship data before asking for data.** Sample data pre-loaded; "connect your own" arrives at
   step 4, after the first win. The mockup needs a plausible sample dataset from screen one.
10. **Make onboarding re-runnable and exit-able from screen one.** "Exit to homepage" plus
    Profile → "Revisit onboarding experience." Skippability is what makes a tour tolerable.
11. **Beat the blank canvas with other people's work.** "Trending Liveboards and Answers" with
    view counts. Spiff's home can show what colleagues run — while still re-running each
    answer per viewer, scoped to that person.
12. **Design adoption as subscription.** Follow / Watchlist / alerts turn one visit into a
    habit — and this is where Spiff's per-owner execution invariant earns its keep: the
    follow re-runs *as the follower*.
13. **Make correction a governed artefact.** "Add Coaching" → reference question → human-
    reviewed business term. Spiff's feedback loop should yield reviewable definitions, not
    opaque fine-tuning.
14. **Permission-shape the navigation.** SpotIQ and Admin appear only with the privilege.
    Hide, don't grey out — the UI *is* the permission model made visible.
15. **A one-accent palette on a deep ground.** Near-black navy plus a single electric accent,
    with a six-colour tertiary set reserved for data. Spiff's UBT navy/blue can be structured
    identically: one ground, one pointer, one chart ramp — and, like ThoughtSpot, put the
    compliance badges at the moment of hesitation (signup, share) rather than on a trust page.
