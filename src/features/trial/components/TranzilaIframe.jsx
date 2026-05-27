import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@components/ui';

/* Tranzila classic iframe embed.
 *
 * Pattern (Tranzila's official one): render a hidden <form> with
 * action=iframeUrl + target=<iframe-name> + method=POST + all the
 * fields from the BE handshake response as hidden inputs, plus a
 * visible <iframe name=<iframe-name>>. On mount, auto-submit the form;
 * the response renders inside the iframe, not the page.
 *
 * On success or failure inside Tranzila's iframe, Tranzila redirects
 * the iframe to our /trial/success or /trial/failed routes. Those
 * pages postMessage their parent (us); we forward via onComplete.
 *
 * The subscription state lives in user_metadata, written by the BE
 * when Tranzila's notify_url callback hits. postMessage tells us the
 * user-visible flow finished — the consumer polls user_metadata
 * separately until the token appears (notify can lag the iframe
 * redirect by a couple seconds).
 *
 * Apple Pay caveat: requires the TOP-LEVEL frame to be HTTPS. On
 * http://localhost dev, the button renders but the wallet sheet
 * fails. Use a typed card (or ngrok HTTPS for the FE) for end-to-end
 * Apple Pay testing.
 */

const IFRAME_NAME = 'craftad-tranzila-iframe';

export function TranzilaIframe({ iframeUrl, fields, onComplete }) {
  const formRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);

  /* Auto-submit on mount. We track `submitted` so React's StrictMode
   * dev double-effect doesn't fire the form twice — second submit
   * would land on a stale iframe state. */
  useEffect(() => {
    if (!formRef.current || submitted) return;
    formRef.current.submit();
    setSubmitted(true);
  }, [submitted]);

  /* Listen for postMessage from /trial/success or /trial/failed.
   * Strict origin check — only messages from our own origin (the
   * trial return routes) are accepted. Tranzila itself does not
   * postMessage us; only the same-origin redirect target does. */
  useEffect(() => {
    function handle(event) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== 'tranzila_iframe_result') return;
      onComplete?.(data.result === 'success' ? 'success' : 'failed');
    }
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [onComplete]);

  return (
    <div className="relative w-full flex-1 rounded-2xl border border-line bg-white overflow-hidden">
      {/* Hidden form. Auto-submits on mount; never user-visible. */}
      <form
        ref={formRef}
        action={iframeUrl}
        method="POST"
        target={IFRAME_NAME}
        className="hidden"
        aria-hidden="true"
      >
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} readOnly />
        ))}
      </form>

      {/* Loading overlay until the iframe takes over. Disappears once
          the iframe receives Tranzila's HTML response. */}
      {!submitted && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <Spinner size={32} />
        </div>
      )}

      {/* `allow=payment` lets Tranzila's JS inside the iframe invoke
          the Payment Request API (Apple Pay / Google Pay). dir=ltr
          because card numbers + Tranzila's hosted UI are LTR. */}
      <iframe
        name={IFRAME_NAME}
        title="Tranzila payment"
        dir="ltr"
        allow="payment"
        className="block w-full min-h-[520px] border-0 bg-white"
      />
    </div>
  );
}
