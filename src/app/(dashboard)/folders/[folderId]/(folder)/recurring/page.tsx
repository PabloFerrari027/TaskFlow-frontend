"use client";

import { use } from "react";
import { RecurringItemsList } from "@/features/recurring-items/components/recurring-items-list";

export default function FolderRecurringItemsPage(props: PageProps<"/folders/[folderId]/recurring">) {
  const { folderId } = use(props.params);
  return <RecurringItemsList folderId={folderId} />;
}
