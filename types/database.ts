export type UserRole = "admin" | "reviewer" | "viewer";

export type ContractStatus =
  | "uploading"
  | "processing"
  | "analyzed"
  | "in_review"
  | "approved"
  | "rejected"
  | "failed";

export type ContractRecommendation = "sign" | "negotiate" | "reject";

export type RuleCategory =
  | "liability"
  | "indemnification"
  | "data_privacy"
  | "payment_penalties"
  | "termination"
  | "ip"
  | "governing_law"
  | "confidentiality"
  | "sla"
  | "insurance"
  | "other";

export type RuleSeverity = "critical" | "high" | "medium" | "low" | "none";

export type FindingType = "deviation" | "missing_clause" | "compliant";

export type NegotiationPriority = "must_fix" | "should_fix" | "nice_to_have";

export type RedlineStatus = "pending" | "accepted" | "rejected" | "edited";

export type ScoreTrigger = "initial" | "redline_change";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  organization_id: string;
  uploaded_by: string | null;
  vendor_name: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: ContractStatus;
  risk_score_original: number;
  risk_score_current: number;
  recommendation: ContractRecommendation;
  processing_ms: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Clause {
  id: string;
  contract_id: string;
  order_index: number;
  clause_number: string | null;
  heading: string | null;
  text: string;
  page: number;
  char_start: number;
  char_end: number;
  embedding: number[] | null;
  category: RuleCategory | string | null;
  created_at: string;
}

export interface PlaybookRule {
  id: string;
  organization_id: string;
  title: string;
  category: RuleCategory;
  requirement_text: string;
  ideal_clause_text: string;
  acceptable_fallback_text: string;
  walk_away_text: string;
  severity_default: RuleSeverity;
  weight: number;
  is_mandatory: boolean;
  is_active: boolean;
  regulation_tags: string[];
  embedding?: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface RiskySpan {
  start?: number;
  end?: number;
  quote: string;
  text?: string;
  reason: string;
}

export interface Finding {
  id: string;
  contract_id: string;
  clause_id: string | null;
  playbook_rule_id: string | null;
  finding_type: FindingType;
  severity: RuleSeverity;
  similarity: number;
  deviation_summary: string;
  playbook_requirement_excerpt: string;
  vendor_text_excerpt: string;
  risky_spans: RiskySpan[];
  plain_english: string;
  negotiation_priority: NegotiationPriority;
  regulation_flags: string[];
  suggested_clause: string;
  fallback_clause: string;
  walk_away_note: string;
  points: number;
  created_at: string;
  // Join fields for convenience
  clause?: Clause;
  playbook_rule?: PlaybookRule;
  redline?: Redline;
}

export interface Redline {
  id: string;
  finding_id: string;
  contract_id: string;
  original_text: string;
  proposed_text: string;
  final_text: string;
  status: RedlineStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  contract_id: string;
  clause_id: string | null;
  user_id: string | null;
  body: string;
  created_at: string;
  user_name?: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  contract_id: string | null;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  created_at: string;
}

export interface ScoreSnapshot {
  id: string;
  contract_id: string;
  score: number;
  breakdown: Record<string, unknown>;
  trigger: ScoreTrigger;
  created_at: string;
}

export interface AiUsageLog {
  id: string;
  user_id: string | null;
  contract_id: string | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  purpose: string;
  created_at: string;
}
