"use client";

import { use } from "react";
import { ItemBoard } from "@/features/items/components/item-board";

export default function FolderItemsPage(
  props: PageProps<"/folders/[folderId]/items">
) {
  const { folderId } = use(props.params);

  return (
    <div data-page-width="full">
      <ItemBoard folderId={folderId} canManage />
    </div>
  );
}
