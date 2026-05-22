import { PageContainer } from '@components/ui';
import {
  AccountDetailsSection,
  ChangePasswordSection,
  SubscriptionSettingsSection,
} from '@features/settings';
import { SettingsDivider } from '@features/settings/components/SettingsSection';

export default function AccountPage() {
  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8" dir="rtl">
        <header className="text-right space-y-2">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink leading-tight">
            פרופיל מנוי
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-2xl leading-relaxed">
            כאן ניתן לעדכן את פרטי החשבון, תמונת הפרופיל, סיסמה והגדרות המנוי
            הפעיל.
          </p>
        </header>

        <div className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-8 lg:p-10 space-y-8 sm:space-y-10">
          <AccountDetailsSection />
          <SettingsDivider />
          <ChangePasswordSection />
          <SettingsDivider />
          <SubscriptionSettingsSection />
        </div>
      </div>
    </PageContainer>
  );
}
