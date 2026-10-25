import type { InventoryState, ProgressState, QuestsState, ShopState } from '@/types';

/** Everyone starts with a little food and gold, so the first day isn't about running out. */
export const STARTER_ITEMS: Record<string, number> = { apple: 5, berry: 3, meat: 1, fish: 1 };
export const STARTER_GOLD = 60;

export const emptyInventory = (): InventoryState => ({ gold: STARTER_GOLD, items: { ...STARTER_ITEMS } });
export const emptyShop = (): ShopState => ({ rotationId: -1, purchases: {}, basketDay: '' });
export const emptyQuests = (): QuestsState => ({ active: {}, claimed: [], dailyDay: '', weeklyKey: '' });
export const emptyProgress = (): ProgressState => ({ counters: {}, flags: [], achievements: {}, unseenAchievements: [], tipsSeen: [] });
