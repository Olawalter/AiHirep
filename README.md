# AI Hiring Panel

> **Don't screen resumes. Evaluate role fit with verifiable evidence.**

AI Hiring Panel is a decentralised, consensus-backed hiring protocol built on [GenLayer StudioNet](https://studio.genlayer.com). It replaces gut-feel resume screening with structured, evidence-based candidate evaluation — powered by validator consensus, fully on-chain, and appealable by design.

---

## What It Actually Does

A hiring manager deploys a panel with a role mandate: must-have requirements, evaluation weights, culture values, and a deadline. Candidates submit structured packets — resume summary, portfolio, GitHub, work samples, evidence links, and written statements. When applications close, the manager triggers `request_ranking()`. GenLayer validators independently evaluate every candidate against the mandate, compare results under the Equivalence Principle, and reach consensus on a canonical ranking. That ranking is stored on-chain, auditable, and open for appeal.

**It is not a resume parser. It is not a keyword matcher. It is a consensus hiring panel.**

---

## Why This Needs GenLayer

A standard smart contract can track submission timestamps, candidate IDs, and deadlines. What it cannot do is reason about whether a GitHub repo demonstrates real skill, whether a portfolio is genuinely relevant to the role, or whether one candidate's communication is clearer than another's. GenLayer validators can — they read natural language, assess public URLs, and reach consensus on qualitative judgements using the Equivalence Principle.

---

## The Equivalence Principle in Practice

`request_ranking()` is a non-deterministic write. Every validator independently runs the same LLM prompt against the same candidate data and role mandate. They will not produce word-for-word identical responses — but they should agree on the decision.

Consensus is reached when a majority of validators agree on the **rank order** (the sorted list of candidate IDs). Reasoning text is not compared — only the stable, objective decision fields. This is implemented using `gl.vm.run_nondet_unsafe` with a custom validator function that re-runs the LLM independently and compares only `application_id` ordering.

The same pattern applies to appeal review (`request_appeal_review`): validators agree on the `verdict` field — `"upheld"` or `"dismissed"` — not the reasoning paragraph.

---

## Panel Lifecycle

```
draft → open → closed → ranked → appeal_pending → appeal_reviewed → finalized
                                       ↑                                  ↓
                                  (optional)                         cancelled
```

| Status | Who acts | What happens |
|---|---|---|
| `draft` | Manager | Panel created, not yet accepting applications |
| `open` | Candidates | Applications accepted |
| `closed` | Manager | Applications locked, ranking can be requested |
| `ranked` | Candidates | Ranking issued, appeal window open |
| `appeal_pending` | Manager | Appeal filed, manager can trigger consensus review |
| `appeal_reviewed` | Manager | Verdict returned, manager can finalize |
| `finalized` | — | Ranking canonical and immutable |
| `cancelled` | Manager | Panel voided at any pre-final stage |

---

## Fairness Guardrails

Evaluation is scoped to **job-relevant evidence only**. The contract prompt explicitly excludes protected attributes — race, gender, age, religion, ethnicity, disability, sexual orientation, political views, family status. Evaluation dimensions are:

- Technical skill (GitHub, work samples, portfolio)
- Experience relevance
- Portfolio quality
- Communication clarity
- Role alignment
- Reference strength
- Evidence depth

**Final hiring decisions remain with the hiring team.** This system produces a consensus recommendation, not a binding outcome.

---

## Appeal Bases

Appeals must be grounded in one of eight structured bases:

| Basis | Meaning |
|---|---|
| `new_work_sample` | New relevant evidence not in original submission |
| `reference_misread` | Reference was misinterpreted |
| `github_evidence_misread` | GitHub work was assessed incorrectly |
| `portfolio_misread` | Portfolio relevance was misjudged |
| `experience_misread` | Experience level or relevance was misjudged |
| `role_requirement_misapplied` | A must-have requirement was incorrectly applied |
| `application_identity_error` | Wrong candidate was assessed |
| `conflict_of_interest_claim` | A validator conflict of interest is alleged |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS |
| UI Components | Custom design system on Radix UI primitives |
| Blockchain | GenLayer StudioNet (chainId: 61999) |
| Intelligent Contract | Python (GenLayer GenVM) |
| Wallet | MetaMask / injected provider via genlayer-js 1.1.8 |

---

## Project Structure

```
.
├── app/
│   ├── page.tsx                        # Landing page
│   ├── panels/
│   │   ├── page.tsx                    # All panels dashboard
│   │   ├── create/page.tsx             # Deploy a new hiring panel
│   │   └── [panelId]/
│   │       ├── page.tsx                # Panel detail + manager controls
│   │       ├── apply/page.tsx          # Candidate application form
│   │       ├── ranking/page.tsx        # Consensus ranking room
│   │       └── appeal/page.tsx         # Appeal desk (file + review)
│   └── profile/page.tsx                # Wallet's panels and applications
├── components/
│   ├── ConsensusRankingSeal.tsx        # Ranking result display
│   ├── FairnessGuardrailNotice.tsx     # Fairness disclosure
│   ├── HiringPanelCard.tsx             # Panel summary card
│   ├── SkillBandMeter.tsx              # Candidate skill bands
│   ├── WalletConnect.tsx               # MetaMask connection
│   └── ui/                             # Button, Card, Input, Badge, etc.
├── contract/
│   └── ai_hiring_panel.py              # GenLayer Intelligent Contract
├── lib/
│   ├── contract.ts                     # All read/write contract calls
│   ├── genlayer.ts                     # Types and chain config
│   └── utils.ts                        # Formatting helpers
└── context/
    └── WalletContext.tsx               # Wallet state provider
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- A GenLayer StudioNet account at [studio.genlayer.com](https://studio.genlayer.com)

### 1. Clone and install

```bash
git clone https://github.com/Olawalter/AiHirep.git
cd AiHirep
npm install
```

### 2. Deploy the contract

Open GenLayer Studio, paste the contents of `contract/ai_hiring_panel.py`, and deploy. Copy the contract address.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_CHAIN_NAME=GenLayer StudioNet
NEXT_PUBLIC_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio.genlayer.com
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xF309eFf239C6b8d360912c8db1030d658C5Ce09f
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## End-to-End Flow

### Manager wallet

1. Go to `/panels/create` — fill in role mandate, weights, deadline
2. Confirm MetaMask — panel deploys to StudioNet as `draft`
3. On the panel detail page, click **Open for Applications**
4. Share the panel URL with candidates

### Candidate wallets

5. Go to the panel, click **Apply Now**
6. Fill in resume summary, portfolio/GitHub URLs, work samples, evidence links, statements
7. Submit — validators confirm the application

### Back to manager

8. Click **Close Applications** when the window ends
9. Click **Request Consensus Ranking** — validators run LLM evaluation, reach consensus on rank order (30–120 seconds)
10. Ranking appears on `/panels/[id]/ranking`

### Appeal (optional)

11. Any candidate can go to `/panels/[id]/appeal` and file a structured appeal
12. Manager switches back, clicks **View Appeal**, then **Request Consensus Appeal Review**
13. Validators re-evaluate and return a verdict
14. Manager clicks **Finalize Ranking** — done

---

## Contract Notes

The Intelligent Contract is pure Python running in GenLayer's GenVM. Key implementation details:

- **Required first line:** `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`
- **Storage:** `TreeMap[u64, str]` — all data stored as JSON strings
- **Timestamps:** `int(datetime.now(timezone.utc).timestamp())` — `gl.message.block_timestamp` does not exist in GenLayer's API
- **Non-deterministic writes:** `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` — leader runs the LLM, validators independently re-run and compare only stable decision fields (rank order for ranking, verdict string for appeals)
- **Address handling:** `gl.message.sender_address.as_hex` returns lowercase — all address lookups must lowercase on both sides

---

## Known Limitations

- StudioNet is a development network — not production-ready
- Consensus time varies with validator load (typically instant for deterministic writes, 2–5 min for LLM ranking)
- StudioNet has 8 concurrent execution slots — heavy polling can trigger rate limits; the app retries automatically with backoff
- Contract state is the source of truth — no local cache or indexer
- Each new contract deployment requires updating `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS`

---

## Contributing

Pull requests welcome. For significant changes, open an issue first to discuss what you'd like to change.

---

## License

MIT

---

## Contact

Walter Olaoluwa · [walterolaoluwa@gmail.com](mailto:walterolaoluwa@gmail.com) · [github.com/Olawalter](https://github.com/Olawalter)
