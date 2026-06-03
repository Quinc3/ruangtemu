create table public.dresscode_palette (
  id integer not null default 1,
  is_active boolean null default false,
  color1 text null default '#FF4D8B'::text,
  color2 text null default '#1A3A3A'::text,
  color3 text null default '#B8A4ED'::text,
  color4 text null default '#FFB084'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint dresscode_palette_pkey primary key (id),
  constraint dresscode_palette_id_check check ((id = 1))
) TABLESPACE pg_default;