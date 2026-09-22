'use client';

import { createContext, useContext } from 'react';

export type ShopSettings = {
  id?: string | null;
  shop_name: string;
  logo_url?: string | null;
};

export const defaultShopSettings: ShopSettings = {
  shop_name: 'Mister Manager OS',
  logo_url: '/logo.png',
};

export const ShopContext = createContext<{
  shop: ShopSettings;
  refreshShop: () => Promise<void>;
  setShop: (next: ShopSettings) => void;
} | null>(null);

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) return { shop: defaultShopSettings, refreshShop: async () => {}, setShop: () => {} };
  return ctx;
}
