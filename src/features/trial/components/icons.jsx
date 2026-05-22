const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function CheckmarkIcon({ className = 'h-4 w-4 text-brand-500', ...rest }) {
  return (
    <svg {...baseProps} viewBox="0 0 24 24" className={className} {...rest}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function LockIcon({ className = 'h-4 w-4 text-brand-500', ...rest }) {
  return (
    <svg {...baseProps} viewBox="0 0 24 24" className={className} {...rest}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}
