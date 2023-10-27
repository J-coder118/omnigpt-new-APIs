create table messages (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp default now(),
  prompt text,
  chat uuid references chats (id),
  owner uuid references profiles (id),
  embedding public.vector(1536),
  token_size integer
);

