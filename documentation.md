INSTRUCTION
=======================
Introduction
The San Francisco Agentic Commerce x402 Hackathon is a 3-day hybrid hackathon bringing together builders in AI, agentic commerce, x402, Google AP2/A2A, ERC-8004, Web3, DeFi, and payments to ship real-world demos in agentic commerce systems where autonomous agents can act as real buyers and sellers.

Hosted by SKALE Labs in partnership with Google, Coinbase, Virtuals, Edge & Node, and Pairpoint by Vodafone, this hackathon focuses on practical integrations, programmable payments, and production-ready agent payment workflows using x402 and Web3 infrastructure.

Timeline
Pre-Registration: January 27 – February 11

Build Sprint: February 11 – February 13

Winner Announcements: Target By February 24

Prizes
Total Prize Pool: $50,000 total value

Main Prize: Overall Winner

Build Track Bounties: Track-specific prizes for teams building with sponsor integrations

Build Tracks
See "Tracks" Tab

Eligibility
Open to developers worldwide.
Participants may join solo or in teams.
Builders across AI/agents, Web3, DeFi, payments, and commerce are encouraged.
All projects must be built during the hackathon and submitted by the deadline.
Participants located in, ordinarily resident in, or otherwise subject to comprehensive U.S. sanctions (including OFAC-sanctioned countries/regions) are not eligible to receive hackathon prizes.
Judging criteria
Projects will be evaluated based on:

AI Readiness: Strong use of LLMs, autonomous agents, or other AI capabilities
Commerce Realism: Realistic payment, marketplace, or commercial flows
Technical Execution: Quality of implementation and integrations
Polish & Ship-ability: Completeness, UX, and readiness for real-world use
Partner Integration: Effective use of sponsor platforms
Presentation & Demo: High quality showcase of Buidl
Builder Support
Developer support for the SKALE, Coinbase Developer Platform, and Virtuals tracks will be provided via the SKALE Builders Telegram channel: https://t.me/+dDdvu5T6BOEzZDEx

Developer support for the Google Cloud track will be provided via email. If you need support, please reach out to godeva@google.com and jordanellis@google.com

About us
SKALE is a network of Layer 1 blockchains built for the Internet of Agents. It enables agent-driven applications with commerce-grade privacy, fast execution, and scalable-by-default performance. SKALE achieves this with a horizontally scalable network of high-performance EVM blockchains that support private execution, instant finality, and gasless transactions. It is designed for agentic commerce flows and standards such as x402 for payments, AP2 for settlements, and ERC-8004 for orchestration. At the core is Blockchain Integrated Threshold Encryption (BITE), which keeps sensitive transaction details encrypted until finality and enables conditional transactions without leaking balances, intent, or strategy.
Overall Track: Best Agentic App / Agent
Judges
Sawyer Cutler, VP Developer Success, SKALE Labs

Manuel Barbas, Deployment Engineer, SKALE Labs

Rewards
1st Place: $2,000 USDC + $5,000 Google Credits + $2,500 SKALE Credits
2nd Place: $1,000 USDC +$5,000 Google Credits + $2,500 SKALE Credits
What this track rewards
The best end-to-end project or novel use-case. This is the hero prize and the clearest signal of what the hackathon is about: agents that can reliably complete real workflows with payments/settlement.

Minimum bar (must-have)
Demonstrates a real-world workflow: discover → decide → pay/settle → outcome
Uses agents/protocols in a meaningful way
What judges look for (how to win)
Real utility: solves a real commerce task with a clear user value proposition
Reliability: deterministic flow, good error handling, and sensible defaults
Trust + safety: guardrails (spend caps, allowlists, confirmation steps, policy limits)
Receipts/logs: clear evidence of what the agent did and why (audit trail)
Strong example themes
Pay-per-API workflows (data procurement → decision → execution)
“Agent buys tools to complete a task” (tool discovery + paid calls)
Merchant automation (inventory/order/customer service)
Subscriptions and renewals (agent manages plan, billing, changes)
Travel booking with a payment + receipt trail
Submission requirements
Repo + README, quickstart instructions
2–3 minute demo video with video posted on twitter
Evidence: screenshots/logs of x402/AP2 flows + final outcome
Agentic Tool Usage on x402
Judge: Kevin Leffew, GTM Lead, CDP
Rewards
1st Place: $2,000 USDC + $5,000 Google Credits
2nd Place: $1,000 USDC
Track Brief
Build demand-side agents that autonomously discover, reason over, and pay for chained tool calls in order to accomplish an end-to-end task. The emphasis is on CDP Wallets + x402 payments woven into multi-step tool chaining.

