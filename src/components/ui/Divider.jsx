export function Divider({ children }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <span className="h-px flex-1 bg-line" />
      {children && <span className="text-sm text-ink-soft">{children}</span>}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
