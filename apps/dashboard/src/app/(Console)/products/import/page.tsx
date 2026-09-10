import { notFound } from 'next/navigation';

// Bulk product import (وارد کردن گروهی) is hidden for now. The wizard code stays in the tree
// (`@/components/Commerce/Import/ImportWizard`) and the backend `ImportController` is still a
// file -- both are just unwired, so this route answers 404 like any unknown page.
// To bring it back: restore the render below, re-register `ImportController` in
// `commerce.module.ts`, and un-comment the sidebar entry in `ConsoleSidebar.tsx`.
//
// import { LayoutPage } from '@/components/Layout/LayoutPage';
// import { ImportWizard } from '@/components/Commerce/Import/ImportWizard';
//
// export default function Page() {
//   return (
//     <LayoutPage>
//       <ImportWizard />
//     </LayoutPage>
//   );
// }

export default function Page(): never {
  return notFound();
}
