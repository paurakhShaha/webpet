export type NavId = 'pet' | 'adventure' | 'inventory' | 'equipment' | 'quests' | 'shop' | 'journal';

/** The main sections. Casual players can live in Pet and Adventure; the rest are there when you want them. */
export const NAV_ITEMS: readonly { id: NavId; label: string; enabled: boolean }[] = [
  { id: 'pet', label: 'Pet', enabled: true },
  { id: 'adventure', label: 'Adventure', enabled: true },
  { id: 'inventory', label: 'Inventory', enabled: true },
  { id: 'equipment', label: 'Equipment', enabled: true },
  { id: 'quests', label: 'Quests', enabled: true },
  { id: 'shop', label: 'Shop', enabled: true },
  { id: 'journal', label: 'Journal', enabled: true },
];
