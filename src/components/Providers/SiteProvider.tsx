"use client";

import Script from "next/script";
import { GoftinoSnippet } from "../Global/GoftinoSnippet";
import { useEffect, useState } from "react";

interface SiteProviderProps {
  children: React.ReactNode;
}

const GTM_ID = "GTM-W86SW8X8";

const BLOCKED_DOMAINS = [
  "localhost",
  "testofbef.befroosh.app",
  "testmain.befroosh.app",
];

export function SiteProvider({ children }: SiteProviderProps) {
  const [shouldLoadGTM, setShouldLoadGTM] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    if (!BLOCKED_DOMAINS.includes(host)) {
      setShouldLoadGTM(true);
    }
  }, []);

  return (
    <>
      {/* GTM - Head */}
      {shouldLoadGTM && (
        <Script id="gtm-head" strategy="afterInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
        </Script>
      )}

      {children}

      {shouldLoadGTM && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
      )}

      <GoftinoSnippet goftinoKey="amN3YU" />
    </>
  );
}
