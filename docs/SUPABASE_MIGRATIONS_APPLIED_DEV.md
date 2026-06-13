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
