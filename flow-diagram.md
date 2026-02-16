Akomi — End-to-End Flow Diagram
1️⃣ High-Level User → Agent Flow
┌────────────────────┐
│        User        │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────┐
│  Web UI: Create Policy      │
│  - Subscription Name        │
│  - Max Price                │
│  - Renewal Period           │
│  - SLA Condition            │
│  - Vendor Allowlist         │
└─────────┬───────────────────┘
          │  (Submit)
          ▼
┌─────────────────────────────┐
│  Akomi Agent                │
│  Intent Builder             │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ 🔐 Encrypt Intent (BITE v2) │
│  - Price                    │
│  - Vendor                   │
│  - Condition                │
│  - Execution Rules          │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Encrypted Intent Stored     │
│ Status: ACTIVE (LOCKED)     │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ User / System Triggers      │
│ Condition Check             │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Condition Checker           │
│ (SLA / Policy Validation)   │
└─────────┬───────────────────┘
          │
          ▼
        ┌─┴─┐
        │ ? │   ← Decision Point
        └─┬─┘

2️⃣ Decision Fork — Condition Evaluation
❌ Path A: Condition FAILS (Safe Outcome)
┌─────────────────────────────┐
│ Condition Result: FAIL      │
│ SLA < Required Threshold   │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ 🔒 Intent Remains Encrypted │
│ ❌ No Decryption            │
│ ❌ No Payment               │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Failure Receipt Generated   │
│ - Reason Logged             │
│ - Policy Locked             │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ End State                   │
│ SAFE TERMINATION            │
└─────────────────────────────┘


Key judge takeaway:
“Failure is a correct and safe outcome.”

✅ Path B: Condition PASSES (Execution)
┌─────────────────────────────┐
│ Condition Result: PASS      │
│ SLA ≥ Required Threshold   │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ 🔓 Decrypt Intent (BITE v2) │
│ (One-time unlock)           │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Policy Engine               │
│ - Spend Cap Check           │
│ - Vendor Allowlist          │
│ - Single Execution Rule     │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Execute Subscription        │
│ Renewal Payment             │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ Receipt Generated           │
│ - Amount                    │
│ - Condition Result          │
│ - Tx Hash                   │
└─────────┬───────────────────┘
          │
          ▼
┌─────────────────────────────┐
│ End State                   │
│ COMPLETED + AUDITABLE       │
└─────────────────────────────┘

3️⃣ Privacy & Trust Boundaries (Call This Out in Demo)
┌─────────────────────────────┐
│ BEFORE CONDITION            │
│ - Price: 🔐 Encrypted       │
│ - Vendor: 🔐 Encrypted      │
│ - Timing: 🔐 Encrypted      │
└─────────────────────────────┘

┌─────────────────────────────┐
│ AFTER CONDITION PASS        │
│ - Price: ✅ Revealed        │
│ - Vendor: ✅ Revealed       │
│ - Execution: ✅ Final       │
└─────────────────────────────┘


This explicitly answers:

“What stays private?”
“When does it unlock?”
“Why does it matter?”

4️⃣ One-Line Diagram Summary (Great for README)
User → Encrypted Intent → Condition Check → (Decrypt & Execute OR Block) → Receipt