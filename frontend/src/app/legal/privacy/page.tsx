export default function PrivacyPolicyPage() {
  return (
    <div className="bg-base-100 min-h-screen flex justify-center p-6">
      <div className="card max-w-3xl w-full bg-base-100 shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>

        <p className="text-sm opacity-70">
          Last updated: {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
