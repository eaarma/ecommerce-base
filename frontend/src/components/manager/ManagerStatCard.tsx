type ManagerStatCardProps = {
  label: string;
  value: string;
  detail?: string;
  featured?: boolean;
};

export default function ManagerStatCard({
  label,
  value,
  detail,
  featured = false,
}: ManagerStatCardProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        featured
          ? "border-primary/25 bg-primary/5"
          : "border-base-300 bg-base-100"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold leading-none text-base-content ${
          featured ? "text-[1.7rem]" : "text-2xl"
        }`}
      >
        {value}
      </p>
      {detail && <p className="mt-2 text-xs text-base-content/55">{detail}</p>}
    </div>
  );
}
