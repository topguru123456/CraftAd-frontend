const baseProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function AgentIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 20a8 8 0 0 1 16 0" />
      <circle cx="12" cy="8" r="4" />
      <path d="M3 11a3 3 0 0 1 6 0" />
      <path d="M15 11a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function BriefcaseIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function LightbulbIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.4 1 2.5v2h6v-2c0-1.1.3-1.8 1-2.5A6 6 0 0 0 12 3z" />
    </svg>
  );
}

export function PuzzleIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 3h2a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 0 3 0V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.5a1.5 1.5 0 0 0 0 3H20a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 0 0-3 0V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1.5a1.5 1.5 0 0 0 0-3H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function LeafIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 20c0-9 7-16 16-16 0 9-7 16-16 16z" />
      <path d="M4 20l9-9" />
    </svg>
  );
}

export function EcommerceIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path d="M9 21h6" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function CloudIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M17.5 19a4.5 4.5 0 0 0 .8-8.93A6 6 0 0 0 6.6 11.05 4 4 0 0 0 6.5 19h11z" />
    </svg>
  );
}

export function FootprintsIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <ellipse cx="7" cy="13" rx="2.4" ry="3" />
      <circle cx="5.6" cy="7.2" r="0.7" />
      <circle cx="7.6" cy="6.2" r="0.6" />
      <ellipse cx="16.5" cy="11" rx="2.4" ry="3" />
      <circle cx="15.1" cy="5.2" r="0.7" />
      <circle cx="17.1" cy="4.2" r="0.6" />
    </svg>
  );
}

export function RocketIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3c2.8 0 4.8 3 4.8 7v4l-1.8 2H9l-1.8-2v-4c0-4 2-7 4.8-7z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M9.2 16l-2 4 3-1M14.8 16l2 4-3-1" />
    </svg>
  );
}

export function SparklesIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10 3l1.4 5.1L16.5 9.5l-5.1 1.4L10 16l-1.4-5.1L3.5 9.5l5.1-1.4z" />
      <path d="M18.5 14l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" />
    </svg>
  );
}

export function SinglePersonIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function SmallTeamIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="9" cy="8.5" r="2.8" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.2" />
      <path d="M14 19a4 4 0 0 1 7 0" />
    </svg>
  );
}

export function MediumTeamIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="8" cy="8" r="2.4" />
      <circle cx="16" cy="8" r="2.4" />
      <circle cx="12" cy="13.5" r="2.2" />
      <path d="M3 17a5 5 0 0 1 9 0" />
      <path d="M12 17a5 5 0 0 1 9 0" />
    </svg>
  );
}

export function TeamGridIcon(props) {
  return (
    <svg {...baseProps} {...props} fill="currentColor" stroke="none">
      <circle cx="6"  cy="6"  r="1.5" />
      <circle cx="12" cy="6"  r="1.5" />
      <circle cx="18" cy="6"  r="1.5" />
      <circle cx="6"  cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
      <circle cx="6"  cy="18" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
    </svg>
  );
}

export function MessageIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 11.5a8 8 0 0 1-12 7L3 21l1.5-4.5A8 8 0 1 1 21 11.5z" />
    </svg>
  );
}

export function FacebookIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M22 12a10 10 0 1 0-11.6 9.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

export function GoogleIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 12.2c0 5-3.5 8.8-8.7 8.8A9 9 0 1 1 18.4 5.4l-2.5 2.4A5.5 5.5 0 0 0 12.3 6.2 5.8 5.8 0 1 0 17.5 13.6h-5.2v-3.2h8.6c.1.6.1 1.2.1 1.8z" />
    </svg>
  );
}

export function PlayBoxIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10.5 9l4.5 3-4.5 3z" fill="currentColor" />
    </svg>
  );
}
