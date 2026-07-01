create table if not exists members (
  id text primary key,
  slug text not null unique,
  display_name text not null,
  accent_key text not null,
  is_active integer not null default 1,
  created_at text not null
);

create table if not exists member_credentials (
  member_id text primary key references members(id),
  passcode_hash text not null,
  created_at text not null,
  rotated_at text
);

create table if not exists sessions (
  id text primary key,
  member_id text not null references members(id),
  token_hash text not null unique,
  created_at text not null,
  expires_at text not null,
  last_seen_at text not null,
  revoked_at text
);

create table if not exists activities (
  id text primary key,
  title text not null,
  activity_type text not null,
  activity_date text not null,
  location text not null,
  notes text,
  created_by_member_id text not null references members(id),
  created_at text not null,
  updated_at text not null
);

create table if not exists activity_participants (
  activity_id text not null references activities(id),
  member_id text not null references members(id),
  primary key (activity_id, member_id)
);

create table if not exists activity_scores (
  id text primary key,
  activity_id text not null references activities(id),
  member_id text not null references members(id),
  score_delta real not null,
  rank_order integer not null,
  is_winner integer not null default 0
);

create table if not exists activity_settlements (
  id text primary key,
  activity_id text not null references activities(id),
  from_member_id text references members(id),
  to_member_id text references members(id),
  amount real not null,
  note text
);

create table if not exists comments (
  id text primary key,
  activity_id text not null references activities(id),
  member_id text not null references members(id),
  body text not null,
  created_at text not null
);

create table if not exists attachments (
  id text primary key,
  activity_id text not null references activities(id),
  uploaded_by_member_id text not null references members(id),
  r2_object_key text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size integer not null,
  attachment_kind text not null,
  created_at text not null
);
