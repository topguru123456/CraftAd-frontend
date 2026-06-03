import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@components/ui';
import { ROUTES } from '@config/routes';
import { cn } from '@lib/cn';
import {
  SidebarNav,
  CreationCtaButton,
  JoinCommunityButton,
  ActiveBrandCard,
  UserCard,
  CloseIcon,
} from '@features/navigation';
import { billingApi } from '@features/billing';
import { StartTrialModal } from '@features/trial';

export function AppSidebar({ mobileOpen = false, onMobileClose }) {
  const { user, signOut } = useAuth();
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Auto-close the mobile drawer whenever the route changes (clicked a nav
  // item, etc.). No-op on desktop because the sidebar is always visible.
  useEffect(() => {
    if (mobileOpen) onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ESC closes the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onMobileClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  return (
    <aside
      dir="rtl"
      className={cn(
        // Default (mobile): fixed-position drawer hidden off-screen to the right.
        'fixed inset-y-0 right-0 z-50 flex flex-col w-[300px] xl:w-[320px]',
        'bg-slate-50 border-s border-line shadow-2xl lg:shadow-none',
        'h-screen overflow-y-auto scrollbar-brand',
        'transform transition-transform duration-300 ease-out',
        // lg+: cancel the fixed/transform behavior — sidebar becomes a normal
        // sticky rail sitting in the layout's flex row.
        'lg:sticky lg:top-0 lg:z-auto lg:shrink-0 lg:transform-none lg:transition-none',
        mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      )}
      aria-label="ניווט ראשי"
    >
      {/* Header row: logo on the right (RTL start), close button on the left
          (RTL end) — close is mobile-only. */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <Logo className="h-8" />
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="סגור תפריט"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <hr className="mx-5 border-0 border-t border-line mb-4" />

      <div className="px-4">
        <CreationCtaButton onClick={() => navigate(ROUTES.app.projects.new)} />
      </div>

      {/* Nav doesn't scroll on its own anymore — the whole sidebar scrolls
          if its content exceeds viewport height. */}
      <div className="px-4 pt-4">
        <SidebarNav />
      </div>

      {/* Bottom-anchored utility section. `mt-auto` on the WhatsApp
          wrapper consumes any remaining flex space above it, pushing
          the CTA + active-brand + user-card cluster to the bottom of
          the sidebar (matches the spec's "top nav, bottom utilities"
          split). If the sidebar's total content overflows viewport
          height, the parent's `overflow-y-auto` still scrolls — the
          bottom cluster simply scrolls into view with the rest. */}
      <div className="px-4 pt-3 pb-2 mt-auto">
        <JoinCommunityButton />
      </div>

      <div className="px-4 pb-3 space-y-2 mb-3">
        <p className="text-right text-sm mt-1.5 text-ink-muted font-semibold pe-1">מותג פעיל:</p>
        {/* Brand picker popover lives inside ActiveBrandCard — it owns
            its own open/close state. */}
        <ActiveBrandCard />
      </div>

      <div className="px-4 pb-5">
        <UserCard
          user={user}
          planName="Starter"
          onChangePlan={() => setPlanModalOpen(true)}
          onSignOut={signOut}
        />
      </div>

      <StartTrialModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        onSuccess={async (setupIntent) => {
          const pmId =
            typeof setupIntent?.payment_method === 'string'
              ? setupIntent.payment_method
              : setupIntent?.payment_method?.id;
          await billingApi.finalizePaymentMethod({ paymentMethodId: pmId });
          setPlanModalOpen(false);
        }}
      />
    </aside>
  );
}
