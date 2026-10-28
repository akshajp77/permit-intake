-- Run only in development after the migration. Everything rolls back.
begin;
insert into auth.users(id,email) values('10000000-0000-0000-0000-000000000001','isolation-a@example.invalid'),('10000000-0000-0000-0000-000000000002','isolation-b@example.invalid');
insert into public.projects(id,org_id,name,external_reference,created_by)
select '20000000-0000-0000-0000-000000000001',org_id,'Tenant B project','TEST-B',user_id from public.memberships where user_id='10000000-0000-0000-0000-000000000002';
-- Store B org ID before switching role so the attack knows the real identifier.
select set_config('test.b_org',(select org_id::text from public.memberships where user_id='10000000-0000-0000-0000-000000000002'),true);
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
 if exists(select 1 from public.projects where id='20000000-0000-0000-0000-000000000001') then raise exception 'Cross-tenant read allowed'; end if;
 if (select count(*) from public.memberships) != 1 then raise exception 'Membership leak'; end if;
 insert into public.projects(org_id,name,external_reference,created_by) select org_id,'Own project','TEST-A','10000000-0000-0000-0000-000000000001' from public.memberships;
 begin
 insert into public.projects(org_id,name,external_reference,created_by) values(current_setting('test.b_org')::uuid,'Forged project','ATTACK','10000000-0000-0000-0000-000000000001');
 raise exception 'Cross-tenant insert allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
do $$ begin
 begin
 insert into public.submissions(org_id,project_id,version) select org_id,'20000000-0000-0000-0000-000000000001',1 from public.memberships where user_id='10000000-0000-0000-0000-000000000001';
 raise exception 'Cross-tenant foreign key allowed';
 exception when foreign_key_violation then null;
 end;
end $$;
rollback;
