export default function LoadingProductPage() {
  return (
    <div className="min-h-screen bg-base-100 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-8 lg:px-10">
        <div className="h-5 w-32 rounded bg-base-300" />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="aspect-[4/3] rounded-lg bg-base-300" />
          <div className="flex flex-col gap-5">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-base-300" />
              <div className="h-6 w-28 rounded-full bg-base-300" />
            </div>
            <div className="h-12 w-3/4 rounded bg-base-300" />
            <div className="h-8 w-32 rounded bg-base-300" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-base-300" />
              <div className="h-4 w-5/6 rounded bg-base-300" />
              <div className="h-4 w-2/3 rounded bg-base-300" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