Required components (must-have)
Uses CDP Wallets (embedded or server-hosted) to custody funds and sign payment payloads
Uses x402 in a real flow: HTTP 402 → pay → retry
Demonstrates tool chaining: at least two paid steps or two paid tool calls in one workflow
Shows cost reasoning (budget awareness, tradeoffs, or pruning behavior)
What “excellent” looks like (win conditions)
Uses the x402 flow correctly and repeatedly (not a one-off payment)
Clear economic logic: agent chooses tools based on price/value
Well-instrumented: receipts/logs, spend tracking, step-by-step trace
Good UX even for an agent: pricing surfaced, confirmations optional, sane defaults
Example project ideas
Agent assembles a report by paying for data sources (multiple paid calls)
Agent runs a paid image generation → paid post scheduling → paid analytics loop
Agent chains: fetch leads → enrich → write outreach → send campaign, paying per step
Submission requirements
Demo video showing 402 challenge + payment + retry
CDP wallet integration proof (config / flow)
Logged spend summary (per tool call)
Best Integration of AP2
Judge: Nalin Mittal, Product Manager Web3, Google Cloud
Rewards
1st Place: $2,000 USDC + $5,000 Google Cloud Credits
2nd Place: $1,000 USDC + $5,000 Google Cloud Credits
Track Brief
Best use of AP2 for authorization + settlement inside an agent workflow. This track is about proving clean and reusable patterns: intent → authorization → settlement → receipt.

Required components (must-have)
Implements a clean intent → authorization → settlement flow
Produces a receipt/record that’s auditable (for humans and/or systems)
What “excellent” looks like (win conditions)
“Feels like a reusable pattern” other teams can copy
Crisp separation of: intent creation, user approval (if human-present), settlement execution
Clear accountability: who authorized what, what got executed, what was delivered
Example project ideas
Shopping Agent — Main orchestrator; handles user requests
Merchant Agent — Handles product queries; creates signed CartMandates
Credentials Provider Agent — Holds user's payment credentials (wallets); facilitates payment
Merchant Payment Processor Agent — Settles payment on-chain via x402
Submission requirements
Demo video showing full AP2 flow and a failure mode
Receipt output (UI or structured JSON) demonstrating audit trail
Clear write-up of where authorization happens and how it’s enforced
Resources
AP2 Protocol Docs
AP2 GitHub (main repo)
AP2 x402 Human-Present Sample
A2A x402 Extension
AP2 Specification
Best Trading / DeFi Agent / AI Agent
Judge: Celeste Ang, Developer Relations Lead, Virtuals Protocol
Rewards:
1st Place: $2,000 USDC
2nd Place: $1,000 USDC
Track Brief
Best agent that trades, routes, hedges, farms, or manages positions with explicit safeguards.

Required components (must-have)
Executes at least one off-chain trade or onchain DeFi action (swap, LP, deposit/withdraw, borrow/repay, route)
Must include risk controls, such as:
spend cap, slippage bounds, allowlist/denylist, position sizing, timeouts, or human approval
Must explain why it acted
What “excellent” looks like (win conditions)
Auditable trail (e.g. tx hashes + reason codes)
Performance logic: what objective function it’s optimizing and why
An agent which researches and collects multiple data sources, combined with its own reasoning, to inform its trading or DeFi actions (i.e. not just trade execution)
An agent which provides autonomous and customized services for users (e.g. dependent on user risk appetite)
Example project ideas
Intent-based trading agent with guardrails and receipts
Rebalancing bot with spend caps + position limits
Agent that shops best liquidity route and executes under constraints
Submission requirements
Demo video
Deck or documentation with technical explanation behind agent capabilities
Bonus bounties
Teams who leverage the Agent Commerce Protocol (ACP) SDK or launch agents on Virtuals would be eligible for bonus bounties. Details to be shared at the hackathon.

