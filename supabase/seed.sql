-- ==============================================================================
-- LexiGuard Default Playbook Rules and Demo Seed Data
-- ==============================================================================

-- 1. Create Default Organization
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'LexiGuard Legal Enterprise Demo')
on conflict (id) do nothing;

-- 2. Insert Default Playbook Rules (15 Enterprise Legal Standards)
insert into playbook_rules (
    id, organization_id, title, category, requirement_text,
    ideal_clause_text, acceptable_fallback_text, walk_away_text,
    severity_default, weight, is_mandatory, is_active, regulation_tags
)
values
(
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Limitation of Liability Cap & Exclusions',
    'liability',
    'Total liability of either party shall be capped at fees paid or payable by Customer in the preceding twelve (12) months. Neither party shall be subject to uncapped or unlimited liability except for IP infringement and gross negligence.',
    'Except for liabilities arising from a breach of confidentiality, IP indemnification, or willful misconduct, in no event shall either party''s aggregate liability exceed the total fees paid or payable by Customer in the twelve (12) months preceding the incident.',
    'In no event shall either party''s total liability exceed two times (2x) the fees paid in the preceding twelve (12) months, or a mutually agreed fixed amount.',
    'Vendor insists on unlimited liability for Customer or disclaims all liability for its own breaches while holding Customer to uncapped indemnity.',
    'critical', 5, true, true,
    array['Commercial Risk', 'Enterprise Governance']
),
(
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Mutual Indemnification Requirement',
    'indemnification',
    'Indemnification obligations must be strictly mutual. The vendor must defend and indemnify Customer against third-party claims arising from IP infringement, data breaches, or vendor negligence. No unilateral indemnification where Customer indemnifies vendor without reciprocal protection.',
    'Vendor shall defend, indemnify, and hold harmless Customer and its officers, directors, and employees from and against any third-party claims, damages, liabilities, costs, and expenses (including reasonable attorneys'' fees) arising out of or related to (a) any allegation that the Services infringe any intellectual property right, (b) Vendor''s breach of data privacy or confidentiality obligations, or (c) Vendor''s gross negligence or willful misconduct.',
    'Vendor agrees to indemnify Customer for third-party IP infringement claims and material breaches of data security obligations.',
    'Customer indemnifies vendor for use of services while vendor provides zero indemnity for vendor IP infringement or data breaches.',
    'critical', 5, true, true,
    array['Risk Allocation', 'Third-Party Liability']
),
(
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Indemnity Carve-outs & Gross Negligence',
    'indemnification',
    'Vendor indemnity must not have broad carve-outs that eviscerate protection. Vendor shall not exclude liability for gross negligence, willful misconduct, or failure to follow reasonable technical instructions.',
    'Vendor''s indemnity obligations shall not be subject to any contractual liability cap, and shall not be excused except solely to the extent Customer has materially modified the Services without authorization.',
    'Vendor indemnity applies without financial cap for IP infringement, and subject to a separate super-cap of 3x annual fees for data breach indemnity.',
    'Vendor subjects IP indemnity to the general liability cap or completely carves out subcontractor actions.',
    'high', 4, false, true,
    array['Risk Allocation']
),
(
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Data Protection & 72-Hour Breach Notification',
    'data_privacy',
    'Vendor must execute a Data Processing Addendum (DPA) compliant with DPDP Act 2023 and GDPR. Vendor must notify Customer in writing within 72 hours of becoming aware of any confirmed or suspected personal data breach or security incident.',
    'Vendor shall process Customer Personal Data strictly in accordance with Customer''s instructions, maintain robust technical and organizational security measures, comply with the Digital Personal Data Protection Act 2023 (DPDP) and GDPR, and notify Customer in writing within seventy-two (72) hours of discovering any security incident or unauthorized access.',
    'Vendor agrees to maintain reasonable security practices under the IT Act 2000 and notify Customer of confirmed security breaches without undue delay, not exceeding five (5) business days.',
    'Vendor disclaims responsibility for data security or offers no committed incident notification timeframe.',
    'critical', 5, true, true,
    array['DPDP Act 2023', 'GDPR', 'IT Act 2000']
),
(
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Sub-processor Approval & Cross-Border Data Transfer',
    'data_privacy',
    'Vendor must obtain prior written consent before engaging new sub-processors or transferring Customer Personal Data across international borders. Customer reserves the right to object to any new sub-processor on data protection grounds.',
    'Vendor shall not engage any sub-processor or transfer Customer Data to any third country without prior written authorization from Customer. Customer shall have thirty (30) days to object to any proposed sub-processor, upon which Customer may terminate without penalty.',
    'Vendor shall maintain an updated public list of sub-processors and provide at least thirty (30) days notice prior to changes, allowing Customer to object.',
    'Vendor may engage arbitrary sub-processors without notification or consent and transfer data globally without restrictions.',
    'high', 4, false, true,
    array['DPDP Act 2023', 'Cross-Border Compliance']
),
(
    '00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'No Silent Auto-Renewal Without Notice',
    'termination',
    'Contract must not automatically renew indefinitely without clear advance written reminder. Minimum notice requirement for non-renewal must be at least sixty (60) days, not shorter than thirty (30) days.',
    'This Agreement shall continue for the Initial Term and shall only renew upon mutual written agreement of the parties, or subject to Vendor providing a written renewal notice at least sixty (60) days prior to expiration of the current term.',
    'Agreement auto-renews for successive 1-year terms unless either party gives written notice of non-renewal at least thirty (30) days prior to renewal date.',
    'Agreement auto-renews for multi-year terms with vendor requiring 180+ days advance notice or unilateral price escalations upon renewal.',
    'medium', 3, false, true,
    array['Procurement Governance', 'Commercial Terms']
),
(
    '00000000-0000-0000-0001-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'Customer Termination for Convenience',
    'termination',
    'Customer must have the right to terminate the contract for convenience upon thirty (30) days written notice without penalty, and receive a pro-rata refund of any prepaid, unearned fees.',
    'Customer may terminate this Agreement or any Order Form for convenience at any time upon thirty (30) days written notice to Vendor, in which case Vendor shall refund to Customer any pre-paid, unearned fees on a pro-rata basis.',
    'Customer may terminate for convenience upon sixty (60) days written notice after the completion of the first year of the term.',
    'Agreement is non-cancellable under any circumstance with zero termination for convenience and no refunds.',
    'high', 4, false, true,
    array['Exit Rights', 'Commercial Flexibility']
),
(
    '00000000-0000-0000-0001-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'Payment Terms Net 45 & Reasonable Late Fees',
    'payment_penalties',
    'Payment terms must be at least Net 45 or Net 30 from invoice receipt. Late payment interest must not exceed 1% per month (or statutory limit). No acceleration clauses or automatic suspension of services without 15 days cure notice.',
    'Customer shall pay undisputed invoices within forty-five (45) days of receipt. Late payments shall accrue interest at 1% per month or the maximum rate permitted by law, whichever is less. Vendor shall provide at least fifteen (15) days written notice prior to suspending services for non-payment.',
    'Payment terms Net 30 days. Late fees capped at 1.5% per month. Suspension requires at least ten (10) business days written cure notice.',
    'Vendor demands immediate payment within 7 days, 5%+ monthly late fees, or immediate unilateral service termination upon minor billing disputes.',
    'medium', 3, false, true,
    array['Financial Controls']
),
(
    '00000000-0000-0000-0001-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'Customer Ownership of IP & Customer Data',
    'ip',
    'Customer retains sole and exclusive ownership of all Customer Data, Confidential Information, and any custom work product or deliverables created specifically for Customer.',
    'As between the parties, Customer owns all right, title, and interest (including all intellectual property rights) in and to Customer Data and all custom deliverables developed under this Agreement. Vendor assigns all such rights to Customer upon creation.',
    'Customer owns Customer Data and custom deliverables, while Vendor retains ownership of pre-existing background IP and grants Customer a perpetual, royalty-free license to use deliverables.',
    'Vendor claims ownership or broad commercial licensing rights over Customer Data, proprietary datasets, or custom developed workflows.',
    'high', 5, true, true,
    array['Intellectual Property', 'Data Ownership']
),
(
    '00000000-0000-0000-0001-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Governing Law & Neutral Dispute Resolution',
    'governing_law',
    'Governing law must be India (or Singapore/Delaware for international cross-border agreements) with arbitration seated in a neutral commercial hub under standard arbitration rules.',
    'This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in New Delhi, India, in accordance with the Arbitration and Conciliation Act, 1996.',
    'Governing law shall be Singapore or England & Wales with arbitration under SIAC or LCIA rules.',
    'Vendor specifies obscure foreign jurisdiction with no arbitration mechanism, forcing costly overseas litigation.',
    'medium', 3, false, true,
    array['Jurisdiction', 'Arbitration']
),
(
    '00000000-0000-0000-0001-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'Mutual Confidentiality & Survival Period',
    'confidentiality',
    'Confidentiality obligations must be strictly mutual and survive for at least five (5) years following agreement termination, and indefinitely for trade secrets and Customer Data.',
    'Each party agrees to safeguard the Confidential Information of the other party using at least the same degree of care it uses for its own confidential data, but not less than reasonable care. These obligations shall survive for five (5) years after expiration or termination, and indefinitely for Customer Data and trade secrets.',
    'Mutual confidentiality with survival period of three (3) years post termination.',
    'One-sided confidentiality protecting only the Vendor, or confidentiality obligations expiring upon contract termination.',
    'medium', 3, false, true,
    array['Confidentiality', 'Information Security']
),
(
    '00000000-0000-0000-0001-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'SLA Commitment & Meaningful Service Credits',
    'sla',
    'Vendor must commit to at least 99.5% service uptime with defined service credits for downtime. Repeated SLA failures must grant Customer the right to terminate for cause with full refund of prepaid fees.',
    'Vendor warrants that the Services shall maintain at least 99.9% monthly availability. In the event of failure to meet this availability, Vendor shall issue service credits ranging from 10% to 50% of monthly fees. Sustained downtime below 99.0% across two consecutive months shall entitle Customer to terminate for cause without penalty.',
    'Vendor commits to 99.5% uptime with credits up to 20% of monthly fees.',
    'No uptime SLA commitment or credits limited to token amounts with no termination right for chronic downtime.',
    'medium', 4, true, true,
    array['Service Levels', 'Operational Continuity']
),
(
    '00000000-0000-0000-0001-000000000013',
    '00000000-0000-0000-0000-000000000001',
    'Adequate Commercial & Cyber Insurance Coverage',
    'insurance',
    'Vendor must maintain comprehensive general liability, commercial auto, workers compensation, and cyber liability insurance (minimum $5M / INR equivalent).',
    'Vendor shall at its own expense maintain Commercial General Liability insurance ($2,000,000 per occurrence), Professional Liability / E&O insurance ($5,000,000 aggregate), and Cyber & Privacy Liability insurance ($5,000,000 aggregate) with reputable insurers.',
    'Vendor maintains General Liability ($1M) and Cyber Liability ($2M) with certificate provided upon request.',
    'Vendor refuses to maintain cyber liability insurance or refuses to provide proof of certificate of insurance.',
    'low', 2, false, true,
    array['Enterprise Insurance']
),
(
    '00000000-0000-0000-0001-000000000014',
    '00000000-0000-0000-0000-000000000001',
    'Balanced Force Majeure with Termination Threshold',
    'other',
    'Force majeure clause must be mutual, exclude economic hardship and non-payment, and permit either party to terminate if the force majeure event persists beyond thirty (30) days.',
    'Neither party shall be liable for failure to perform due to unforeseen events beyond reasonable control (acts of God, natural disasters, war). If a force majeure event continues for more than thirty (30) days, either party may terminate the Agreement immediately upon written notice.',
    'Force majeure clause mutual with sixty (60) days threshold for termination.',
    'Unilateral force majeure protecting only vendor, or force majeure without time limit preventing Customer from seeking alternative services.',
    'low', 2, false, true,
    array['Commercial Terms']
),
(
    '00000000-0000-0000-0001-000000000015',
    '00000000-0000-0000-0000-000000000001',
    'Audit Rights & Security Verification',
    'other',
    'Customer or its designated independent auditor must have the right to audit vendor compliance with security, data protection, and billing terms once annually upon reasonable advance notice.',
    'Upon reasonable prior written notice, Customer or its independent certified auditor may inspect and audit Vendor''s operational facilities, security practices, and records relating to Customer Data and billing during normal business hours to verify compliance.',
    'Vendor agrees to provide annual SOC 2 Type II reports and ISO 27001 certifications in lieu of on-site audits, plus third-party pen test summaries.',
    'Vendor refuses any third-party audit, provides no SOC 2 / compliance certifications, and rejects verification of security controls.',
    'medium', 3, false, true,
    array['Security Compliance', 'Vendor Due Diligence']
)
on conflict (id) do nothing;
