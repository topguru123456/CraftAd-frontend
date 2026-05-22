import termsPdfUrl from '@assets/pdf/termsofservice.pdf?url';

export function TermsLink({ children = 'לתקנון ההתקשרות', className = 'link' }) {
  return (
    <a href={termsPdfUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
