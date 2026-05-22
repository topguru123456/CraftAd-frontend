import AddSquareIcon from '@assets/icons/sidebar/add-square.svg?react';

export function CreationCtaButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-start gap-3 rounded-xl bg-brand-gradient text-white font-bold py-3 px-5 shadow-[0_8px_18px_rgba(237,86,153,0.35)] hover:shadow-[0_10px_22px_rgba(237,86,153,0.45)] active:translate-y-[1px] transition-all"
    >
      <AddSquareIcon className="h-8 w-8" />
      <span className="text-lg">יצירה</span>
    </button>
  );
}
