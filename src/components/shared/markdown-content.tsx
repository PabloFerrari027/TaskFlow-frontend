"use client";

import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitMentions, type MentionNames } from "@/lib/mentions";
import { cn } from "@/lib/utils";

// Minimal mdast shape — just what the mention pass touches.
interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
}

const MENTION_CLASS = "rounded bg-primary/10 px-0.5 font-medium text-primary";

/**
 * Wraps `@Name` tokens found in plain text nodes in a highlighted span. Code
 * (`inlineCode`/`code`) has no text nodes, so it's left alone.
 */
function remarkMentions(mentionedUserIds: string[], names?: MentionNames) {
  return () => (tree: MdNode) => {
    if (mentionedUserIds.length === 0) return;

    function visit(node: MdNode) {
      if (!node.children) return;
      node.children = node.children.flatMap((child): MdNode[] => {
        if (child.type !== "text" || !child.value) {
          visit(child);
          return [child];
        }
        const parts = splitMentions(child.value, mentionedUserIds, names);
        if (parts.length === 1 && !parts[0].mention) return [child];
        return parts.map((part) =>
          part.mention
            ? {
                type: "mention",
                data: { hName: "span", hProperties: { className: MENTION_CLASS } },
                children: [{ type: "text", value: part.text }],
              }
            : { type: "text", value: part.text },
        );
      });
    }

    visit(tree);
  };
}

const COMPONENTS: Components = {
  h1: (props) => <h3 className="mt-3 mb-1.5 text-lg font-semibold text-foreground" {...omitNode(props)} />,
  h2: (props) => <h3 className="mt-3 mb-1.5 text-base font-semibold text-foreground" {...omitNode(props)} />,
  h3: (props) => <h4 className="mt-2 mb-1 text-sm font-semibold text-foreground" {...omitNode(props)} />,
  h4: (props) => <h4 className="mt-2 mb-1 text-sm font-semibold text-foreground" {...omitNode(props)} />,
  h5: (props) => <h4 className="mt-2 mb-1 text-sm font-semibold text-foreground" {...omitNode(props)} />,
  h6: (props) => <h4 className="mt-2 mb-1 text-sm font-semibold text-foreground" {...omitNode(props)} />,
  p: (props) => <p className="my-1.5 leading-relaxed" {...omitNode(props)} />,
  ul: (props) => <ul className="my-1.5 list-disc space-y-0.5 pl-5" {...omitNode(props)} />,
  ol: (props) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5" {...omitNode(props)} />,
  li: (props) => <li className="marker:text-muted-foreground" {...omitNode(props)} />,
  blockquote: (props) => (
    <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground" {...omitNode(props)} />
  ),
  hr: () => <hr className="my-3 border-border" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Followable without dropping into edit mode.
      onClick={(event) => event.stopPropagation()}
      className="text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  pre: (props) => (
    <pre
      className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0"
      {...omitNode(props)}
    />
  ),
  code: (props) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]" {...omitNode(props)} />
  ),
  table: (props) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...omitNode(props)} />
    </div>
  ),
  th: (props) => <th className="border border-border bg-muted/50 px-2 py-1 text-left" {...omitNode(props)} />,
  td: (props) => <td className="border border-border px-2 py-1" {...omitNode(props)} />,
  input: (props) => <input {...omitNode(props)} className="mr-1.5 align-middle" />,
};

// react-markdown passes the hast `node` to every component; it isn't a DOM prop.
function omitNode<T extends { node?: unknown }>(props: T) {
  const { node, ...rest } = props;
  void node;
  return rest;
}

/**
 * Renders a Markdown description. Raw HTML in the text is not interpreted
 * (react-markdown escapes it), and unsafe link protocols are dropped.
 */
export function MarkdownContent({
  content,
  mentionedUserIds = [],
  names,
  className,
}: {
  content: string;
  mentionedUserIds?: string[];
  names?: MentionNames;
  className?: string;
}) {
  const plugins = React.useMemo(
    () => [remarkGfm, remarkMentions(mentionedUserIds, names)],
    [mentionedUserIds, names],
  );

  return (
    <div className={cn("text-sm break-words text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}>
      <ReactMarkdown remarkPlugins={plugins} components={COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
