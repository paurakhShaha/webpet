import { Gem, Shield, Shirt, Sword, Clover, type LucideIcon } from 'lucide-react';
import type { EquipSlot } from '@/types';

export const SLOT_ICONS: Record<EquipSlot | 'cosmetic', LucideIcon> = {
  weapon: Sword, armor: Shield, accessory: Gem, charm: Clover, cosmetic: Shirt,
};
