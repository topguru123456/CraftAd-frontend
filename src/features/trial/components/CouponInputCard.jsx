import { useState } from 'react';
import { Button, Input } from '@components/ui';

export function CouponInputCard({ onApply, label = 'יש לך קוד קופון?', placeholder = 'הכנס קוד קופון' }) {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!code.trim() || !onApply) return;
    setIsApplying(true);
    try {
      await onApply(code.trim());
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="bg-white w-full rounded-[20px] border-2 border-brand-100 shadow-[0_8px_24px_rgba(80,20,60,0.10)] p-5 sm:p-6"
    >
      <p className="text-right text-sm font-semibold text-ink mb-3">{label}</p>
      <div className="flex items-stretch gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          maxLength={32}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={!code.trim() || isApplying}
          loading={isApplying}
          className="px-2"
        >
          המשך
        </Button>
      </div>
    </div>
  );
}
