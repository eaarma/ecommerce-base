import StructuredText from "@/components/common/StructuredText";
import type { FaqPageContentDto } from "@/types/storePage";

type StoreFaqPageProps = {
  title: string;
  description: string | null;
  content: FaqPageContentDto;
  closingNote: string | null;
};

export default function StoreFaqPage({
  title,
  description,
  content,
  closingNote,
}: StoreFaqPageProps) {
  const intro = content.intro?.trim() || description?.trim() || null;
  const items =
    content.items?.filter((item) => item.question?.trim() || item.answer?.trim()) ??
    [];

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16 sm:px-8 lg:px-12">
        <section className="rounded-3xl border border-base-300 bg-base-100 p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Help center
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
            {title}
          </h1>

          {intro ? (
            <p className="mt-4 max-w-2xl text-base leading-7 text-base-content/70">
              {intro}
            </p>
          ) : null}
        </section>

        {items.length > 0 ? (
          <section className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`${item.question ?? "faq-item"}-${index}`}
                className="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100 shadow-sm"
              >
                <input type="checkbox" defaultChecked={index === 0} />
                <div className="collapse-title text-lg font-semibold">
                  {item.question?.trim() || `Question ${index + 1}`}
                </div>
                <div className="collapse-content text-base-content/70">
                  {item.answer?.trim() ? (
                    <StructuredText
                      text={item.answer}
                      paragraphClassName="leading-7 whitespace-pre-line"
                      listClassName="list-disc space-y-1 pl-5"
                    />
                  ) : null}
                </div>
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