Useful Resources
Agent Commerce Protocol (ACP) Resources
Begin with the Onboarding Guide
Onboarding Guide
Start here to set up your agent profile and whitelist
Understand the Core Concepts
ACP Concepts, Terminologies, and Architecture 
This article outlines the essential components, architecture, and key terms used within ACP.
Explore Practical Code Examples
Fund Transfer Use Case Setup Tutorial
Node Examples 
Python Examples
Review the provided example implementations to see how agents are initialized, how job flows are structured, and how transactions are handled.
After going through these materials, you’ll be ready to build, test, and deploy your first ACP agent confidently.
Encrypted Agents
Judges
Sawyer Cutler, VP Developer Success, SKALE Labs

Manuel Barbas, Deployment Engineer, SKALE Labs

Rewards
1st Place: $2,000 USDC + $2,500 SKALE Credits
2nd Place: $1,000 USDC + $2,500 SKALE Credits
Track Brief
Build the best application that uses BITE v2 (Blockchain Integrated Threshold Encryption) to enable conditional transactions — where sensitive transaction details remain encrypted and are only revealed/executed when a condition is satisfied. The emphasis is on proving a real “why private + conditional” workflow that cannot be done well with standard public execution.

Required components (must-have)
Uses BITE v2 in a way that materially changes the workflow (not just “privacy as a tagline”)
Demonstrates a conditional trigger (e.g., decrypt/execute only when condition(s) are met)
Shows encrypted → condition check → decrypt/execute → receipt (or equivalent trace)
What “excellent” looks like (win conditions)
Clear why the condition and encryption matter (prevents leakage, front-running, or premature disclosure)
A clean, auditable lifecycle:
policy/condition definition → encrypted intent → execution → receipt/logs
Strong UX and trust model:
“What is private?” “When does it unlock?” “Who can trigger?” “What happens if it fails?”
Demonstrates a realistic commerce-grade use case with guardrails (limits, allowlists, human approval if needed)
Example project ideas
Conditional payment: escrow-like payment released only when delivery proof/attestation is present
Private quote / private bidding: hidden amount/terms until the counterparty accepts
Policy-based execution: agent can transact only within encrypted constraints (spend caps, allowlists)
Private procurement: agent buys data/services without broadcasting strategy/inputs until finality
Conditional subscription renewal: renew only if SLA metrics are met (otherwise auto-cancel)
Submission requirements
Demo video showing the conditional flow end-to-end (encrypted → trigger → execution)
Evidence of BITE v2 usage (logs/trace/screenshots and a short explanation)
Clear description of:
what stays encrypted
what condition unlocks execution
how failure is handled
Receipt output (UI or structured log) showing what executed and why
Resources
SKALE Hackathon Page: https://docs.skale.space/get-started/hackathon/info

x402 Introduction: https://docs.skale.space/get-started/agentic-builders/start-with-x402

Encrypted Transactions with BITE SDK: https://docs.skale.space/developers/bite-protocol/typescript-sdk

Encrypted Transactions: https://docs.skale.space/developers/bite-protocol/encrypted-transactions





==============================================
SOLUTION
==============================================

Akomi
Private Conditional Subscription Renewal Agent
1. Overview

Akomi is an autonomous subscription renewal agent that privately renews services only when predefined encrypted conditions are satisfied.

Using BITE v2 (Blockchain Integrated Threshold Encryption), Akomi ensures that sensitive subscription details — including price, vendor identity, renewal timing, and policy constraints — remain encrypted until execution conditions are met.

If conditions fail, no decryption and no payment occurs.

This enables a new class of trust-minimized, privacy-preserving agentic commerce workflows that cannot be safely implemented using standard public execution.

2. Problem Statement

Traditional subscription renewals suffer from three core issues:

Privacy leakage

Renewal price

Vendor identity

Timing and intent

Lack of enforceable conditions

Renewals happen even when SLAs degrade

Users must manually audit service quality

Poor agent safety

Agents can overspend

No deterministic guardrails

Weak auditability

Akomi solves this by combining:

encrypted intent

conditional execution

explicit guardrails

verifiable receipts

3. High-Level Architecture

Akomi is a single logical agent composed of clearly separated modules.

User
 ↓
Minimal Web UI
 ↓
Akomi Agent
 ├─ Intent Builder
 ├─ Policy Engine
 ├─ Encryption Layer (BITE v2)
 ├─ Condition Checker
 ├─ Execution Engine
 └─ Receipt Generator
 ↓
SKALE Network


There are no unnecessary multi-agent hops, keeping the system deterministic and debuggable.

