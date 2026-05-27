import { useEffect } from 'react';

/* Public route — loaded INSIDE the Tranzila iframe after the user
 * completes (or fails) card entry. Tranzila redirects to our
 * `success_url_address` / `fail_url_address`, which are this route
 * on the SAME origin as the parent app.
 *
 * Posts a message to the parent window so StartTrialModal can refresh
 * metadata and proceed. Renders minimal UI in case the listener
 * doesn't fire (popup blockers, weird browser settings) so the user
 * isn't left staring at a blank screen.
 *
 * Public route: no JWT context inside the iframe → never gate this
 * behind ProtectedRoute. */
export default function TrialIframeReturn({ result }) {
  useEffect(() => {
    /* No-op if we're somehow top-level (user pasted the URL into a new
     * tab). Same-origin postMessage so a malicious site can't read it. */
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'tranzila_iframe_result', result },
          window.location.origin,
        );
      }
    } catch {
      /* Cross-origin restriction or other access error — nothing else
       * to do here. The parent will time out its poll and surface a
       * "refresh the page" message. */
    }
  }, [result]);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full flex items-center justify-center bg-white text-ink"
    >
      <div className="text-center space-y-3 max-w-xs px-6">
        {result === 'success' ? (
          <>
            <p className="text-2xl font-bold">תשלום אושר</p>
            <p className="text-base text-ink-muted">משלים את הרישום…</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-danger">התשלום נכשל</p>
            <p className="text-base text-ink-muted">סגור חלון זה ונסה שוב.</p>
          </>
        )}
      </div>
    </div>
  );
}
