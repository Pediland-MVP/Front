import { redirect } from 'next/navigation';

// Settings no longer has a hub screen — the sidebar's sub-items are the only
// navigation. Land on the first sub-item instead of showing an empty shell.
export default function Page() {
  redirect('/settings/workspace');
}
