import { cn } from '@lib/cn';

export function SettingsSection({ title, children, className }) {
  return (
    <section className={cn('space-y-5', className)}>
      {title && (
        <h2 className="text-lg sm:text-xl font-extrabold text-ink text-right">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function SettingsDivider() {
  return <hr className="border-0 border-t border-line" />;
}
