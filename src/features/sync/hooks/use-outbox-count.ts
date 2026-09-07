"use client";

import * as React from "react";
import { getOutbox, subscribeToOutbox } from "@/features/sync/lib/outbox";

export function useOutboxCount() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const update = () => setCount(getOutbox().length);
    update();
    return subscribeToOutbox(update);
  }, []);

  return count;
}
