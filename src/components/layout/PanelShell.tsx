'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { getCurrentProfile, type UserProfile } from '@/lib/profile';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ShopContext, defaultShopSettings, type ShopSettings } from './shop-context';

export const ProfileContext = createContext<UserProfile | null>(null);

export function useCurrentProfile() {
  return useContext(ProfileContext);
}

export function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shop, setShop] = useState<ShopSettings>(defaultShopSettings);

  const refreshShop = async () => {
    if (!isSupabaseConfigured) {
      setShop(defaultShopSettings);
      return;
    }

    const { data, error } = await supabase
      .from('shop_settings')
      .select('id, shop_name, logo_url')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setShop({
        id: data.id ?? null,
        shop_name: data.shop_name || defaultShopSettings.shop_name,
        logo_url: data.logo_url || defaultShopSettings.logo_url,
      });
      return;
    }

    setShop(defaultShopSettings);
  };

  useEffect(() => {
    void getCurrentProfile().then(setProfile);
    void refreshShop();
  }, []);

  return (
    <ProfileContext.Provider value={profile}>
      <ShopContext.Provider value={{ shop, refreshShop, setShop }}>
        <div className="flex h-screen overflow-hidden bg-[#0D0F12] text-zinc-100">
          <Sidebar open={open} onClose={() => setOpen(false)} profile={profile} />

          <div className="relative z-10 flex min-w-0 flex-1 flex-col lg:pl-[270px]">
            <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-[radial-gradient(circle_at_45%_0%,rgba(251,192,45,.08),transparent_55%)]" />
            <Header title={title} onMenu={() => setOpen(true)} profile={profile} />
            <main className="relative min-h-0 flex-1 overflow-y-auto bg-transparent p-3 sm:p-4 lg:p-5 [&>div.animate-rise]:!space-y-4 [&>div.animate-rise]:!p-3 sm:[&>div.animate-rise]:!p-4">
              <div className="mx-auto w-full max-w-[1700px]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ShopContext.Provider>
    </ProfileContext.Provider>
  );
}
