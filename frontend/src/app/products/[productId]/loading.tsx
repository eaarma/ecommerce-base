export default function LoadingProductPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(125,211,252,0.18)_0%,rgba(249,250,251,1)_28%,rgba(249,250,251,1)_100%)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 h-11 w-44 rounded-xl bg-base-300" />

        <div className="overflow-hidden rounded-[28px] border border-base-300 bg-base-100 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-base-300 px-6 py-8 sm:px-8">
            <div className="h-4 w-24 rounded bg-base-300" />
            <div className="mt-4 h-12 w-3/4 rounded bg-base-300" />
            <div className="mt-4 h-4 w-full max-w-2xl rounded bg-base-300" />
            <div className="mt-2 h-4 w-2/3 rounded bg-base-300" />
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="space-y-6">
              <div className="rounded-[24px] border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
                <div className="aspect-[4/3] rounded-[20px] bg-base-300" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-28 rounded-[24px] bg-base-300" />
                <div className="h-28 rounded-[24px] bg-base-300" />
              </div>
            </div>

            <div className="rounded-[24px] border border-base-300 bg-base-100 p-6 shadow-sm">
              <div className="h-6 w-24 rounded bg-base-300" />
              <div className="mt-4 h-10 w-32 rounded bg-base-300" />
              <div className="mt-4 h-4 w-full rounded bg-base-300" />
              <div className="mt-2 h-4 w-4/5 rounded bg-base-300" />

              <div className="mt-6 h-40 rounded-[24px] bg-base-300" />

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="h-20 rounded-[20px] bg-base-300" />
                <div className="h-20 rounded-[20px] bg-base-300" />
              </div>

              <div className="mt-6 h-48 rounded-[24px] bg-base-300" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
