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
        {/* 60/40 image-to-form split at lg+ per client direction — the
            hero background image covers the visual-left 60%, the form
            takes the visual-right 40% (lg:w-2/5). Previously 50/50,
            originally clamp(380px,36vw,560px). */}
        <main className="w-full lg:w-2/5 lg:shrink-0 bg-white flex items-center justify-center px-6 sm:px-10 lg:px-12 py-16 lg:py-10">
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
