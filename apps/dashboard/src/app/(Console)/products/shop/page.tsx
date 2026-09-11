import { redirect } from 'next/navigation';

// The shop-address form moved into `/products/settings` as a section, alongside the store's
// other commerce settings. Kept as a redirect (not deleted outright) so any bookmark or old link
// to this URL still lands somewhere useful.
export default function Page() {
  redirect('/products/settings');
}
