const STEPS = [
  {
    number: 1,
    title: 'היום: קבלת גישה מיידית',
    description: 'התחלת תקופת ניסיון למשך 7 ימים ללא עלות או התחייבות.',
    active: true,
  },
  {
    number: 2,
    title: 'יום 1 עד 7: להנות מהכוח של CraftAD',
    description: "תהנו מכלל הפיצ'רים שיש לפלטפורמה להציע.",
    active: false,
  },
  {
    number: 3,
    title: 'יום 7: סיום הניסיון',
    description: 'המנוי שלך מתחיל ובאפשרותך לבחור חבילה מתאימה.',
    active: false,
  },
];

export function HowItWorksCard() {
  return (
    <div
      dir="rtl"
      className="bg-white rounded-[32px] shadow-[0_24px_60px_rgba(80,20,60,0.22)] border-2 border-brand-100 px-10 py-12 sm:px-14 sm:py-16"
    >
      <h2 className="text-center text-[36px] sm:text-[42px] font-bold text-ink mb-14">
        איך זה עובד?
      </h2>

      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute right-3 top-2 bottom-5 w-[4px] bg-gradient-to-b from-brand-500 via-brand-300 to-brand-100 rounded-full"
        />

        <ol className="space-y-12 sm:space-y-14 pr-10">
          {STEPS.map((step) => (
            <li key={step.number} className="relative flex items-start gap-5 text-right">
              {!step.active && (
                <span
                  aria-hidden="true"
                  className="absolute -right-8 -top-3 z-20 h-3.5 w-3.5 rounded-full bg-brand-200"
                />
              )}

              {step.active ? (
                <span className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-gradient text-white font-bold text-lg shadow-[0_6px_14px_rgba(237,86,153,0.35)] ring-8 ring-brand-100">
                  {step.number}
                </span>
              ) : (
                <span className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white ring-8 ring-brand-200 text-brand-400 font-bold text-lg">
                  {step.number}
                </span>
              )}

              <div className="flex-1 pt-1.5 space-y-2">
                <h3 className="text-[18px] sm:text-lg font-bold text-ink leading-snug">
                  {step.title}
                </h3>
                <p className="text-[14px] sm:text-[15px] text-ink-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
