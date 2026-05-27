import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo, Button, WhatsAppButton } from '@components/ui';
import { HowItWorksCard, LockIcon, StartTrialModal } from '@features/trial';
import { onboardingApi } from '@features/onboarding';
import { billingApi } from '@features/billing';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@lib/supabase';
import TickIcon from '@assets/icons/tick.svg?react';
import heroImage from '@assets/images/onboarding/hero.png';
import { ROUTES } from '@config/routes';
import { env } from '@config/env';

const BENEFITS = [
  'לא יתבצע חיוב בתקופת הניסיון',
  'נתזכר אותך לפני סיום התקופה',
  'באפשרותך לבטל בקליק אחד',
  'פרטי האשראי לא ישמרו במערכת',
];

/* Polling cap for the Tranzila notify callback. Tranzila redirects the
 * iframe to /trial/success front-channel; the notify_url back-channel
 * lands a moment later and writes user_metadata.tranzila_token. We need
 * the token visible before we mark onboarding complete + navigate, so
 * we poll auth.refreshSession() up to NOTIFY_POLL_ATTEMPTS times at
 * NOTIFY_POLL_INTERVAL_MS spacing. */
const NOTIFY_POLL_ATTEMPTS = 10;
const NOTIFY_POLL_INTERVAL_MS = 1000;

export default function TrialStartPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const onBack = () => nav(ROUTES.onboarding.root);
  const onStartTrial = () => setTrialModalOpen(true);

  /* DEV BYPASS — REMOVE BEFORE PROD.
   * Hits POST /billing/tranzila/bypass-trial which writes fake trial
   * metadata so the user lands in /app without real card capture. The
   * BE endpoint is itself gated by TRANZILA_BYPASS_ENABLED, so even if
   * this code ships with VITE_TRANZILA_BYPASS_ENABLED=true the BE will
   * still 403 unless its own flag is also on. */
  const [bypassing, setBypassing] = useState(false);
  const onBypassTrial = async () => {
    if (bypassing) return;
    setBypassing(true);
    const { error } = await billingApi.bypassTrial();
    if (error) {
      toast.error(error.message ?? 'הבייפס נכשל');
      setBypassing(false);
      return;
    }
    /* Reuse the same post-success flow as a real trial completion —
     * polling will see the bypass-written tranzila_token immediately
     * on the first refresh, then mark onboarding complete and nav. */
    await onTrialSuccess();
    setBypassing(false);
  };

  /* Called by StartTrialModal once the Tranzila iframe's success-page
   * postMessage arrives. The CARD has been authorized at this point;
   * what we don't know yet is whether our BE has received Tranzila's
   * notify callback and written user_metadata. Poll for the token; bail
   * out gracefully if it doesn't appear within ~10s (notify lost or
   * BE down — user can refresh and re-enter the trial flow). */
  const onTrialSuccess = async () => {
    let tokenLanded = false;
    for (let i = 0; i < NOTIFY_POLL_ATTEMPTS; i += 1) {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session?.user?.user_metadata?.tranzila_token) {
        tokenLanded = true;
        break;
      }
      await new Promise((r) => setTimeout(r, NOTIFY_POLL_INTERVAL_MS));
    }

    if (!tokenLanded) {
      toast.error(
        'סיום הרישום בעיכוב. רעננו את העמוד בעוד כמה שניות.',
      );
      setTrialModalOpen(false);
      return;
    }

    const currentOnboarding = onboardingApi.read(user);
    await onboardingApi.markCompleted(currentOnboarding);
    setTrialModalOpen(false);
    toast.success('כרטיס האשראי נשמר', {
      description: 'בחירת מסלול תתבצע דרך אישור מהיר, ללא הזנת כרטיס מחדש.',
    });
    nav(ROUTES.app.dashboard, { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-brand-500">
      <div className="min-h-screen flex" dir="rtl">
        <main className="w-full lg:w-[clamp(380px,36vw,560px)] lg:shrink-0 bg-white flex flex-col px-6 sm:px-10 lg:px-12 py-10 lg:py-12 min-h-screen">
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-full max-w-[clamp(320px,28vw,440px)] mx-auto space-y-6 animate-fade-in">
              <Logo className="h-9 mx-auto" />

              <header className="space-y-2 text-center">
                <h1 className="text-[36px] sm:text-[45px] font-bold leading-[1.2] text-ink">
                  התחלת 7 ימי ניסיון<br />ללא עלות או התחייבות
                </h1>
                <p className="text-[20px] sm:text-[22px] font-semibold text-ink">
                  הוסיפו כרטיס אשראי לצורכי אימות.
                </p>
              </header>

              <ul className="space-y-2.5">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-right text-ink">
                    <TickIcon className="h-5 w-5 shrink-0 mr-12 xl:mr-16 2xl:mr-20"/>
                    <span className="flex-1 text-[18px] font-light">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 pt-2">
                <Button onClick={onStartTrial} className="w-full">
                  התחלת ניסיון
                </Button>
                <Button onClick={onBack} variant="outline" className="w-full">
                  חזור
                </Button>
              </div>

              {/* DEV BYPASS — REMOVE BEFORE PROD. Only renders when
                  VITE_TRANZILA_BYPASS_ENABLED=true. Calls the BE bypass
                  endpoint which itself is gated by TRANZILA_BYPASS_ENABLED;
                  both flags must be on for this to work. Styled to look
                  obviously non-production so a stray production deploy
                  with the flag flipped is immediately visible to anyone
                  looking at the page. */}
              {env.tranzilaBypassEnabled && (
                <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 mt-4 space-y-2">
                  <p className="text-xs font-bold text-amber-800 text-center">
                    DEV BYPASS — מצב בדיקה פנימי בלבד
                  </p>
                  <button
                    type="button"
                    onClick={onBypassTrial}
                    disabled={bypassing}
                    className="w-full rounded-xl h-11 font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60 disabled:cursor-wait"
                  >
                    {bypassing ? 'מעקף בתהליך…' : 'דלג על וולידציה (מצב פיתוח)'}
                  </button>
                  <p className="text-[11px] text-amber-700 text-center leading-snug">
                    אינו פעיל בייצור — דורש דגל ב-FE ובBE
                  </p>
                </div>
              )}

              <div className="space-y-2 text-center pt-1">
                <p className="text-base font-semibold text-brand-500 inline-flex items-center justify-center gap-1.5">
                  <LockIcon className="h-6 w-6 text-brand-500" />
                  התהליך מאובטח, מוצפן ובטוח
                </p>
                <p className="text-base text-ink-muted leading-relaxed">
                  פרטי האשראי נדרשים כדי למנוע שימוש לרעה של תקופת הניסיון
                  ולהבטיח שימוש הוגן בפלטפורמה.
                </p>
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-brand-500">
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 w-full h-screen object-cover object-left"
          />
          <div className="relative z-10 w-full max-w-[clamp(500px,42vw,680px)] mx-auto px-6">
            <HowItWorksCard />
          </div>
        </aside>
      </div>

      <WhatsAppButton />

      <StartTrialModal
        open={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        onSuccess={onTrialSuccess}
      />
    </div>
  );
}
