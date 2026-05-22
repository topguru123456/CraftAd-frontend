import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './app/AppHeader';
import { AppSidebar } from './app/AppSidebar';
import { WhatsAppButton } from '@components/ui';
import { BrandsProvider } from '@/contexts/BrandsContext';
import { QuotaProvider } from '@/contexts/QuotaContext';

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const closeSidebar = () => setMobileSidebarOpen(false);

  return (
    /* BrandsProvider wraps the whole app shell so /app/* routes share one
       source of truth for the brand list + active brand. Mounted here (not
       at root) so unauthenticated routes don't fetch brands.
       QuotaProvider sits below it — order doesn't matter for correctness
       since QuotaProvider now fetches its own counts from GET /quota/usage
       (BE-served, not derived from BrandsContext), but the nesting stays
       this way so anything inside QuotaProvider can still useBrands. */
    <BrandsProvider>
     <QuotaProvider>
      {/* Shell is locked to viewport (h-screen + overflow-hidden). Sidebar
          and header stay pinned; only <main> scrolls when the page's
          content exceeds the viewport. This is what gives every /app/*
          page "inner scroll" without each page having to opt in. */}
      <div className="h-screen overflow-hidden bg-slate-100 text-ink">
        <div className="flex h-full" dir="rtl">
          <AppSidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={closeSidebar}
          />

          <div className="flex-1 min-w-0 flex flex-col h-full">
            <AppHeader onOpenSidebar={() => setMobileSidebarOpen(true)} />
            {/* main owns the scroll. Pages remain bare (no padding, no
                max-width); they compose width via <PageContainer/> or go
                full-bleed (Payment). Full-bleed pages that pin themselves
                with `flex-1` still fill main's content area thanks to
                `flex flex-col`. */}
            <main className="flex-1 flex flex-col overflow-y-auto scrollbar-brand">
              <Outlet />
            </main>
          </div>
        </div>

        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="סגור תפריט"
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm animate-fade-in lg:hidden"
          />
        )}

        <WhatsAppButton />
      </div>
     </QuotaProvider>
    </BrandsProvider>
  );
}
