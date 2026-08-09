import { redirect } from 'next/navigation';

// The workspace-management UI moved under Settings. Redirect rather than 404 so
// existing bookmarks and in-app deep links keep working. The sibling
// /workspace/[memberId]/permissions route is unaffected and still in use by the
// team-members page.
export default function Page() {
  redirect('/settings/workspace');
}
