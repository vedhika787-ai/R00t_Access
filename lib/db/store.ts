import fs from "fs";
import path from "path";
import {
  Contract,
  Clause,
  PlaybookRule,
  Finding,
  Redline,
  Comment,
  AuditLog,
  ScoreSnapshot,
  AiUsageLog,
  Organization,
  Profile,
} from "@/types/database";

// In-memory data store with file persistence
export interface DatabaseState {
  organizations: Organization[];
  profiles: Profile[];
  contracts: Contract[];
  clauses: Clause[];
  playbook_rules: PlaybookRule[];
  findings: Finding[];
  redlines: Redline[];
  comments: Comment[];
  audit_logs: AuditLog[];
  score_snapshots: ScoreSnapshot[];
  ai_usage_logs: AiUsageLog[];
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "lexiguard_store.json");

// Default organization & admin
export const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000002";

export const INITIAL_ORGANIZATION: Organization = {
  id: DEFAULT_ORG_ID,
  name: "LexiGuard Global Legal Corp",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_PROFILES: Profile[] = [
  {
    id: DEFAULT_USER_ID,
    full_name: "Sarah Chen (General Counsel)",
    role: "admin",
    organization_id: DEFAULT_ORG_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    full_name: "David Ross (Senior Legal Counsel)",
    role: "reviewer",
    organization_id: DEFAULT_ORG_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    full_name: "Alex Rivera (Procurement Lead)",
    role: "viewer",
    organization_id: DEFAULT_ORG_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_PROFILE: Profile = INITIAL_PROFILES[0];

export const SEED_PLAYBOOK_RULES: PlaybookRule[] = [
  {
    id: "00000000-0000-0000-0001-000000000001",
    organization_id: DEFAULT_ORG_ID,
    title: "Limitation of Liability Cap & Exclusions",
    category: "liability",
    requirement_text: "Total liability of either party shall be capped at fees paid or payable by Customer in the preceding twelve (12) months. Neither party shall be subject to uncapped or unlimited liability except for IP infringement and gross negligence.",
    ideal_clause_text: "Except for liabilities arising from a breach of confidentiality, IP indemnification, or willful misconduct, in no event shall either party's aggregate liability exceed the total fees paid or payable by Customer in the twelve (12) months preceding the incident.",
    acceptable_fallback_text: "In no event shall either party's total liability exceed two times (2x) the fees paid in the preceding twelve (12) months, or a mutually agreed fixed amount.",
    walk_away_text: "Vendor insists on unlimited liability for Customer or disclaims all liability for its own breaches while holding Customer to uncapped indemnity.",
    severity_default: "critical",
    weight: 5,
    is_mandatory: true,
    is_active: true,
    regulation_tags: ["Commercial Risk", "Enterprise Governance"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000002",
    organization_id: DEFAULT_ORG_ID,
    title: "Mutual Indemnification Requirement",
    category: "indemnification",
    requirement_text: "Indemnification obligations must be strictly mutual. The vendor must defend and indemnify Customer against third-party claims arising from IP infringement, data breaches, or vendor negligence. No unilateral indemnification where Customer indemnifies vendor without reciprocal protection.",
    ideal_clause_text: "Vendor shall defend, indemnify, and hold harmless Customer and its officers, directors, and employees from and against any third-party claims, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to (a) any allegation that the Services infringe any intellectual property right, (b) Vendor's breach of data privacy or confidentiality obligations, or (c) Vendor's gross negligence or willful misconduct.",
    acceptable_fallback_text: "Vendor agrees to indemnify Customer for third-party IP infringement claims and material breaches of data security obligations.",
    walk_away_text: "Customer indemnifies vendor for use of services while vendor provides zero indemnity for vendor IP infringement or data breaches.",
    severity_default: "critical",
    weight: 5,
    is_mandatory: true,
    is_active: true,
    regulation_tags: ["Risk Allocation", "Third-Party Liability"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000003",
    organization_id: DEFAULT_ORG_ID,
    title: "Indemnity Carve-outs & Gross Negligence",
    category: "indemnification",
    requirement_text: "Vendor indemnity must not have broad carve-outs that eviscerate protection. Vendor shall not exclude liability for gross negligence, willful misconduct, or failure to follow reasonable technical instructions.",
    ideal_clause_text: "Vendor's indemnity obligations shall not be subject to any contractual liability cap, and shall not be excused except solely to the extent Customer has materially modified the Services without authorization.",
    acceptable_fallback_text: "Vendor indemnity applies without financial cap for IP infringement, and subject to a separate super-cap of 3x annual fees for data breach indemnity.",
    walk_away_text: "Vendor subjects IP indemnity to the general liability cap or completely carves out subcontractor actions.",
    severity_default: "high",
    weight: 4,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Risk Allocation"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000004",
    organization_id: DEFAULT_ORG_ID,
    title: "Data Protection & 72-Hour Breach Notification",
    category: "data_privacy",
    requirement_text: "Vendor must execute a Data Processing Addendum (DPA) compliant with DPDP Act 2023 and GDPR. Vendor must notify Customer in writing within 72 hours of becoming aware of any confirmed or suspected personal data breach or security incident.",
    ideal_clause_text: "Vendor shall process Customer Personal Data strictly in accordance with Customer's instructions, maintain robust technical and organizational security measures, comply with the Digital Personal Data Protection Act 2023 (DPDP) and GDPR, and notify Customer in writing within seventy-two (72) hours of discovering any security incident or unauthorized access.",
    acceptable_fallback_text: "Vendor agrees to maintain reasonable security practices under the IT Act 2000 and notify Customer of confirmed security breaches without undue delay, not exceeding five (5) business days.",
    walk_away_text: "Vendor disclaims responsibility for data security or offers no committed incident notification timeframe.",
    severity_default: "critical",
    weight: 5,
    is_mandatory: true,
    is_active: true,
    regulation_tags: ["DPDP Act 2023", "GDPR", "IT Act 2000"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000005",
    organization_id: DEFAULT_ORG_ID,
    title: "Sub-processor Approval & Cross-Border Data Transfer",
    category: "data_privacy",
    requirement_text: "Vendor must obtain prior written consent before engaging new sub-processors or transferring Customer Personal Data across international borders. Customer reserves the right to object to any new sub-processor on data protection grounds.",
    ideal_clause_text: "Vendor shall not engage any sub-processor or transfer Customer Data to any third country without prior written authorization from Customer. Customer shall have thirty (30) days to object to any proposed sub-processor, upon which Customer may terminate without penalty.",
    acceptable_fallback_text: "Vendor shall maintain an updated public list of sub-processors and provide at least thirty (30) days notice prior to changes, allowing Customer to object.",
    walk_away_text: "Vendor may engage arbitrary sub-processors without notification or consent and transfer data globally without restrictions.",
    severity_default: "high",
    weight: 4,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["DPDP Act 2023", "Cross-Border Compliance"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000006",
    organization_id: DEFAULT_ORG_ID,
    title: "No Silent Auto-Renewal Without Notice",
    category: "termination",
    requirement_text: "Contract must not automatically renew indefinitely without clear advance written reminder. Minimum notice requirement for non-renewal must be at least sixty (60) days, not shorter than thirty (30) days.",
    ideal_clause_text: "This Agreement shall continue for the Initial Term and shall only renew upon mutual written agreement of the parties, or subject to Vendor providing a written renewal notice at least sixty (60) days prior to expiration of the current term.",
    acceptable_fallback_text: "Agreement auto-renews for successive 1-year terms unless either party gives written notice of non-renewal at least thirty (30) days prior to renewal date.",
    walk_away_text: "Agreement auto-renews for multi-year terms with vendor requiring 180+ days advance notice or unilateral price escalations upon renewal.",
    severity_default: "medium",
    weight: 3,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Procurement Governance", "Commercial Terms"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000007",
    organization_id: DEFAULT_ORG_ID,
    title: "Customer Termination for Convenience",
    category: "termination",
    requirement_text: "Customer must have the right to terminate the contract for convenience upon thirty (30) days written notice without penalty, and receive a pro-rata refund of any prepaid, unearned fees.",
    ideal_clause_text: "Customer may terminate this Agreement or any Order Form for convenience at any time upon thirty (30) days written notice to Vendor, in which case Vendor shall refund to Customer any pre-paid, unearned fees on a pro-rata basis.",
    acceptable_fallback_text: "Customer may terminate for convenience upon sixty (60) days written notice after the completion of the first year of the term.",
    walk_away_text: "Agreement is non-cancellable under any circumstance with zero termination for convenience and no refunds.",
    severity_default: "high",
    weight: 4,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Exit Rights", "Commercial Flexibility"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000008",
    organization_id: DEFAULT_ORG_ID,
    title: "Payment Terms Net 45 & Reasonable Late Fees",
    category: "payment_penalties",
    requirement_text: "Payment terms must be at least Net 45 or Net 30 from invoice receipt. Late payment interest must not exceed 1% per month (or statutory limit). No acceleration clauses or automatic suspension of services without 15 days cure notice.",
    ideal_clause_text: "Customer shall pay undisputed invoices within forty-five (45) days of receipt. Late payments shall accrue interest at 1% per month or the maximum rate permitted by law, whichever is less. Vendor shall provide at least fifteen (15) days written notice prior to suspending services for non-payment.",
    acceptable_fallback_text: "Payment terms Net 30 days. Late fees capped at 1.5% per month. Suspension requires at least ten (10) business days written cure notice.",
    walk_away_text: "Vendor demands immediate payment within 7 days, 5%+ monthly late fees, or immediate unilateral service termination upon minor billing disputes.",
    severity_default: "medium",
    weight: 3,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Financial Controls"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000009",
    organization_id: DEFAULT_ORG_ID,
    title: "Customer Ownership of IP & Customer Data",
    category: "ip",
    requirement_text: "Customer retains sole and exclusive ownership of all Customer Data, Confidential Information, and any custom work product or deliverables created specifically for Customer.",
    ideal_clause_text: "As between the parties, Customer owns all right, title, and interest (including all intellectual property rights) in and to Customer Data and all custom deliverables developed under this Agreement. Vendor assigns all such rights to Customer upon creation.",
    acceptable_fallback_text: "Customer owns Customer Data and custom deliverables, while Vendor retains ownership of pre-existing background IP and grants Customer a perpetual, royalty-free license to use deliverables.",
    walk_away_text: "Vendor claims ownership or broad commercial licensing rights over Customer Data, proprietary datasets, or custom developed workflows.",
    severity_default: "high",
    weight: 5,
    is_mandatory: true,
    is_active: true,
    regulation_tags: ["Intellectual Property", "Data Ownership"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000010",
    organization_id: DEFAULT_ORG_ID,
    title: "Governing Law & Neutral Dispute Resolution",
    category: "governing_law",
    requirement_text: "Governing law must be India (or Singapore/Delaware for international cross-border agreements) with arbitration seated in a neutral commercial hub under standard arbitration rules.",
    ideal_clause_text: "This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in New Delhi, India, in accordance with the Arbitration and Conciliation Act, 1996.",
    acceptable_fallback_text: "Governing law shall be Singapore or England & Wales with arbitration under SIAC or LCIA rules.",
    walk_away_text: "Vendor specifies obscure foreign jurisdiction with no arbitration mechanism, forcing costly overseas litigation.",
    severity_default: "medium",
    weight: 3,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Jurisdiction", "Arbitration"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000011",
    organization_id: DEFAULT_ORG_ID,
    title: "Mutual Confidentiality & Survival Period",
    category: "confidentiality",
    requirement_text: "Confidentiality obligations must be strictly mutual and survive for at least five (5) years following agreement termination, and indefinitely for trade secrets and Customer Data.",
    ideal_clause_text: "Each party agrees to safeguard the Confidential Information of the other party using at least the same degree of care it uses for its own confidential data, but not less than reasonable care. These obligations shall survive for five (5) years after expiration or termination, and indefinitely for Customer Data and trade secrets.",
    acceptable_fallback_text: "Mutual confidentiality with survival period of three (3) years post termination.",
    walk_away_text: "One-sided confidentiality protecting only the Vendor, or confidentiality obligations expiring upon contract termination.",
    severity_default: "medium",
    weight: 3,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Confidentiality", "Information Security"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000012",
    organization_id: DEFAULT_ORG_ID,
    title: "SLA Commitment & Meaningful Service Credits",
    category: "sla",
    requirement_text: "Vendor must commit to at least 99.5% service uptime with defined service credits for downtime. Repeated SLA failures must grant Customer the right to terminate for cause with full refund of prepaid fees.",
    ideal_clause_text: "Vendor warrants that the Services shall maintain at least 99.9% monthly availability. In the event of failure to meet this availability, Vendor shall issue service credits ranging from 10% to 50% of monthly fees. Sustained downtime below 99.0% across two consecutive months shall entitle Customer to terminate for cause without penalty.",
    acceptable_fallback_text: "Vendor commits to 99.5% uptime with credits up to 20% of monthly fees.",
    walk_away_text: "No uptime SLA commitment or credits limited to token amounts with no termination right for chronic downtime.",
    severity_default: "medium",
    weight: 4,
    is_mandatory: true,
    is_active: true,
    regulation_tags: ["Service Levels", "Operational Continuity"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000013",
    organization_id: DEFAULT_ORG_ID,
    title: "Adequate Commercial & Cyber Insurance Coverage",
    category: "insurance",
    requirement_text: "Vendor must maintain comprehensive general liability, commercial auto, workers compensation, and cyber liability insurance (minimum $5M / INR equivalent).",
    ideal_clause_text: "Vendor shall at its own expense maintain Commercial General Liability insurance ($2,000,000 per occurrence), Professional Liability / E&O insurance ($5,000,000 aggregate), and Cyber & Privacy Liability insurance ($5,000,000 aggregate) with reputable insurers.",
    acceptable_fallback_text: "Vendor maintains General Liability ($1M) and Cyber Liability ($2M) with certificate provided upon request.",
    walk_away_text: "Vendor refuses to maintain cyber liability insurance or refuses to provide proof of certificate of insurance.",
    severity_default: "low",
    weight: 2,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Enterprise Insurance"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000014",
    organization_id: DEFAULT_ORG_ID,
    title: "Balanced Force Majeure with Termination Threshold",
    category: "other",
    requirement_text: "Force majeure clause must be mutual, exclude economic hardship and non-payment, and permit either party to terminate if the force majeure event persists beyond thirty (30) days.",
    ideal_clause_text: "Neither party shall be liable for failure to perform due to unforeseen events beyond reasonable control (acts of God, natural disasters, war). If a force majeure event continues for more than thirty (30) days, either party may terminate the Agreement immediately upon written notice.",
    acceptable_fallback_text: "Force majeure clause mutual with sixty (60) days threshold for termination.",
    walk_away_text: "Unilateral force majeure protecting only vendor, or force majeure without time limit preventing Customer from seeking alternative services.",
    severity_default: "low",
    weight: 2,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Commercial Terms"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0001-000000000015",
    organization_id: DEFAULT_ORG_ID,
    title: "Audit Rights & Security Verification",
    category: "other",
    requirement_text: "Customer or its designated independent auditor must have the right to audit vendor compliance with security, data protection, and billing terms once annually upon reasonable advance notice.",
    ideal_clause_text: "Upon reasonable prior written notice, Customer or its independent certified auditor may inspect and audit Vendor's operational facilities, security practices, and records relating to Customer Data and billing during normal business hours to verify compliance.",
    acceptable_fallback_text: "Vendor agrees to provide annual SOC 2 Type II reports and ISO 27001 certifications in lieu of on-site audits, plus third-party pen test summaries.",
    walk_away_text: "Vendor refuses any third-party audit, provides no SOC 2 / compliance certifications, and rejects verification of security controls.",
    severity_default: "medium",
    weight: 3,
    is_mandatory: false,
    is_active: true,
    regulation_tags: ["Security Compliance", "Vendor Due Diligence"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

class MemoryStore {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          organizations: parsed.organizations || [INITIAL_ORGANIZATION],
          profiles: parsed.profiles?.length ? parsed.profiles : INITIAL_PROFILES,
          contracts: parsed.contracts || [],
          clauses: parsed.clauses || [],
          playbook_rules: parsed.playbook_rules?.length ? parsed.playbook_rules : SEED_PLAYBOOK_RULES,
          findings: parsed.findings || [],
          redlines: parsed.redlines || [],
          comments: parsed.comments || [],
          audit_logs: parsed.audit_logs || [],
          score_snapshots: parsed.score_snapshots || [],
          ai_usage_logs: parsed.ai_usage_logs || [],
        };
      }
    } catch (e) {
      console.warn("Failed to read persistent store, initializing with seeds:", e);
    }

    return {
      organizations: [INITIAL_ORGANIZATION],
      profiles: INITIAL_PROFILES,
      contracts: [],
      clauses: [],
      playbook_rules: SEED_PLAYBOOK_RULES,
      findings: [],
      redlines: [],
      comments: [],
      audit_logs: [],
      score_snapshots: [],
      ai_usage_logs: [],
    };
  }

  private persistState() {
    try {
      const dir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write persistent store to disk:", e);
    }
  }

  private activeUserId: string = DEFAULT_USER_ID;

  getActiveUserId(): string {
    return this.activeUserId;
  }

  setActiveUserId(id: string): void {
    if (this.state.profiles.some((p) => p.id === id)) {
      this.activeUserId = id;
    }
  }

  getProfiles(orgId: string = DEFAULT_ORG_ID): Profile[] {
    return this.state.profiles.filter((p) => p.organization_id === orgId);
  }

  getProfile(id: string): Profile | undefined {
    return this.state.profiles.find((p) => p.id === id);
  }

  getActiveProfile(): Profile {
    return this.getProfile(this.activeUserId) || this.state.profiles[0] || INITIAL_PROFILES[0];
  }

  createProfile(profile: Profile): Profile {
    this.state.profiles.push(profile);
    this.persistState();
    return profile;
  }

  // --- Contracts ---
  getContracts(orgId: string = DEFAULT_ORG_ID): Contract[] {
    return this.state.contracts.filter((c) => c.organization_id === orgId);
  }

  getContract(id: string): Contract | undefined {
    return this.state.contracts.find((c) => c.id === id);
  }

  createContract(contract: Contract): Contract {
    this.state.contracts.unshift(contract);
    this.persistState();
    return contract;
  }

  updateContract(id: string, updates: Partial<Contract>): Contract | null {
    const idx = this.state.contracts.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.state.contracts[idx] = {
      ...this.state.contracts[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistState();
    return this.state.contracts[idx];
  }

  deleteContract(id: string): boolean {
    const prevCount = this.state.contracts.length;
    this.state.contracts = this.state.contracts.filter((c) => c.id !== id);
    this.state.clauses = this.state.clauses.filter((c) => c.contract_id !== id);
    this.state.findings = this.state.findings.filter((f) => f.contract_id !== id);
    this.state.redlines = this.state.redlines.filter((r) => r.contract_id !== id);
    this.state.comments = this.state.comments.filter((c) => c.contract_id !== id);
    this.persistState();
    return this.state.contracts.length < prevCount;
  }

  // --- Clauses ---
  getClauses(contractId: string): Clause[] {
    return this.state.clauses
      .filter((c) => c.contract_id === contractId)
      .sort((a, b) => a.order_index - b.order_index);
  }

  saveClauses(clauses: Clause[]): void {
    // remove existing for contract if any
    const contractId = clauses[0]?.contract_id;
    if (contractId) {
      this.state.clauses = this.state.clauses.filter((c) => c.contract_id !== contractId);
    }
    this.state.clauses.push(...clauses);
    this.persistState();
  }

  // --- Playbook Rules ---
  getPlaybookRules(orgId: string = DEFAULT_ORG_ID): PlaybookRule[] {
    return this.state.playbook_rules.filter((r) => r.organization_id === orgId && r.is_active);
  }

  getAllPlaybookRules(orgId: string = DEFAULT_ORG_ID): PlaybookRule[] {
    return this.state.playbook_rules.filter((r) => r.organization_id === orgId);
  }

  getPlaybookRule(id: string): PlaybookRule | undefined {
    return this.state.playbook_rules.find((r) => r.id === id);
  }

  createPlaybookRule(rule: PlaybookRule): PlaybookRule {
    this.state.playbook_rules.push(rule);
    this.persistState();
    return rule;
  }

  updatePlaybookRule(id: string, updates: Partial<PlaybookRule>): PlaybookRule | null {
    const idx = this.state.playbook_rules.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.state.playbook_rules[idx] = {
      ...this.state.playbook_rules[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistState();
    return this.state.playbook_rules[idx];
  }

  deletePlaybookRule(id: string): boolean {
    const prevCount = this.state.playbook_rules.length;
    this.state.playbook_rules = this.state.playbook_rules.filter((r) => r.id !== id);
    this.persistState();
    return this.state.playbook_rules.length < prevCount;
  }

  // --- Findings ---
  getFindings(contractId: string): Finding[] {
    const findings = this.state.findings.filter((f) => f.contract_id === contractId);
    return findings.map((f) => ({
      ...f,
      clause: this.state.clauses.find((c) => c.id === f.clause_id),
      playbook_rule: this.state.playbook_rules.find((r) => r.id === f.playbook_rule_id),
      redline: this.state.redlines.find((r) => r.finding_id === f.id),
    }));
  }

  saveFindings(findings: Finding[]): void {
    const contractId = findings[0]?.contract_id;
    if (contractId) {
      this.state.findings = this.state.findings.filter((f) => f.contract_id !== contractId);
    }
    this.state.findings.push(...findings);
    this.persistState();
  }

  // --- Redlines ---
  getRedlines(contractId: string): Redline[] {
    return this.state.redlines.filter((r) => r.contract_id === contractId);
  }

  getRedline(id: string): Redline | undefined {
    return this.state.redlines.find((r) => r.id === id);
  }

  createRedline(redline: Redline): Redline {
    this.state.redlines.push(redline);
    this.persistState();
    return redline;
  }

  updateRedline(id: string, updates: Partial<Redline>): Redline | null {
    const idx = this.state.redlines.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.state.redlines[idx] = {
      ...this.state.redlines[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persistState();
    return this.state.redlines[idx];
  }

  saveRedlines(redlines: Redline[]): void {
    const contractId = redlines[0]?.contract_id;
    if (contractId) {
      this.state.redlines = this.state.redlines.filter((r) => r.contract_id !== contractId);
    }
    this.state.redlines.push(...redlines);
    this.persistState();
  }

  // --- Comments ---
  getComments(contractId: string): Comment[] {
    return this.state.comments.filter((c) => c.contract_id === contractId);
  }

  createComment(comment: Comment): Comment {
    this.state.comments.push(comment);
    this.persistState();
    return comment;
  }

  // --- Audit Logs ---
  getAuditLogs(orgId: string = DEFAULT_ORG_ID): AuditLog[] {
    return this.state.audit_logs
      .filter((a) => a.organization_id === orgId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createAuditLog(log: AuditLog): AuditLog {
    this.state.audit_logs.unshift(log);
    this.persistState();
    return log;
  }

  // --- Score Snapshots ---
  getScoreSnapshots(contractId: string): ScoreSnapshot[] {
    return this.state.score_snapshots
      .filter((s) => s.contract_id === contractId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  createScoreSnapshot(snapshot: ScoreSnapshot): ScoreSnapshot {
    this.state.score_snapshots.push(snapshot);
    this.persistState();
    return snapshot;
  }

  // --- AI Usage Logs ---
  createAiUsageLog(log: AiUsageLog): AiUsageLog {
    this.state.ai_usage_logs.push(log);
    this.persistState();
    return log;
  }

  // --- Vector Cosine Matching RPC replica ---
  matchPlaybookRules(
    queryEmbedding: number[] | null,
    orgId: string = DEFAULT_ORG_ID,
    matchCount: number = 3,
    minSimilarity: number = 0.25
  ): Array<PlaybookRule & { similarity: number }> {
    const rules = this.getPlaybookRules(orgId);
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return rules.slice(0, matchCount).map((r) => ({ ...r, similarity: 0.5 }));
    }

    const scored = rules.map((rule) => {
      let sim = 0;
      if (rule.embedding && rule.embedding.length === queryEmbedding.length) {
        sim = cosineSimilarity(queryEmbedding, rule.embedding);
      } else {
        // Fallback keyword-based token similarity if embeddings are not yet generated
        sim = keywordSimilarity(rule.title + " " + rule.requirement_text, "");
      }
      return { ...rule, similarity: Math.max(0, Math.min(1, sim)) };
    });

    return scored
      .filter((r) => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, matchCount);
  }
}

// Math helpers for vector cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function keywordSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(textA.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(textB.toLowerCase().split(/\W+/).filter(Boolean));
  let intersect = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) intersect++;
  });
  return intersect / Math.sqrt(wordsA.size * wordsB.size);
}

// Global singleton instance
export const db = new MemoryStore();
