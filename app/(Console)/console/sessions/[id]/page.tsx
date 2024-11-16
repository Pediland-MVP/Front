import SessionTable from "../components/sessions.table";

export default async function SessionPage({
  params
}: {
  params: Promise<{ id: string }>,
}) {
  const { id } = await params;
  return(
    <div className="w-full">
      {id}
    </div>
  )
}
