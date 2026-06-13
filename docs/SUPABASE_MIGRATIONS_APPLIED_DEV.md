\# Supabase Migrations Applied — Dev



\## Project



\- Project name: `la-gauchita-federal-dev`

\- Region: `sa-east-1` / South America Sao Paulo

\- Environment: development

\- Execution method: manual execution through Supabase SQL Editor

\- GitHub integration from Supabase: not connected

\- Supabase CLI: not used



\---



\## Applied migrations



\### 0001\_create\_catalog\_tables.sql



Status: applied successfully.



Purpose:



\- Create base catalog tables.

\- Enable Row Level Security.

\- Add public read policies for active catalog records.

\- Grant select access to `anon` and `authenticated` roles.



Tables created:



\- `regions`

\- `provinces`

\- `municipalities`

\- `roles`

\- `membership\_levels`

\- `categories`

\- `content\_types`



Sensitive tables were not created.



The migration does not include:



\- users

\- profiles

\- contents

\- ephemerides

\- institutions

\- media assets

\- audit logs

\- auth configuration

\- storage buckets

\- PostGIS



\---



\### 0002\_seed\_catalog\_tables.sql



Status: applied successfully.



Purpose:



\- Insert initial non-sensitive catalog data.

\- Use stable technical codes and slugs.

\- Avoid real user data or private information.



Seeds applied:



\- `regions`: 1

\- `provinces`: 1

\- `municipalities`: 3

\- `roles`: 10

\- `membership\_levels`: 5

\- `categories`: 10

\- `content\_types`: 10



\---



\## Verification query result



```txt

regions              1

provinces            1

municipalities       3

roles                10

membership\_levels    5

categories           10

content\_types        10

