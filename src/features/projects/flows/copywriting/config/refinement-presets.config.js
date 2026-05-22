/* Quick-action presets for the "AI refine" panel in the edit modal.
 *
 * Each entry pairs a short Hebrew LABEL (shown in the dropdown) with a
 * full Hebrew INSTRUCTION (sent to GPT-4o as the user message).
 * Picking a preset fills the modal's instruction input — the user can
 * tweak it before clicking Generate, so the instruction is a starting
 * point, not a fixed string.
 *
 * Adding a preset: append an entry. Keep the label ≤ 12 chars so it
 * doesn't wrap awkwardly in the dropdown; keep the instruction one or
 * two sentences (the backend caps at 500 chars).
 *
 * Order matches the spec mock — most-frequent style adjustments first,
 * then length/structure, then "make it pop" at the bottom. */

export const REFINEMENT_PRESETS = Object.freeze([
  {
    id: 'authoritative',
    label: 'סמכותי',
    instruction:
      'כתבו את הטקסט בטון יותר סמכותי, בוטח ומקצועי. הקפידו על דיוק ועוצמה בכל משפט.',
  },
  {
    id: 'expressive',
    label: 'וורבלי',
    instruction:
      'הוסיפו עומק רגשי ופרטים תיאוריים שמציגים את הסיפור ואת התועלת בצורה חיה.',
  },
  {
    id: 'elevated',
    label: 'שפה גבוהה',
    instruction:
      'שדרגו את השפה לרמה גבוהה ומדויקת — אוצר מילים עשיר ומבנים תחביריים מורכבים יותר, בלי להישמע מנופחים.',
  },
  {
    id: 'concise',
    label: 'קצר ולעניין',
    instruction:
      'קצרו את הטקסט משמעותית והפכו אותו לתמציתי, ישיר ופוקאסי. הסירו כל מילה שלא תורמת.',
  },
  {
    id: 'educational',
    label: 'מלמד',
    instruction:
      'הוסיפו טון של חינוך והסבר — הציגו ידע מקצועי ועומק תוכן, בלי להישמע מתנשאים.',
  },
  {
    id: 'creative',
    label: 'יצירתי',
    instruction:
      'הפכו את הטקסט ליצירתי ומקורי יותר. חפשו ניסוחים בלתי צפויים ואנלוגיות מעניינות.',
  },
  {
    id: 'standout',
    label: 'יוצא דופן',
    instruction:
      'הפכו את הטקסט לבולט ומפתיע — משהו שיגרום לקורא לעצור באמצע סקרול ולקרוא שוב.',
  },
  {
    id: 'shorten',
    label: 'לקצר',
    instruction:
      'קצרו את הטקסט בכ-30% תוך שמירה על המסר המרכזי ועל ה-CTA. אל תוותרו על עובדות קונקרטיות.',
  },
]);
