import { Link } from 'react-router-dom';
import { Logo } from '@components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
      <Logo />
      <h1 className="text-6xl font-extrabold bg-brand-gradient bg-clip-text text-transparent">404</h1>
      <p className="text-ink-muted">העמוד שחיפשת לא נמצא</p>
      <Link to="/" className="btn-primary">חזרה לדף הבית</Link>
    </div>
  );
}
