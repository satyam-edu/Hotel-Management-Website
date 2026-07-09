-- Hotel Kamla Inn Grand — Persist per-child age/gender so the room-packing
-- safeguarding rules (Blueprint 1.8: teen-first spare-capacity fill, gender
-- separation for unaccompanied minors, minimum-booking-age hard stop) can be
-- re-verified server-side, not just computed once in the guest's browser and
-- discarded. Previously `enquiries`/`reservations` only stored aggregate
-- adults/children counts — the actual per-child age+gender data used by
-- src/lib/roomsCalculator.ts never left React state, so verify-reservation
-- had nothing to check even though it already re-verifies billing math.
--
-- child_details is a jsonb array of {"age": number, "gender": "male"|"female"}
-- objects, one per child, matching src/lib/roomsCalculator.ts's ChildDetail
-- shape exactly. Defaulting to '[]' keeps existing rows valid.

alter table enquiries add column child_details jsonb not null default '[]'::jsonb;
alter table reservations add column child_details jsonb not null default '[]'::jsonb;
