import Comment from "./components/comment";

export default async function Page({ params }: any) {
  const { id } = await params;

  return <Comment id={id} />;
}
