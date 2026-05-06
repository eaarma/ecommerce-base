type StructuredTextProps = {
  text: string;
  className?: string;
  paragraphClassName?: string;
  listClassName?: string;
};

type StructuredBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseStructuredBlocks(text: string): StructuredBlock[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
        return {
          type: "list",
          items: lines.map((line) => line.slice(2).trim()).filter(Boolean),
        } satisfies StructuredBlock;
      }

      return {
        type: "paragraph",
        text: block,
      } satisfies StructuredBlock;
    });
}

export default function StructuredText({
  text,
  className,
  paragraphClassName = "leading-7 whitespace-pre-line",
  listClassName = "list-disc space-y-1 pl-5",
}: StructuredTextProps) {
  const blocks = parseStructuredBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul
            key={`structured-list-${index}`}
            className={index > 0 ? `mt-3 ${listClassName}` : listClassName}
          >
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p
            key={`structured-paragraph-${index}`}
            className={
              index > 0
                ? `mt-3 ${paragraphClassName}`
                : paragraphClassName
            }
          >
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}
