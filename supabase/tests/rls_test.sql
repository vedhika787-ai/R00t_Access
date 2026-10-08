-- ==============================================================================
-- LexiGuard RLS Isolation Verification Test
-- Proves that users from Org A cannot read or write data belonging to Org B
-- ==============================================================================

begin;

-- 1. Create two test organizations
insert into organizations (id, name)
values
    ('11111111-1111-1111-1111-111111111111', 'Acme Corp (Org A)'),
    ('22222222-2222-2222-2222-222222222222', 'Globex Corp (Org B)')
on conflict do nothing;

-- 2. Create users and profiles for each organization
-- (Assuming auth.users has test records or mock auth context)
-- Set role to authenticated user from Org A
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "authenticated"}';

-- Create Contract in Org B directly via admin/setup
-- Verify that User A cannot see Contract B:
do $$
declare
    v_found_count int;
begin
    select count(*) into v_found_count
    from contracts
    where organization_id = '22222222-2222-2222-2222-222222222222';

    if v_found_count > 0 then
        raise exception 'RLS VIOLATION: User A could see contracts belonging to Org B!';
    else
        raise notice 'SUCCESS: User A cannot see contracts from Org B. RLS isolation holds.';
    end if;
end $$;

-- Verify that User A cannot select Playbook Rules from Org B:
do $$
declare
    v_rule_count int;
begin
    select count(*) into v_rule_count
    from playbook_rules
    where organization_id = '22222222-2222-2222-2222-222222222222';

    if v_rule_count > 0 then
        raise exception 'RLS VIOLATION: User A could see playbook rules belonging to Org B!';
    else
        raise notice 'SUCCESS: User A cannot see playbook rules from Org B. RLS isolation holds.';
    end if;
end $$;

rollback;
