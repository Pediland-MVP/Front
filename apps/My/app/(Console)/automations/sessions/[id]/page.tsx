'use client'
export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div className="w-full overflow-auto">{id}</div>;
}
