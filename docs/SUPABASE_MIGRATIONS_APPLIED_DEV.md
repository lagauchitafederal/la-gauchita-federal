# Supabase Migrations Applied — Dev

## Project

* Project name: `la-gauchita-federal-dev`
* Region: `sa-east-1` / South America Sao Paulo
* Environment: development
* Execution method: manual execution through Supabase SQL Editor
* GitHub integration from Supabase: not connected
* Supabase CLI: not used

---

## Applied migrations

### 0001_create_catalog_tables.sql

Status: applied successfully.

Purpose:

* Create base catalog tables.
* Enable Row Level Security.
* Add public read policies for active catalog records.
* Grant select access to `anon` and `authenticated` roles.

Tables created:

* `regions`
* `provinces`
* `municipalities`
* `roles`
* `membership_levels`
* `categories`
* `content_types`

Sensitive tables were not created.

The migration does not include:

* users
* profiles
* contents
* ephemerides
* institutions
* media assets
* audit logs
* auth configuration
* storage buckets
* PostGIS

---

### 0002_seed_catalog_tables.sql

Status: applied successfully.

Purpose:

* Insert initial non-sensitive catalog data.
* Use stable technical codes and slugs.
* Avoid real user data or private information.

Seeds applied:

* `regions`: 1
* `provinces`: 1
* `municipalities`: 3
* `roles`: 10
* `membership_levels`: 5
* `categories`: 10
* `content_types`: 10

---

## Verification query result

```txt
regions              1
provinces            1
municipalities       3
roles                10
membership_levels    5
categories           10
content_types        10
```

---

## Security notes

* RLS is enabled on all catalog tables created by migration `0001`.
* Public read policies only allow reading active records.
* No public insert, update or delete policies were created.
* No secret keys were used.
* No service role key was used.
* No `.env.local` file was versioned.

---

## Current limitations

The following items are not implemented yet:

* Auth
* profiles
* user_roles
* contents
* ephemerides
* people
* places
* institutions
* media assets
* storage
* audit logs
* advanced RLS policies

---

## Next recommended step

The next step should be creating the `profiles` and `user_roles` migration only after reviewing the security model again.

Recommended next migration:

```txt
0003_create_profiles_and_user_roles.sql
```

This migration must be handled carefully because it will introduce sensitive user-related tables.

---

### 0003_create_profiles_and_user_roles.sql

Status: applied successfully.

Purpose:

- Create `profiles` table linked to `auth.users`.
- Create `user_roles` table linked to `profiles` and `roles`.
- Enable Row Level Security on both tables.
- Allow authenticated users to read their own profile.
- Allow authenticated users to update only non-sensitive fields of their own profile.
- Allow authenticated users to read only their own assigned roles.
- Prevent anonymous access to `profiles` and `user_roles`.
- Prevent users from assigning roles to themselves.

Tables created:

- `profiles`
- `user_roles`

Security notes:

- RLS is enabled on both tables.
- No public read access was granted.
- No anonymous access was granted.
- No insert, update or delete access was granted for `user_roles`.
- Profile update access is restricted to non-sensitive fields:
  - `display_name`
  - `avatar_url`
  - `province_id`
  - `municipality_id`
- Users cannot update:
  - `auth_user_id`
  - `membership_level_id`
  - `status`
  - `created_at`
  - `updated_at`

Verification result:

```txt
profiles      exists
user_roles    exists
profiles      RLS true
user_roles    RLS true
profiles      0 rows
user_roles    0 rows

---

### 0004_create_institutions_and_members.sql

Status: applied successfully.

Purpose:

- Create `institutions` table.
- Create `institution_members` table.
- Support municipalities, provinces, organisms, schools, libraries, museums, associations, peñas, gastronomic places, cultural centers, media and other participating entities.
- Enable future “Contamos con la participación de...” sections.
- Enable institutional participation and future institutional content loading.
- Enable institutional membership relationships with user profiles.
- Enable Row Level Security on both tables.

Tables created:

- `institutions`
- `institution_members`

Security notes:

- RLS is enabled on both tables.
- Anonymous users can read only active institutions.
- Authenticated users can read only active institutions and institutions created by their own profile.
- Anonymous users cannot read `institution_members`.
- Authenticated users can read only their own institutional memberships.
- No insert, update or delete grants were created for anonymous users.
- No insert, update or delete grants were created for authenticated users.
- No real institution data was inserted.
- No real user data was inserted.

Verification result:

```txt
institutions           exists
institution_members    exists
institutions           RLS true
institution_members    RLS true
institutions           0 rows
institution_members    0 rows

