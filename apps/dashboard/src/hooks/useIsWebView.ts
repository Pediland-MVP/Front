'use client';

import { useEffect, useState } from 'react';

// Android's stock WebView appends "; wv)" to its UA string unless the host app overrides it —
// used to hide subscription/billing UI that shouldn't surface inside the wrapped Android app.
const WEBVIEW_UA_PATTERN = /; ?wv\)/i;

// Defaults to true (assume WebView) until the check runs after mount, so gated UI stays hidden
// by default instead of flashing visible for a frame before the real WebView check completes.
export const useIsWebView = () => {
  const [isWebView, setIsWebView] = useState(true);

  useEffect(() => {
    setIsWebView(WEBVIEW_UA_PATTERN.test(navigator.userAgent));
  }, []);

  return isWebView;
};
