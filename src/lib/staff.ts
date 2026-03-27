
export const STAFF_MAPPING: Record<string, string> = {
  '+916000861935': 'Abhi J',
  '+919613993713': 'Owner',
  '+919181540323': 'Geeta C',
  '+918822081421': 'Muskan D',
};

export function getStaffName(phoneNumber: string | null): string {
  if (!phoneNumber) return 'Unknown Staff';
  return STAFF_MAPPING[phoneNumber] || `Staff (${phoneNumber.slice(-4)})`;
}

/**
 * Checks if a phone number belongs to an Admin or Owner.
 */
export function isStaffAdmin(phoneNumber: string | null): boolean {
  if (!phoneNumber) return false;
  return phoneNumber === '+916000861935' || phoneNumber === '+919613993713';
}
