import { cn } from '@lib/cn';
export function Card({ className, ...rest }) {
  return <div className={cn('card', className)} {...rest} />;
}
