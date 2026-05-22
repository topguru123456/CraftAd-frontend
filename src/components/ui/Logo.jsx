import logoSrc from '@assets/images/logo.svg';

export function Logo({ className = 'h-9' }) {
  return <img src={logoSrc} alt="CraftAd" className={`${className} w-auto select-none`} draggable={false} />;
}
