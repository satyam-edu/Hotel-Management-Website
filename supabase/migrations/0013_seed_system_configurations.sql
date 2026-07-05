-- Hotel Kamala Inn Grand — Seed the system_configurations singleton row
-- No prior migration ever inserted this row, so the table has been empty
-- since 0001_init_schema.sql created it. Every column has a `not null
-- default`, so inserting just the id populates the rest from those
-- defaults. This is what SystemContext.tsx's `.eq("id", 1)` query expects
-- to find — its absence is what caused the 406 "0 rows" error from
-- PostgREST when the query used `.single()`.

insert into system_configurations (id)
values (1)
on conflict (id) do nothing;
