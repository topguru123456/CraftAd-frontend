import AmexIcon from '@assets/icons/amex.svg?react';
import MastercardIcon from '@assets/icons/mastercard.svg?react';
import VisaIcon from '@assets/icons/visa.svg?react';

const ICONS = [
  { Icon: VisaIcon,       label: 'Visa' },
  { Icon: MastercardIcon, label: 'Mastercard' },
  { Icon: AmexIcon,       label: 'American Express' },
];

export function PaymentMethodIcons() {
  return (
    <div className="flex items-center justify-center gap-3 px-2 py-2 mt-5 w-fit mx-auto bg-white rounded-lg shadow-md">
      {ICONS.map(({ Icon, label }) => (
        <span
          key={label}
          aria-label={label}
          className="inline-flex items-center justify-center rounded-lg"
        >
          <Icon className="h-10 w-auto" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}
