// Site/app/providers/SiteProvider.tsx
import Script from "next/script";
import type { PropsWithChildren, ReactElement } from "react";

export default function SiteProvider({
  children,
}: PropsWithChildren): ReactElement {
  const isProd = process.env.NODE_ENV === "production";

  return (
    <>
      {/* GTM - Head */}
      {isProd && (
        <Script id="gtm-head" strategy="beforeInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-W86SW8X8');
        `}
        </Script>
      )}
      {children}

      {/* GTM - Body noscript (Optional but recommended) */}
      {isProd && (
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W86SW8X8"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
      )}
    </>
  );
}