---

### 0005_create_contents.sql

Status: applied successfully.

Purpose:

- Create `contents` table.
- Support articles, news, ephemerides, people profiles, place profiles, teacher resources, magazine articles, institutional content, recognitions and events.
- Link contents with content types, categories, institutions, profiles and territory.
- Enable publication workflows through status and visibility fields.
- Enable featured content.
- Enable date-based content such as ephemerides, agenda and teacher board items.
- Enable Row Level Security.

Table created:

- `contents`

Security notes:

- RLS is enabled on `contents`.
- Anonymous users can read only published, public and already scheduled contents.
- Authenticated users can read published, public and already scheduled contents.
- Authenticated users can read their own contents regardless of status.
- Authenticated users can update only their own contents when status is `draft` or `rejected`.
- Authenticated users cannot publish directly.
- Authenticated users cannot modify:
  - `status`
  - `visibility`
  - `publish_date`
  - `is_featured`
  - `author_profile_id`
  - `institution_id`
  - `content_type_id`
  - `created_at`
  - `updated_at`
- No insert grant was created.
- No delete grant was created.
- No admin policies were created yet.
- No institutional editor policies were created yet.
- No subscriber policies were created yet.

Verification result:

```txt
contents    exists
contents    RLS true
contents    0 rows

---

### 0006_create_media_assets.sql

Status: applied successfully.

Purpose:

- Create `media_assets` table.
- Support images, cover images, galleries, historical photos, PDFs, magazine files, book files, audio files, teacher resources, institutional documents, recognition documents and archive material.
- Link media assets with contents, institutions and uploader profiles.
- Store metadata for future Supabase Storage objects.
- Enable rights management through `rights_status`.
- Enable file visibility control through `visibility`.
- Enable editorial workflow through `status`.
- Enable Row Level Security.

Table created:

- `media_assets`

Security notes:

- RLS is enabled on `media_assets`.
- Anonymous users can read only active, public files with valid rights status.
- Public readable files must have rights status:
  - `owned`
  - `authorized`
  - `public_domain`
  - `licensed`
- Anonymous and authenticated users can read public active files associated with published public contents.
- Authenticated users can read their own uploaded files.
- Authenticated users can update only non-sensitive metadata fields of their own draft or rejected files.
- Authenticated users cannot activate files directly.
- Authenticated users cannot change:
  - `bucket_name`
  - `storage_path`
  - `mime_type`
  - `file_size_bytes`
  - `original_filename`
  - `rights_status`
  - `visibility`
  - `status`
  - `content_id`
  - `institution_id`
  - `uploaded_by_profile_id`
  - `created_at`
  - `updated_at`
- No insert grant was created.
- No delete grant was created.
- No Storage buckets were created.
- No files were uploaded.
- No admin policies were created yet.
- No institutional editor policies were created yet.
- No subscriber policies were created yet.

Verification result:

```txt
media_assets    exists
media_assets    RLS true
media_assets    0 rows

---

### 0007_create_recognitions.sql

Status: applied successfully.

Purpose:

- Create `recognitions` table.
- Support awards, mentions, declarations, endorsements, distinctions, homages, certifications, press references, participations and other institutional recognitions.
- Enable recognitions for Eduardo Ceballos, Revista La Gauchita, Instituto Cultural Andino, La Gauchita Federal, books, albums, institutions, contents, events and other cultural products.
- Link recognitions with institutions, contents and future recognized entities.
- Enable featured recognitions for institutional showcases.
- Enable Row Level Security.

Table created:

- `recognitions`

Security notes:

