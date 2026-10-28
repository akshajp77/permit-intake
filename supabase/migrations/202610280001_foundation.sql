-- Day 1 foundation. Apply once to a new Supabase development project.
begin;
create table public.organizations(id uuid primary key default gen_random_uuid(), name text not null, mode text not null default 'demo' check(mode in ('demo','pilot')), created_at timestamptz not null default now());
create table public.memberships(org_id uuid not null references public.organizations(id), user_id uuid not null references auth.users(id) on delete cascade, role text not null check(role in ('admin','reviewer')), primary key(org_id,user_id));
create table public.projects(id uuid primary key default gen_random_uuid(),org_id uuid not null references public.organizations(id),name text not null check(length(name) between 1 and 120), external_reference text not null check(length(external_reference) between 1 and 60),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),unique(org_id,id),unique(org_id,external_reference));
create table public.submissions(id uuid primary key default gen_random_uuid(),org_id uuid not null,project_id uuid not null,version integer not null check(version>0),scope_facts jsonb not null default '{}',created_at timestamptz not null default now(),unique(org_id,id),unique(project_id,version),foreign key(org_id,project_id) references public.projects(org_id,id));
create table public.documents(id uuid primary key default gen_random_uuid(),org_id uuid not null,submission_id uuid not null,storage_path text not null unique,page_count integer check(page_count>0),validation_state text not null default 'pending' check(validation_state in ('pending','ready','rejected')),unique(org_id,id),foreign key(org_id,submission_id) references public.submissions(org_id,id));
create table public.review_runs(id uuid primary key default gen_random_uuid(),org_id uuid not null,submission_id uuid not null,status text not null default 'queued' check(status in ('queued','extracting','checking','ready','failed')),created_at timestamptz not null default now(),unique(org_id,id),foreign key(org_id,submission_id) references public.submissions(org_id,id));
-- SECURITY DEFINER avoids recursive membership RLS. No user-controlled org creation.
create function public.is_org_member(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.memberships where org_id=target and user_id=(select auth.uid())); $$;
revoke all on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.projects enable row level security;
alter table public.submissions enable row level security;
alter table public.documents enable row level security;
alter table public.review_runs enable row level security;
create policy org_read on public.organizations for select to authenticated using(public.is_org_member(id));
create policy membership_read on public.memberships for select to authenticated using(user_id=(select auth.uid()));
create policy project_read on public.projects for select to authenticated using(public.is_org_member(org_id));
create policy project_create on public.projects for insert to authenticated with check(public.is_org_member(org_id) and created_by=(select auth.uid()));
-- Later stages remain read-only to clients until their validated server workflows ship.
create policy submission_read on public.submissions for select to authenticated using(public.is_org_member(org_id));
create policy document_read on public.documents for select to authenticated using(public.is_org_member(org_id));
create policy review_read on public.review_runs for select to authenticated using(public.is_org_member(org_id));
revoke all on public.organizations,public.memberships,public.projects,public.submissions,public.documents,public.review_runs from anon,authenticated;
grant select on public.organizations,public.memberships,public.projects,public.submissions,public.documents,public.review_runs to authenticated;
grant insert on public.projects to authenticated;
create function public.bootstrap_workspace() returns trigger language plpgsql security definer set search_path='' as $$
declare new_org uuid;
begin
 insert into public.organizations(name) values('My demo workspace') returning id into new_org;
 insert into public.memberships(org_id,user_id,role) values(new_org,new.id,'admin');
 return new;
end; $$;
revoke all on function public.bootstrap_workspace() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.bootstrap_workspace();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('permit-documents','permit-documents',false,26214400,array['application/pdf']);
-- Reads require a validated metadata row; uploads are deliberately not enabled on Day 1.
create policy permit_document_read on storage.objects for select to authenticated using(bucket_id='permit-documents' and exists(select 1 from public.documents d where d.storage_path=name and public.is_org_member(d.org_id) and d.validation_state='ready'));
commit;
