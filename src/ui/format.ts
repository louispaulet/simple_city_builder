import {
  Beer,
  BriefcaseBusiness,
  Car,
  Home,
  Soup,
  Trees,
  Trash2,
} from 'lucide-react';
import { formatMoneyValue } from '../game/money';
import type { ToolKind } from '../game/types';

export const tools: Array<{ id: ToolKind; label: string; icon: typeof Home }> = [
  { id: 'house', label: 'House', icon: Home },
  { id: 'workplace', label: 'Workplace', icon: BriefcaseBusiness },
  { id: 'road', label: 'Road', icon: Car },
  { id: 'restaurant', label: 'Restaurant', icon: Soup },
  { id: 'bar', label: 'Bar', icon: Beer },
  { id: 'park', label: 'Park', icon: Trees },
  { id: 'delete', label: 'Delete', icon: Trash2 },
];

export const loanAmounts = [500, 1000, 2500];
export const formatMoney = formatMoneyValue;

export const cleanCityName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ');
