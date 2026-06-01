import { Outlet } from 'react-router-dom';
import { Logo } from '@components/ui/Logo';
import { WhatsAppButton } from '@components/ui/WhatsAppButton';
import heroImage from '@assets/images/auth/hero.png';

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen w-full bg-no-repeat bg-cover bg-left bg-brand-500"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="min-h-screen flex" dir="rtl">
        {/* 50/50 column split at lg+ — the hero background image covers
            the remaining 50% on the visual-left side. Previous
            clamp(380px,36vw,560px) made the form column only ~37%
            wide on common 1024-1366px laptops which felt compressed. */}
        <main className="w-full lg:w-1/2 lg:shrink-0 bg-white flex items-center justify-center px-6 sm:px-10 lg:px-12 py-16 lg:py-10">
          <div className="w-full max-w-[480px] animate-fade-in">
            <div className="text-right mb-10">
              <Logo className="h-9" />
            </div>
            <Outlet />
          </div>
        </main>
      </div>
      <WhatsAppButton />
    </div>
  );
}