4. Core Concepts
4.1 Encrypted Intent

An intent represents a future subscription renewal action.

The following fields are encrypted using BITE v2:

Subscription name

Vendor identity

Renewal amount

Renewal period

Condition parameters

Execution deadline

Only a valid condition trigger allows decryption.

4.2 Conditional Execution

Execution occurs only if:

Condition evaluates to true

Policy constraints are satisfied

Intent has not expired or been executed before

Otherwise, execution is permanently blocked.

4.3 Guardrails (Trust & Safety)

Akomi enforces:

Spend caps

Vendor allowlists

Single-execution guarantees

Timeout / expiry logic

These guardrails are policy-enforced, not LLM-suggested.

5. Detailed Workflow
Step 1: User Creates Renewal Policy (UI)

User inputs:

Subscription name (e.g. “Analytics API Pro”)

Maximum renewal price

Renewal frequency

SLA condition (e.g. uptime ≥ 99.9%)

Vendor allowlist

The UI does not store plaintext beyond session memory.

Step 2: Intent Construction

Akomi constructs an intent object:

{
  "subscription": "...",
  "vendor": "...",
  "maxPrice": 99,
  "period": "monthly",
  "condition": {
    "type": "sla",
    "threshold": 99.9,
    "windowDays": 30
  },
  "expiresAt": "timestamp"
}


This object is immediately encrypted using BITE v2.

Step 3: Encrypted Intent Storage

On-chain / persisted state includes:

Encrypted payload

Condition hash

Policy reference

Execution status (pending)

No plaintext values are visible.

Step 4: Condition Evaluation

The agent periodically or manually triggers a condition check.

Example (mocked for demo):

{
  "uptime": 99.95,
  "period": "last_30_days"
}


Condition result:

true → continue

false → block execution

Step 5A: Successful Execution Path

If condition passes:

Encrypted intent is decrypted

Policy engine validates:

price ≤ cap

vendor allowlisted

intent unused

Payment executes

Receipt is generated

Intent marked as completed

Step 5B: Failure Path (Important)

If condition fails:

No decryption occurs

No payment occurs

Intent is permanently blocked

Failure receipt is generated

This is a first-class success case in the demo.

6. Receipt & Audit Trail

Akomi produces a structured receipt after every evaluation.

Success Receipt
{
  "agent": "Akomi",
  "subscription": "Analytics API Pro",
  "condition": "SLA >= 99.9%",
  "conditionResult": "PASS",
  "executed": true,
  "amount": 89,
  "txHash": "0x...",
  "timestamp": "..."
}

Failure Receipt
{
  "agent": "Akomi",
  "subscription": "ENCRYPTED",
  "condition": "SLA >= 99.9%",
  "conditionResult": "FAIL",
  "executed": false,
  "reason": "Condition not met"
}


Receipts provide:

Accountability

Debuggability

Human-readable trust

7. Minimal Web UI Specification
Page 1: Create Policy

Fields:

Subscription Name

Max Price

SLA Threshold

Submit Button

Page 2: Agent Status

Displays:

Encrypted Intent ✔️

Condition Check Result

Execution Status

Receipt JSON

No auth. No wallet UI. No styling complexity.

8. Agent Logic (Pseudocode)
if intent.status !== "pending":
  return

metrics = fetchSLAMetrics()

if !conditionSatisfied(metrics):
  emitFailureReceipt()
  markIntentBlocked()
  return

intentData = decryptIntent()

if !policySatisfied(intentData):
  emitFailureReceipt()
  return

executePayment(intentData)
emitSuccessReceipt()
markIntentExecuted()


This deterministic flow is judge-friendly.

9. Demo Strategy
What you explicitly say:

“This price and vendor are encrypted”

“Without BITE, this would leak immediately”

“No condition, no decryption”

“Failure is a safe outcome”

What you show:

Encrypted payload

Condition check

Execution OR block

Receipt

10. Why Akomi Matters (Judge Framing)

Akomi demonstrates:

A real commerce workflow

A privacy-first execution model

A copyable pattern for future agent systems

A clean example of why encrypted conditional execution is necessary

This is not theoretical. This is shippable.

11. Scope Discipline (Do Not Add)

No multi-agent routing

No advanced ML training

No complex UI

No speculative DeFi logic

Simplicity = reliability = points.



====================================
CHOSEN TRACK
=====================================

Encrypted Agents.
