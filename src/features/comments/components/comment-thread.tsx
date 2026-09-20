"use client";

import * as React from "react";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { CommentItem } from "@/features/comments/components/comment-item";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/tree";
import type { Comment } from "@/types/comment";

// Purely visual cap: the data allows arbitrary depth, but past this level
// replies keep the last indentation instead of drifting further right and
// squeezing the text in a narrow panel.
const MAX_INDENT_LEVEL = 3;

interface CommentNodeProps {
  node: TreeNode<Comment>;
  level: number;
  projectId: string;
}

export function CommentNode({ node, level, projectId }: CommentNodeProps) {
  const [replying, setReplying] = React.useState(false);
  const comment = node.item;

  // What sits under this comment (its reply composer and its replies) is
  // indented one step, until the visual cap is reached.
  const nestedClassName = cn(
    "mt-3 space-y-3",
    level < MAX_INDENT_LEVEL && "ml-4 border-l border-border/60 pl-3"
  );

  return (
    <div>
      <CommentItem
        comment={comment}
        projectId={projectId}
        hasReplies={node.children.length > 0}
        onReply={() => setReplying((open) => !open)}
      />

      {replying || node.children.length > 0 ? (
        <div className={nestedClassName}>
          {replying ? (
            <CommentComposer
              taskId={comment.taskId}
              projectId={projectId}
              parentId={comment.id}
              onSubmitted={() => setReplying(false)}
              onCancel={() => setReplying(false)}
            />
          ) : null}
          {node.children.map((child) => (
            <CommentNode key={child.item.id} node={child} level={level + 1} projectId={projectId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
