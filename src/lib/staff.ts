
export const STAFF_MAPPING: Record<string, string> = {
  '+916000861935': 'Admin',
  '+919613993713': 'Owner',
  '+919181540323': 'Geeta Churi',
  '+918822081421': 'Muskan Das',
};

export function getStaffName(phoneNumber: string | null): string {
  if (!phoneNumber) return 'Unknown Staff';
  return STAFF_MAPPING[phoneNumber] || `Staff (${phoneNumber.slice(-4)})`;
}
