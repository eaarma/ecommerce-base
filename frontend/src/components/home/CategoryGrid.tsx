import CategoryGridItem from "./CategoryGridItem";

export interface CollectionShowcaseItem {
  title: string;
  eyebrow: string;
  description?: string;
  note: string;
  href: string;
  imageUrl: string | null;
  accentClassName?: string;
}

interface CategoryGridProps {
  title?: string;
  items: CollectionShowcaseItem[];
}

export default function CategoryGrid({ title, items }: CategoryGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {title ? (
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
            {title}
          </h2>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {items.slice(0, 4).map((item) => (
          <CategoryGridItem key={`${item.title}-${item.eyebrow}`} item={item} />
        ))}
      </div>
    </section>
  );
}
