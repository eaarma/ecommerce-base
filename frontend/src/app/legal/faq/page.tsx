export default function FAQPage() {
  return (
    <div className="bg-base-100 min-h-screen flex justify-center p-6">
      <div className="card max-w-3xl w-full bg-base-100 shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">question1?</h2>
          <p>answer1</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">question2?</h2>
          <p>answer2</p>
        </section>

        <p className="text-sm opacity-70">
          Last updated: {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
