export function SupportBanner({ message = 'אנחנו כאן לכל שאלה – צוות התמיכה שלנו זמין עבורכם תמיד בוואטסאפ.' }) {
  return (
    <div
      role="region"
      aria-label="תמיכה"
      className="bg-brand-gradient text-white text-center text-sm sm:text-[15px] font-medium py-2.5 px-4"
    >
      {message}
    </div>
  );
}