- RLS is enabled on `recognitions`.
- Anonymous users can read only active and public recognitions.
- Authenticated users can read only active and public recognitions.
- Authenticated users can read their own recognitions.
- Authenticated users can update only non-sensitive fields of their own draft or rejected recognitions.
- Authenticated users cannot activate or publish recognitions directly.
- Authenticated users cannot modify:
  - `slug`
  - `recognition_type`
  - `granting_institution_id`
  - `recognized_entity_type`
  - `recognized_entity_id`
  - `related_content_id`
  - `related_institution_id`
  - `status`
  - `visibility`
  - `is_featured`
  - `sort_order`
  - `created_by_profile_id`
  - `created_at`
  - `updated_at`
- No insert grant was created.
- No delete grant was created.
- No admin policies were created yet.
- No institutional editor policies were created yet.
- No real recognitions were inserted.

Verification result:

```txt
recognitions    exists
recognitions    RLS true
recognitions    0 rows

---

### 0008_create_audit_logs.sql

Status: applied successfully.

Purpose:

- Create `audit_logs` table.
- Prepare the system for future audit and traceability workflows.
- Support tracking of sensitive changes across profiles, roles, institutions, contents, media assets and recognitions.
- Enable future recording of actor, action, entity, previous data, new data, reason, IP address and user agent.
- Enable Row Level Security with a fully restrictive initial posture.

Table created:

- `audit_logs`

Security notes:

- RLS is enabled on `audit_logs`.
- No public read access was granted.
- No authenticated read access was granted.
- No insert grant was created.
- No update grant was created.
- No delete grant was created.
- No permissive RLS policies were created.
- Anonymous users cannot access audit logs.
- Authenticated users cannot access audit logs directly.
- Audit logs are reserved for future internal functions, backend services or explicit administrative policies.
- No triggers were created yet.
- No SQL functions were created yet.
- No real logs were inserted.

Verification result:

```txt
audit_logs    exists
audit_logs    RLS true
audit_logs    0 rows

---

### 0009_create_permission_helpers.sql

Status: applied successfully.

Purpose:

- Create minimal permission helper functions.
- Prepare the database for future RLS policies based on roles and permissions.
- Centralize role checks using `profiles`, `user_roles` and `roles`.
- Avoid duplicating role-checking logic across multiple policies.
- Prepare controlled access to administrative capabilities and audit logs.

Functions created:

- `current_profile_id()`
- `has_role(role_code text)`
- `has_any_role(role_codes text[])`
- `is_super_admin()`
- `is_general_admin()`
- `is_admin()`
- `can_read_audit_logs()`

Security notes:

- Functions are read-only helpers.
- Functions use `SECURITY DEFINER`.
- Functions define explicit `search_path`.
- Functions do not return role lists.
- Functions do not expose sensitive profile or role data.
- Functions only return `uuid` or `boolean`.
- `current_profile_id()` only returns a profile when the profile status is `active`.
- Suspended, inactive or deleted profiles do not receive permissions through these helpers.
- Execute privileges were revoked from `public`.
- Execute privileges were granted only to `authenticated`.
- No execute privilege was granted to `anon`.
- No policies were modified.
- No tables were modified.
- No triggers were created.
- No write functions were created.
- No seed data was inserted.

Verification result:

```txt
can_read_audit_logs     exists
current_profile_id      exists
has_any_role            exists
has_role                exists
is_admin                exists
is_general_admin        exists
is_super_admin          exists

---

### 0010_update_audit_logs_admin_policy.sql

Status: applied successfully.

Purpose:

- Add controlled administrative read access to `audit_logs`.
- Use the existing permission helper `public.can_read_audit_logs()`.
- Allow only authorized administrators to read audit logs.
- Keep audit logs closed to anonymous users.
- Keep audit logs closed for direct insert, update and delete operations.

Policy created:

- `select_audit_logs_admins`

Security notes:

- The policy applies only to `authenticated`.
- The policy allows `SELECT` only when `public.can_read_audit_logs()` returns `true`.
- `public.can_read_audit_logs()` currently depends on `public.is_admin()`.
- `public.is_admin()` currently allows:
  - `super_admin`
  - `general_admin`
- No access was granted to `anon`.
- No insert grant was created.
- No update grant was created.
- No delete grant was created.
- No functions were created.
- No triggers were created.
- No real logs were inserted.

Verification result:

```txt
select_audit_logs_admins    SELECT    {authenticated}
authenticated               SELECT
anon                        no grants