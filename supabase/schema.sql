-- ============================================================
-- Nid — schéma Supabase
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- FOYERS : un foyer = votre espace partagé (toi + ta copine +
-- toute personne ajoutée). Toutes les autres tables s'y rattachent.
-- ------------------------------------------------------------
create table if not exists foyers (
  id uuid primary key default gen_random_uuid(),
  nom text not null default 'Notre déménagement',
  couleur_accent text not null default '#D9A441',
  code text not null unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MEMBRES : deux usages —
--  1) une personne qui se connecte réellement (user_id renseigné)
--  2) un simple "label" pour assigner des tâches/dépenses/meubles
--     à quelqu'un qui n'a pas de compte (user_id reste NULL)
-- ------------------------------------------------------------
create table if not exists membres (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references foyers(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  prenom text not null,
  couleur text not null default '#5C7F8C',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TACHES
-- ------------------------------------------------------------
create table if not exists taches (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references foyers(id) on delete cascade,
  parent_tache_id uuid references taches(id) on delete cascade,
  assigne_id uuid references membres(id) on delete set null,
  titre text not null,
  phase text not null default 'avant' check (phase in ('avant', 'pendant', 'apres')),
  echeance date,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'fait')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CARTONS
-- ------------------------------------------------------------
create table if not exists cartons (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references foyers(id) on delete cascade,
  numero int,
  piece text not null,
  description text,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'fait')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- DEPENSES
-- ------------------------------------------------------------
create table if not exists depenses (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references foyers(id) on delete cascade,
  paye_par_id uuid references membres(id) on delete set null,
  categorie text not null,
  montant_prevu numeric(10, 2),
  montant_reel numeric(10, 2),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- DEMARCHES
-- ------------------------------------------------------------
create table if not exists demarches (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references foyers(id) on delete cascade,
  titre text not null,
  categorie text,
  organisme text,
  echeance date,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'fait')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MEUBLES (volume calculé automatiquement, en m3)
-- ------------------------------------------------------------
create table if not exists meubles (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references foyers(id) on delete cascade,
  proprietaire_id uuid references membres(id) on delete set null,
  nom text not null,
  longueur_cm numeric(6, 1) not null,
  largeur_cm numeric(6, 1) not null,
  hauteur_cm numeric(6, 1) not null,
  volume_m3 numeric generated always as (
    (longueur_cm * largeur_cm * hauteur_cm) / 1000000.0
  ) stored,
  piece_destination text,
  statut text not null default 'on_garde' check (statut in ('on_garde', 'a_vendre', 'a_acheter')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security : chaque foyer ne voit que ses propres données.
-- ============================================================

alter table foyers enable row level security;
alter table membres enable row level security;
alter table taches enable row level security;
alter table cartons enable row level security;
alter table depenses enable row level security;
alter table demarches enable row level security;
alter table meubles enable row level security;

-- --- foyers ---
create policy "voir son foyer" on foyers for select
  using (id in (select foyer_id from membres where user_id = auth.uid()));

create policy "créer un foyer" on foyers for insert
  to authenticated with check (true);

create policy "modifier son foyer" on foyers for update
  using (id in (select foyer_id from membres where user_id = auth.uid()));

-- --- membres ---
create policy "voir les membres de son foyer" on membres for select
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

create policy "ajouter un membre à son foyer (ou se rattacher soi-même)" on membres for insert
  to authenticated with check (
    user_id = auth.uid()
    or foyer_id in (select foyer_id from membres where user_id = auth.uid())
  );

create policy "modifier un membre de son foyer" on membres for update
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

create policy "retirer un membre de son foyer" on membres for delete
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

-- --- helper générique pour les 5 tables de données ---
-- (mêmes règles pour taches, cartons, depenses, demarches, meubles :
--  select/insert/update/delete uniquement sur son propre foyer)

create policy "acces taches" on taches for all
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()))
  with check (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

create policy "acces cartons" on cartons for all
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()))
  with check (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

create policy "acces depenses" on depenses for all
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()))
  with check (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

create policy "acces demarches" on demarches for all
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()))
  with check (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

create policy "acces meubles" on meubles for all
  using (foyer_id in (select foyer_id from membres where user_id = auth.uid()))
  with check (foyer_id in (select foyer_id from membres where user_id = auth.uid()));

-- ============================================================
-- Fonction utilitaire : retrouver l'id d'un foyer à partir de
-- son code d'invitation, sans exposer le reste de la table foyers
-- (utilisée par l'écran "Rejoindre un foyer existant").
-- ============================================================
create or replace function foyer_id_from_code(p_code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from foyers where code = p_code;
$$;

grant execute on function foyer_id_from_code(text) to authenticated;

-- ============================================================
-- Activer le temps réel sur les tables de données
-- (Database > Replication dans le tableau de bord Supabase,
--  ou décommenter les lignes ci-dessous)
-- ============================================================
-- alter publication supabase_realtime add table taches;
-- alter publication supabase_realtime add table cartons;
-- alter publication supabase_realtime add table depenses;
-- alter publication supabase_realtime add table demarches;
-- alter publication supabase_realtime add table meubles;
-- alter publication supabase_realtime add table membres;
