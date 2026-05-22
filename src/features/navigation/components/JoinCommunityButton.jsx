import { WhatsAppGlyph } from './icons';

const WHATSAPP_LINK = 'https://wa.link/m4lha4';

export function JoinCommunityButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full inline-flex items-center justify-start gap-2 rounded-xl bg-gradient-to-br from-[#5BE584] via-[#25D366] to-[#128C7E] text-white font-bold py-3 pr-3 shadow-[0_8px_18px_rgba(37,211,102,0.35)] hover:shadow-[0_10px_22px_rgba(37,211,102,0.45)] active:translate-y-[1px] transition-all"
    >
      {/* Icon-first matches the CreationCtaButton convention: in RTL the
          icon lands at the visual right (the "start" side), text to its left. */}
      <WhatsAppGlyph className="h-6 w-6" />
      <span className="text-[18px]">הצטרפות לקהילה שלנו</span>
    </a>
  );
}
