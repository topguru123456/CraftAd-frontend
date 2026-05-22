import { useEffect, useState } from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { Field, Input } from '@components/ui';
import { supabase } from '@lib/supabase';
import { accountApi } from '../api/account.api';
import { SettingsSection } from './SettingsSection';
import { SettingsSaveButton } from './SettingsSaveButton';
import { ProfilePhotoSection } from './ProfilePhotoSection';

export function AccountDetailsSection() {
  const { user } = useAuth();
  const toast = useToast();

  const meta = user?.user_metadata ?? {};
  const [fullName, setFullName] = useState(meta.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [emailError, setEmailError] = useState(null);

  useEffect(() => {
    setFullName(meta.name ?? '');
    setEmail(user?.email ?? '');
  }, [meta.name, user?.email]);

  const saveName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError('יש להזין שם מלא');
      return;
    }
    setNameError(null);
    setSavingName(true);
    const { error } = await accountApi.updateName(trimmed);
    setSavingName(false);
    if (error) {
      setNameError(error.message ?? 'שמירת השם נכשלה');
      return;
    }
    await supabase.auth.refreshSession();
    toast.success('השם נשמר');
  };

  const saveEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('כתובת אימייל לא תקינה');
      return;
    }
    setEmailError(null);
    setSavingEmail(true);
    const { error } = await accountApi.updateEmail(trimmed);
    setSavingEmail(false);
    if (error) {
      setEmailError(error.message ?? 'עדכון האימייל נכשל');
      return;
    }
    toast.success('נשלח אימייל לאימות', {
      description: 'אשרו את כתובת האימייל החדשה בתיבת הדואר.',
    });
  };

  return (
    <SettingsSection title="פרטי חשבון">
      {/* Mobile: photo on top. Desktop (RTL): name/email on the right, photo on the left. */}
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-6 lg:gap-8">
        <div className="flex-grow min-w-0 space-y-4 order-2 md:order-1">
          <Field label="שם מלא" error={nameError}>
            <div className="flex items-stretch gap-3 w-full min-w-0">
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ישראלי ישראלי"
                className="flex-1 min-w-0"
                autoComplete="name"
              />
              <SettingsSaveButton stretch loading={savingName} onClick={saveName} />
            </div>
          </Field>

          <Field label="אימייל" error={emailError}>
            <div className="flex items-stretch gap-3 w-full min-w-0">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="flex-1 min-w-0"
                dir="ltr"
                autoComplete="email"
              />
              <SettingsSaveButton stretch loading={savingEmail} onClick={saveEmail} />
            </div>
          </Field>
        </div>

        <ProfilePhotoSection
          className="w-full order-1 md:order-2 flex-grow"
          avatarUrl={meta.avatar_url ?? null}
          onSaved={() => supabase.auth.refreshSession()}
        />
      </div>
    </SettingsSection>
  );
}
