import StructuredText from "@/components/common/StructuredText";
import type { PolicyPageContentDto } from "@/types/storePage";

type StorePolicyPageProps = {
  eyebrow: string;
  title: string;
  description: string | null;
  content: PolicyPageContentDto;
  closingNote: string | null;
};

export default function StorePolicyPage({
  eyebrow,
  title,
  description,
  content,
  closingNote,
}: StorePolicyPageProps) {
  const intro = content.intro?.trim() || description?.trim() || null;
  const sections =
    content.sections?.filter(
      (section) => section.title?.trim() || section.body?.trim(),
    ) ?? [];

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16 sm:px-8 lg:px-12">
        <section className="rounded-3xl border border-base-300 bg-base-100 p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
            {title}
          </h1>

          {intro ? (
            <p className="mt-4 text-base leading-7 text-base-content/70">
              {intro}
            </p>
          ) : null}
        </section>

        {sections.length > 0 ? (
          <section className="space-y-6 text-base text-base-content/70">
            {sections.map((section, index) => (
              <div key={`${section.title ?? "section"}-${index}`}>
                {section.title?.trim() ? (
                  <h2 className="text-xl font-semibold text-base-content">
                    {section.title}
                  </h2>
                ) : null}

                {section.body?.trim() ? (
                  <StructuredText
                    text={section.body}
                    className="mt-2"
                    paragraphClassName="leading-7 text-base-content/70 whitespace-pre-line"
                    listClassName="list-disc space-y-1 pl-5 text-base-content/70"
                  />
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {closingNote?.trim() ? (
          <section className="rounded-3xl border border-base-300 bg-base-200 p-6 text-sm leading-6 text-base-content/70">
            <StructuredText
              text={closingNote}
              paragraphClassName="leading-6 whitespace-pre-line"
              listClassName="list-disc space-y-1 pl-5"
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
