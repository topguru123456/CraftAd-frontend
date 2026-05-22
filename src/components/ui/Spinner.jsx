export function Spinner({ size = 20 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block animate-spin rounded-full border-2 border-brand-200 border-t-brand-500"
      aria-label="loading"
    />
  );
}
