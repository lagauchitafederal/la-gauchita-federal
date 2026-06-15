\# Initial Admin Bootstrap — Dev



\## Status



Bootstrap completed successfully.



\## Environment



\- Environment: development

\- Supabase project: `la-gauchita-federal-dev`

\- Execution method: manual SQL execution through Supabase SQL Editor

\- GitHub integration from Supabase: not connected

\- Supabase CLI: not used



\## Result



The initial development administrator was created and assigned successfully.



Created/verified records:



\- `public.profiles`: active profile linked to a Supabase Auth user

\- `public.user\_roles`: `super\_admin` role assigned

\- `scope\_type`: `global`

\- `scope\_id`: `null`



\## Security notes



\- No real email is stored in this document.

\- No Auth User ID is stored in this document.

\- No profile UUID is stored in this document.

\- No role UUID is stored in this document.

\- No secret key was used.

\- No service role key was used.

\- No credentials were committed to Git.

\- The bootstrap was performed manually in Supabase dev.



\## Verification



The following was verified manually:



```txt

profile status    active

role              super\_admin

scope\_type        global

scope\_id          null

