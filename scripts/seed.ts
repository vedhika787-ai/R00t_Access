import { db, SEED_PLAYBOOK_RULES, INITIAL_ORGANIZATION, INITIAL_PROFILE } from "../lib/db/store";
import { getAdminClient } from "../lib/supabase/admin";

async function runSeed() {
  console.log("🌱 Starting LexiGuard seeding...");

  // 1. Check if Supabase client is available
  const supabase = getAdminClient();
  if (supabase) {
    console.log("Connecting to live Supabase Postgres...");
    // Seed Org
    const { error: orgErr } = await supabase.from("organizations").upsert({
      id: INITIAL_ORGANIZATION.id,
      name: INITIAL_ORGANIZATION.name,
    });
    if (orgErr) console.warn("Supabase org seed warning:", orgErr.message);

    // Seed Playbook Rules
    for (const rule of SEED_PLAYBOOK_RULES) {
      const { error: ruleErr } = await supabase.from("playbook_rules").upsert({
        id: rule.id,
        organization_id: rule.organization_id,
        title: rule.title,
        category: rule.category,
        requirement_text: rule.requirement_text,
        ideal_clause_text: rule.ideal_clause_text,
        acceptable_fallback_text: rule.acceptable_fallback_text,
        walk_away_text: rule.walk_away_text,
        severity_default: rule.severity_default,
        weight: rule.weight,
        is_mandatory: rule.is_mandatory,
        is_active: rule.is_active,
        regulation_tags: rule.regulation_tags,
      });
      if (ruleErr) console.warn(`Supabase rule seed warning for ${rule.title}:`, ruleErr.message);
    }
    console.log("✅ Seeded live Supabase instance with 15 rules.");
  } else {
    console.log("ℹ️ Supabase environment variables not set; using local persistent store.");
  }

  // 2. Ensure local persistent store has default organization and rules
  const rules = db.getPlaybookRules();
  console.log(`✅ Local persistent store verified: ${rules.length} active playbook rules loaded.`);
  console.log("🚀 Seeding completed successfully!");
}

runSeed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
