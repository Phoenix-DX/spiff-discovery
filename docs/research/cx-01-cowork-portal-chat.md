# CX-01 — What a modern "AI portal chat" workspace looks like

Research for the Spiff mockup. Focus: Claude Cowork + the wider vocabulary of agentic chat
workspaces. Everything below is sourced; where a claim could not be verified from a primary
source it is flagged **[unverified]**.

Research date: 2026-08-31.

---

## 1. Claude Cowork — what it is

Cowork is Anthropic's **agentic mode** for non-developers — a system that "execute[s] multi-step
knowledge work on a user's behalf," aimed at "researchers, analysts, operations teams, legal
professionals, finance teams." The framing is explicitly *not* conversational: "It moves between
them, synthesizes information across multiple sources, and completes tasks without the user
coordinating each step."
([anthropic.com/product/claude-cowork](https://www.anthropic.com/product/claude-cowork))

- **Chat and Cowork are one interface, not two apps.** As of July 2026 the mode selector lives in
  the message box: "In the message box, select 'Cowork'," and select "Chat" to go back.
  ([support — Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork);
  [7 Jul 2026 merge](https://cryptobriefing.com/anthropic-claude-chat-cowork-interface-update/)).
  Earlier builds used **Chat / Cowork / Code tabs** at the top of Claude Desktop
  ([DataCamp](https://www.datacamp.com/tutorial/claude-cowork-tutorial)) — the same product has
  oscillated between "tab" and "mode-in-composer."
- **Surfaces:** desktop, web, mobile, Chrome side panel (which "starts a Cowork session directly,
  with no selector"). Live artifacts are **desktop-only**. Sessions are portable: "Resume a session
  started on another surface."
  ([support — web, desktop, mobile](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile))
- GA for paid plans **10 April 2026**, with "role-based access controls for teams, spend limits and
  use controls for governance, analytics and visibility, and integrations and plugins."
  ([TechRadar](https://www.techradar.com/pro/claude-cowork-is-now-available-for-enterprise-use-adds-analytics-access-controls-and-more))

### 1.1 The three-panel task anatomy

The single most useful UI finding. A Cowork task shows **three stacked panels on the right**:

| Panel | Answers | Contents |
|---|---|---|
| **Progress** | "what Claude *will do*" | Numbered plan; done steps get a checkmark + strikethrough, current step highlighted, future steps plain |
| **Project** | "what *can* Claude see?" | **Instructions · CLAUDE.md**, project files, and a **Scratchpad** audit trail marking each file "*wrote to*", "*viewed*", "*created*" |
| **Context** | "what *can* Claude reach?" | **Uploads** (this task only) and **Connectors** (active integrations only — installed-but-inactive ones don't appear) |

([Camp Claude — Anatomy of a Cowork Task](https://camp-claude.github.io/learn/cowork-task-anatomy/))

Corroborated: a "visible todo list" you "review before it starts. Each step gets checked off as it
completes" ([aimaker](https://aimaker.substack.com/p/claude-cowork-review-agentic-ai-guide)); and a
"Progress sidebar on the right displaying real-time task updates," an "Artifacts pane showing files
Claude reads or creates, clickable for preview," plus a terminal output view
([DataCamp](https://www.datacamp.com/tutorial/claude-cowork-tutorial)).

The todo lifecycle is documented: `pending` → `in_progress` → `completed` (→ `deleted`), with a
separate `activeForm` label ("Identifying newsletter threads") shown *instead of* the static
`subject` while a step runs. Todos are created for "complex multi-step tasks requiring three or more
distinct actions." ([Track todos](https://code.claude.com/docs/en/agent-sdk/todo-tracking))
**This is the canonical spec for an agent progress list — copy its state machine.**

### 1.2 Approval modes (the governance control)

A **mode selector in the chat box**: **Manual** ("Manually approve") pauses for approval; **Auto**
("Automatically approve") works autonomously but "reviews each action for safety"; **Skip** ("Skip
all approvals"). Users can **steer** mid-run — "jump in to course-correct."
([support — Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork))

Admins gate these at **Organization settings > Cowork**: "Enable for your organization," "Run Cowork
in the cloud," "Allow 'Automatically approve' mode," "Allow 'Always allow' for connector tools" (off
by default). Enterprise adds groups + custom roles; events stream via OpenTelemetry to SIEM covering
"tool calls, file access, human approval decisions"; remote sessions are retrievable via the
Compliance API.
([support — Team and Enterprise](https://support.claude.com/en/articles/13455879-use-claude-cowork-on-team-and-enterprise-plans))

### 1.3 Projects, folders, memory

**Projects** sit in the left nav, created with the "+" next to "Projects," each with "their own
files, context, instructions, and memory." Components: **Instructions** ("Add tone, formatting, or
rules"), **Context** (folders, chat projects, URLs), **Scheduled tasks**, **Memory** — "Memory is
scoped to the project, so what Claude learns in one project doesn't carry over to others." Created
from scratch, imported from a chat project, or from an existing folder. Cowork projects are
**desktop-only and stored locally**.
([support — Projects in Cowork](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork))

Folder access is explicit: a "Work in a Folder" checkbox plus a dialog asking to "read, edit, and
delete files" with one-time or **"Always Allow"**
([DataCamp](https://www.datacamp.com/tutorial/claude-cowork-tutorial)). Standing rules live at
**Settings > Cowork → Global instructions → Edit**.

### 1.4 Scheduled tasks

**"Scheduled" in the left sidebar** → **"New task"** → **"Create with Claude"** (clarifying
questions with multiple-choice answers, then a proposed name + schedule + description you confirm
with **"Schedule"**) or **"Set up manually"** (task name, prompt, approval mode, frequency —
hourly / daily / weekly / weekdays / manually — optional model, optional folder). The page shows all
tasks plus **upcoming and past runs**, with edit, pause, resume, delete, run-on-demand. `/schedule`
works inline. Scheduled tasks "run remotely, so they run on their cadence even when your computer is
asleep."
([support — Schedule recurring tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork))

### 1.5 Live artifacts

"Persistent, interactive HTML dashboards" that refresh with current data from connected apps and
keep version history — each "marked with a 'Cowork' label." They live in the **Artifacts view** with
a **"Live artifacts" tab**, a **"Filter by" dropdown** top-right, a **refresh button** in the
header, and version history. Created from a task or via **"New artifact" → "Create Cowork
artifact."**

The governance detail worth stealing outright: sharing is Team/Enterprise only, via **"Share" →
"Share & copy link"**, "Sharing stays within your organization" with "no external or public links,"
and **"Viewers use their own connector access, not the creator's."**
([support — Live artifacts](https://support.claude.com/en/articles/14729249-use-live-artifacts-in-claude-cowork))

### 1.6 Dispatch, notifications, the built-in browser

**Dispatch** messages Claude from phone or desktop; "Claude figures out what kind of work is needed
and spins up the right session… These sessions appear in their respective sidebars." It deliberately
*hides* the trace: "Claude messages you the outcome (a spreadsheet, a memo, a comparison table, a
pull request) rather than showing you every step." Dispatch is **one continuous thread** with no
thread management; push fires "when a task is done or when Claude needs your go-ahead."
([support — Assign tasks from anywhere](https://support.claude.com/en/articles/13947068-assign-tasks-from-anywhere-in-claude-cowork))

**Built-in browser:** "a browser opens in the side panel and Claude navigates webpages, reads them,
clicks, and types," while you keep working. "Claude never sees your tabs, bookmarks, or passwords";
per-site login import; banking/email/SSO excluded by default. **Settings → Cowork → Preferred
browser**. ([claude.com/blog/cowork-built-in-browser](https://claude.com/blog/cowork-built-in-browser))

---

## 2. Claude's chat UI vocabulary

- **Composer:** the "+" button lower-left, or type **"/"** for commands. Model name shown *below*
  the input on web/desktop (top of screen on mobile); click it for the model selector and
  "model, effort, and thinking settings."
  ([support — Get started with Claude](https://support.claude.com/en/articles/8114491-get-started-with-claude))
- **Thinking disclosure:** a **"Thinking" indicator with a timer**, in an **expandable section
  above** the response, containing "Claude's thought process summary." Toggled from the
  **"Search and tools"** button lower-left.
  ([support — model, effort, thinking](https://support.claude.com/en/articles/10574485-using-extended-thinking))
- **Research mode:** "+" → "Research"; "A blue indicator will appear on the bottom of the chat
  window"; output has "easy-to-check citations."
  ([support — Use research](https://support.claude.com/en/articles/11088861-use-research-on-claude))
  The step-by-step progress rendering of Research is **[unverified]** — support docs don't describe it.
- **Artifacts:** "a dedicated window to the right of the main chat," triggered by content that "is
  significant and self-contained, typically over 15 lines" and likely to be edited or reused. Has a
  **version selector**, **"Edit with Claude"** on highlighted markdown, lower-right controls to
  view code / copy / download, a **slider icon upper-right** for multiple artifacts in one
  conversation, and **"Try fixing with Claude"** on errors.
  ([support — Artifacts](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them))
- **Sharing:** Share button **upper right** → "Share"; produces a **snapshot** of messages sent
  before sharing. Attachments and "raw data retrieved from MCP tool calls" stay private. Unshare via
  the **visibility dropdown** ("Public" → "Private"); audit at **Settings > Privacy → Shared chats.**
  Team/Enterprise can only share inside the org.
  ([support — Share and unshare chats](https://support.claude.com/en/articles/10593882-share-and-unshare-chats))
- **Memory & search:** retrieving a past chat "you will see this reflected in your current chat as a
  tool call." **Settings > Memory** has "Search and reference chats," "Generate memory from chats,"
  and "Include sensitive topics in memory" — the last surfaces "a notice … above the message box"
  each time something sensitive is saved. **Incognito** = a ghost icon upper-right.
  ([support — chat search and memory](https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context))
- **Keyboard/quick entry (macOS):** double-tap **Option** to open Claude from any app; **Option +
  Space** alternative; **Caps Lock** for dictation; customised at Settings > General → "Desktop app."
  ([support — Quick entry](https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac))
  A published full keyboard-shortcut map for claude.ai chat is **[unverified]**.
- **Usage indicators:** support docs cover limits policy but **do not** document the in-product
  indicator UI — **[unverified]**.
- **Message actions** (copy / retry / edit-and-branch): widely present in the product but **not
  documented** in the Conversation management collection, which covers only delete/rename, share,
  incognito, search/memory, model-switch notices — **[unverified]** as to exact labels.

---

## 3. Skills, connectors, plugins as end-user surfaces

**Skills** live at **Customize > Skills**, split into **Personal / Shared / Organization**.
Prerequisite: enable **"Code execution and file creation"** (Settings > Capabilities, or Organization
settings > Skills). Each skill is a **toggle**; **"+"** creates or uploads one; **grayed-out** =
disabled or blocked by org settings; a **"Share"** button distributes it. Claude invokes them
automatically; on some surfaces users type **"/"** to browse.
([support — Use skills](https://support.claude.com/en/articles/12512180-use-skills-in-claude))

**Connectors** live behind the **"+" button lower-left** or **"/"** → hover **"Connectors"** →
toggle per conversation. Org owners set **Tool permissions** per category (read-only vs write/delete)
to **"Always allow," "Needs approval," or "Blocked."** A **"Tool access"** setting offers **"Auto"**
(default) or **"On demand."** Connectors with an **"Interactive"** badge "render live interfaces —
like dashboards, task boards, and design tools — directly within your conversation," as **inline
cards** or **fullscreen view**, in sandboxed iframes.
([Connectors](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities);
[Interactive connectors](https://support.claude.com/en/articles/13454812-use-interactive-connectors-in-claude))

**Plugins** bundle "skills, connectors, and sub-agents into a single package": Cowork tab →
**Customize** → **Plugins** → **"Browse plugins"** → **"Install."** Marketplaces (default "Knowledge
Work") added via **"+" → "Add marketplace."** Note: "Hooks and sub-agents run only in Cowork, so they
appear grayed out in chat."
([Use plugins](https://support.claude.com/en/articles/13837440-use-plugins-in-claude)). The
financial-services marketplace is the worked domain example — a core "Financial analysis" plugin plus
add-ons exposing `/comps [company]`, `/dcf [company]`, `/ic-memo [project name]`.
([Claude Academy](https://academy.claude.com/tutorials/install-financial-services-plugins-for-cowork))

**Enterprise search** ships as a pre-configured project named **"Ask Your Org,"** "starred in your
sidebar by default," and is **"Permission-aware: You only see search results from data you have
permission to access in the original systems,"** with "Each user authenticates with their own
credentials."
([Enterprise search](https://support.claude.com/en/articles/12489464-use-enterprise-search))
**The closest shipped analogue to Spiff's governance invariants.**

---

## 4. Comparable workspaces — distinctive UI moves

| Product | Distinctive move | Source |
|---|---|---|
| **ChatGPT canvas** | Opens "in a separate window"; **directly editable** by the user; a **contextual shortcuts menu** (adjust length, reading level, add polish / review code, add logs, fix bugs); versions via a **back button**; **inline suggestions** rather than chat critique; opens automatically when detected useful | [openai.com/index/introducing-canvas](https://openai.com/index/introducing-canvas/) |
| **ChatGPT agent** | `/agent` in the composer or the tools menu; **"'…' → Take over browser"** hands control back to the human for passwords; **Clock icon** turns a finished run into a repeating schedule; central `chatgpt.com/schedules` page | [help.openai.com — ChatGPT agent](https://help.openai.com/en/articles/11752874-chatgpt-agent) |
| **M365 Copilot** (May 2026 redesign) | Expand/contract left nav over "agents, conversations, and history"; the **prompt line becomes an expandable workspace** with inline formatting; **layered responses** (plain answer first, structure and next-step actions added as you refine); in-app **side pane** as "an editing partner … with clear signals so you always know what it's doing"; capability agents (Designer, Researcher, Word, Excel, PowerPoint) | [microsoft.com blog](https://www.microsoft.com/en-us/microsoft-365/blog/2026/05/28/introducing-a-new-design-for-microsoft-365-copilot/); [support.microsoft.com — agents](https://support.microsoft.com/en-us/topic/using-agents-for-microsoft-365-copilot-169469d7-328d-4d37-9090-bfc2058a39bd) |
| **Gemini side panel (Docs)** | **"Ask Gemini"** top-right; auto-summarises the open doc on open; **suggested prompts + "More suggestions"**; **@** to reference Drive files, or **"Sources" → "Add from Drive"**; per-response **Insert / Retry / Preview / Copy** buttons; thumbs feedback | [support.google.com](https://support.google.com/docs/answer/14206696?hl=en) |
| **Notion Agent** | Persistent **"friendly face at the bottom"**; **"Switch chat mode"** toggles sidebar vs floating window; results render as an **interactive table in chat**; **pin** a chat to the top of the Chat tab; clock icon for chat history; model dropdown in-panel; a private **"My Notion AI"** page holds instructions + memory | [notion.com/help/notion-agent](https://www.notion.com/help/notion-agent) |
| **Notion Custom Agents** | Built by describing them in plain language; **schedule or event triggers**; "Every run is logged, so changes are visible and reversible" | [notion.com/releases/2026-02-24](https://www.notion.com/releases/2026-02-24) |
| **Perplexity Projects** (formerly Spaces) | "A persistent, shareable workspace" holding conversations, computer tasks, files, custom instructions, connected tools; a **Files** section; a **Settings** tab for instructions and prioritised domains; a **Brain** tab for accumulated memory; roles **Owner / Can edit / Can view** and visibility **Restricted / Organization can view / Anyone with the link** | [perplexity.ai help](https://www.perplexity.ai/help-center/en/articles/10352961-what-are-spaces) |

---

## 5. Anatomy of a portal chat workspace

An exhaustive component inventory, assembled from the sources above.

**A. Left rail (persistent nav)**
1. Product/org logo + workspace switcher.
2. **New task / New chat** primary button.
3. Global **search** (Claude: ask naturally, rendered as a tool call).
4. Mode entries — in Claude these are now composer modes, but the rail still holds destinations:
   **Chats**, **Cowork/Tasks**, **Code**.
5. **Projects** section with a **"+"** to create.
6. **Scheduled** (tasks page).
7. **Artifacts** view (with a **Live artifacts** tab and **Filter by**).
8. **Customize** → Plugins / Skills / Connectors, consolidated "in one place."
9. Starred/pinned items (e.g. **"Ask Your Org"** starred by default).
10. Account, plan, settings, usage.

**B. Thread list with grouping**
Recents grouped by time; grouping by project; pin-to-top; rename/delete; incognito (ghost icon);
search across history; per-thread status when a run is in flight; last-run timestamp for scheduled
items.

**C. Composer**
Multiline expandable input (M365 makes it "an expandable workspace" that keeps pasted structure);
**mode selector** (Chat / Cowork) bottom-left; **approval-mode selector** (Manual / Auto / Skip);
**"+" menu** for attachments, connectors, tools, Research; **"/" command palette** for skills and
plugin commands (`/schedule`, `/dcf`); **folder scope control** ("Work in a Folder"); **model
picker** with effort/thinking settings shown under the input; attachment chips; send/stop.

**D. Message stream**
User turns (editable); assistant turns; **collapsible "Thinking" block with elapsed timer**; tool
calls rendered as inline chips/rows; permission-request cards with Allow once / **Always Allow** /
Deny; **interactive inputs** (multiple choice, multi-select, ranking) so the user can click rather
than type; inline cards from interactive connectors; citations; visual/interactive content built
inline; message actions (copy, retry, feedback); consent notices above the message box.

**E. Tool-trace layer**
Per-step chips naming the tool and target; the todo state machine
(`pending` / `in_progress` with an `activeForm` verb phrase / `completed` / `deleted`); a running
"N of M completed" summary; a **Scratchpad**-style file audit ("wrote to", "viewed", "created");
terminal/browser output views; a side-panel browser you can watch.

**F. Artifact / canvas panel**
Right-hand dedicated window; tabs when several artifacts exist (slider icon); **version selector**
and restore; direct user editing; **"Edit with Claude"** on a selection; shortcuts menu of common
transforms; refresh button for live data; view-code / copy / download; **Share & copy link**;
error-recovery button.

**G. Task / progress panel**
The numbered plan reviewable *before* execution; checkmarks and strikethrough; highlighted current
step; steer/interrupt; pause/resume; elapsed time; completion notification.

**H. Right context panel**
**Project** (instructions file, files, scratchpad) and **Context** (uploads scoped to this task,
active connectors only). Plus memory/Brain, and per-project instructions.

**I. Share / publish**
Snapshot-based share links; org-only vs public visibility dropdown; a **Shared** audit list in
settings; roles (Owner / Can edit / Can view); **viewers use their own access, not the creator's**.

**J. Empty states**
Task suggestions on entering the mode ("Organize files", "Crunch data"); Gemini's suggested prompts
+ "More suggestions"; M365's prompt starters per agent; guided setup flows for connectors.

**K. Keyboard & OS surfaces**
Global quick entry (double-tap Option), Option+Space, Caps Lock dictation, "/" palette, mobile
push, browser side panel.

---

## 6. Applying it to a reporting agent

| Component | Reporting-agent mapping |
|---|---|
| Left rail **Cowork/Tasks** | "Answers" — every question a user asks becomes a durable, revisitable run, not an ephemeral chat |
| **Projects** | Reporting areas (e.g. *GST Compliance*, *Revenue Assurance*), each with its own instructions, allowed data domains, and memory. Memory scoped per project = no cross-domain leakage |
| **Instructions · CLAUDE.md** in the Project panel | The visible, editable "definitions file" — what *revenue*, *active client*, *lodgement* mean here. Governance made legible rather than hidden in a prompt |
| **Context panel → Connectors (active only)** | The data-source manifest for this answer: which warehouse, which schema, which reporting date. Show only what's actually reachable *for this person* |
| **Approval-mode selector** | Read-only questions run in Auto; anything that writes, emails, or publishes drops to Manual. The selector is the visible expression of "runs as its owner" |
| **Progress panel** | The query plan as a numbered, reviewable list: *interpret question → resolve entities → check permissions → build query → validate against control totals → render*. Reviewable **before** it runs is the trust-builder |
| **Tool-trace chips** | Each becomes an auditable lineage row: table touched, filter applied, rows returned, row-level security applied |
| **Scratchpad audit ("viewed"/"wrote to")** | The data-access log a compliance officer would ask for, shown to the user by default |
| **Artifact / live artifact** | The report itself — a live HTML dashboard with a **refresh** button and version history, so "the number changed" is explainable |
| **Live-artifact sharing rule** | The literal precedent for Spiff's core invariant: share the artifact, **viewers use their own connector access, not the creator's**. Frame the share dialog as *"Recipients see this re-run against their own permissions"* |
| **Scheduled tasks** | Recurring reports: "Set up manually" fields map almost 1:1 to a report schedule (name, prompt, approval mode, frequency, model, folder) — and the upcoming/past runs list is the run history |
| **Sharing an automation** | Per the invariant, the share action **clones** the schedule to the recipient, who becomes its owner — surface this as "Copy to my schedules," never "Add me as a viewer" |
| **Skills / plugins** | Report templates and house methodologies as `/` commands (`/variance`, `/aging`, `/gst-return`) — discoverable, org-published, toggleable, with grayed-out entries showing what governance has withheld |
| **Enterprise search "Ask Your Org"** | Precedent for a starred, pre-configured, **permission-aware** entry point — Spiff's front door |
| **Interactive connectors (inline cards)** | Filterable result tables inline in the answer, so a follow-up is a click not a re-prompt |
| **Citations** | Every figure carries a click-through to the query, the source table, and the as-at timestamp |
| **Empty state** | Question starters drawn from the user's actual entitlements — never suggest a report they cannot run |
| **Usage/limits** | Reframe as cost/scan transparency: rows scanned, warehouse credits, freshness of the underlying data |

---

## 7. Design lessons

1. **Show the plan before the work.** Cowork's highest-trust move is a numbered todo list the user
   reads *and steers* before execution. For Spiff that is the query plan — it turns black-box SQL
   into a reviewable proposal.
2. **Use the documented state machine.** `pending` → `in_progress` (verb-phrase `activeForm`) →
   `completed`. Present tense running, past tense done. Don't invent vocabulary.
3. **Three panels answer three questions.** *Will do* (Progress), *can see* (Project), *can reach*
   (Context). Separating capability from activity is what makes governance visible rather than
   claimed.
4. **List only what is actually live.** Cowork's Context panel shows active connectors, not
   installed ones. Show the data *this viewer* can reach right now — an empty slot is itself an
   honest governance signal.
5. **Make the audit trail a panel, not a log file.** The Scratchpad's "viewed / wrote to / created"
   annotations are the pattern.
6. **Put the risk dial in the composer.** Approval mode sits beside the send button, per task, not
   buried in settings — and admins can remove the riskiest option entirely.
7. **Governance is two layers.** Per-conversation user toggles *plus* org-level permissions
   ("Always allow / Needs approval / Blocked", split read vs write). Mock both.
8. **Re-scope on share, don't widen.** "Viewers use their own connector access, not the creator's"
   is shipped, not aspirational. Put it in the share dialog's copy.
9. **Share snapshots with holes by design.** Claude's shared chats deliberately exclude attachments
   and raw MCP tool results. Share the narrative; re-run the numbers.
10. **Collapse the trace by default, keep the timer visible.** Presence of reasoning always shown,
    volume opt-in.
11. **Deliverables outlive threads.** An Artifacts view with tabs and a Filter-by dropdown treats
    outputs as a library. People return to the report, not the conversation.
12. **Version history + refresh make a live number safe.** Restore answers "what did we tell the
    board last month?"; refresh answers "is this current?"
13. **Let the user click, not type.** Multiple-choice / multi-select / ranking inputs and suggested-
    prompt chips reduce prompt anxiety — vital for non-analyst self-service.
14. **Scheduling is the graduation path.** Every good ad-hoc answer should offer "run this weekly"
    in one gesture (Clock icon / `/schedule`), then get a run-history page of upcoming and past runs.
15. **Direct manipulation beats re-prompting.** Editable canvases, "Edit with Claude" on a
    selection, and interactive inline tables all say: let the user grab the output.
16. **Notify on two events only** — done, or blocked-needing-approval. Deliver the outcome, not the
    trace.

---

## 8. Confidence notes

- The three-panel Cowork anatomy comes from one detailed third-party source (Camp Claude),
  corroborated in outline by DataCamp and aimaker. Treat the exact panel headings as strong but not
  first-party.
- Message-action labels (retry / edit / branch), claude.ai keyboard shortcuts, usage-indicator UI,
  Research's in-progress rendering, and ChatGPT agent's live activity view are **not documented** in
  vendor help content — marked **[unverified]** above.
- Perplexity has renamed Spaces to **Projects**; the help centre now describes Projects.
