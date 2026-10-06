import { redirect } from "next/navigation";

export default async function FolderIndexPage(
  props: PageProps<"/folders/[folderId]">
) {
  const { folderId } = await props.params;
  redirect(`/folders/${folderId}/items`);
}
