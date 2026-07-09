import type { ChildDetail, ChildGender } from "../types/database";

export type { ChildDetail, ChildGender };

export interface RoomsCalculatorRules {
  minBookingAge: number;
  maxAdultsPerRoom: number;
  maxChildrenPerRoom: number;
}

export interface RoomsCalculatorResult {
  roomsRequired: number;
  unaccompaniedMinors: ChildDetail[];
  requiresGenderSeparation: boolean;
  belowMinimumAge: ChildDetail[];
}

const TEEN_MIN_AGE = 12;
const TEEN_MAX_AGE = 18;

function isTeen(child: ChildDetail): boolean {
  return child.age >= TEEN_MIN_AGE && child.age <= TEEN_MAX_AGE;
}

// Implements the Blueprint Section 1.8 packing sequence:
//   1. Adults form the baseline — every `maxAdultsPerRoom` adults consume one room.
//   2. Teens (12-18) are attempted into the spare capacity of adult rooms first,
//      since a teen is considered safe to share with a related adult party.
//   3. Under-12 children fill any remaining spare capacity next, up to
//      `maxChildrenPerRoom` per room (a higher ceiling reflecting cots/extra beds).
//   4. Teens who still don't fit anywhere are flagged as unaccompanied and
//      counted by gender — mixed-gender leftover teens require a separate room
//      each rather than defaulting into sharing one.
//   5. A minimum-booking-age hard stop is reported separately (never silently
//      allowed through) so the caller can block submission outright.
export function calculateRoomsRequired(
  adults: number,
  children: ChildDetail[],
  rules: RoomsCalculatorRules,
): RoomsCalculatorResult {
  const belowMinimumAge = children.filter((child) => child.age < rules.minBookingAge);

  const safeAdults = Math.max(adults, 0);
  const adultRooms = safeAdults > 0 ? Math.ceil(safeAdults / rules.maxAdultsPerRoom) : 0;

  // Spare capacity is tracked as one pool per adult room, each capped at
  // maxChildrenPerRoom — matching the confirmed decision to use the
  // property-wide system_configurations cap rather than a per-category one.
  const spareCapacity = new Array(adultRooms).fill(rules.maxChildrenPerRoom);

  function fill(count: number): number {
    let remaining = count;
    for (let i = 0; i < spareCapacity.length && remaining > 0; i++) {
      const used = Math.min(spareCapacity[i], remaining);
      spareCapacity[i] -= used;
      remaining -= used;
    }
    return remaining;
  }

  const teens = children.filter(isTeen);
  const youngChildren = children.filter((child) => !isTeen(child));

  const teensLeftOver = fill(teens.length);
  const unaccompaniedTeenCount = teensLeftOver;
  const unaccompaniedMinors = teens.slice(teens.length - unaccompaniedTeenCount);

  const youngChildrenOverflow = fill(youngChildren.length);

  // Under-12 overflow needs its own additional rooms (one room per
  // maxChildrenPerRoom overflow children), since they were never eligible for
  // the unaccompanied-minor branch — only teens are.
  const extraRoomsForYoungOverflow =
    youngChildrenOverflow > 0 ? Math.ceil(youngChildrenOverflow / rules.maxChildrenPerRoom) : 0;

  const genders = new Set(unaccompaniedMinors.map((child) => child.gender));
  const requiresGenderSeparation = genders.size > 1;

  // Each unaccompanied minor requires a separate room; when genders differ,
  // they can never share one, so every unaccompanied minor gets their own room
  // in that case. When all unaccompanied minors share one gender, they may be
  // grouped together up to maxChildrenPerRoom per room.
  const roomsForUnaccompanied = requiresGenderSeparation
    ? unaccompaniedMinors.length
    : unaccompaniedMinors.length > 0
      ? Math.ceil(unaccompaniedMinors.length / rules.maxChildrenPerRoom)
      : 0;

  const roomsRequired =
    adultRooms + extraRoomsForYoungOverflow + roomsForUnaccompanied || (children.length > 0 ? 1 : 0);

  return {
    roomsRequired: Math.max(roomsRequired, safeAdults > 0 || children.length > 0 ? 1 : 0),
    unaccompaniedMinors,
    requiresGenderSeparation,
    belowMinimumAge,
  };
}
