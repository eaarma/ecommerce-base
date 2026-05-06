import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import { getPublicShopOrFallback } from "@/lib/shopService";
import { buildStoreMetadata } from "@/lib/storeSeo";
import { getPublicStorePageOrFallback } from "@/lib/storePageService";
import StructuredText from "@/components/common/StructuredText";

function buildAddressLines(shop: Awaited<ReturnType<typeof getPublicShopOrFallback>>) {
  const lines = [
    shop.addressLine1,
    shop.addressLine2,
    [shop.city, shop.postalCode].filter(Boolean).join(", ") || null,
    shop.country,
  ];

  return lines.filter((line): line is string => Boolean(line?.trim()));
}

export async function generateMetadata(): Promise<Metadata> {
  const [shop, contactPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("contact"),
  ]);

  return buildStoreMetadata({
    shop,
    pageTitle: contactPage.title,
    description: contactPage.description,
    fallbackDescription: shop.shortDescription,
  });
}

export default async function ContactPage() {
  const [shop, contactPage] = await Promise.all([
    getPublicShopOrFallback(),
    getPublicStorePageOrFallback("contact"),
  ]);
  const content = contactPage.contentJson;
  const supportEmail = shop.showSupportEmail ? shop.supportEmail?.trim() || null : null;
  const contactEmail = shop.showSupportEmail ? shop.contactEmail?.trim() || null : null;
  const primaryEmail = supportEmail ?? contactEmail;
  const secondaryEmail =
    supportEmail && contactEmail && supportEmail !== contactEmail
      ? contactEmail
      : null;
  const phoneNumber = shop.showPhone ? shop.phoneNumber?.trim() || null : null;
  const addressLines = shop.showAddress ? buildAddressLines(shop) : [];
  const businessHours = shop.businessHours?.trim() || null;
  const introText =
    content.intro?.trim() ||
    contactPage.description?.trim() ||
    shop.shortDescription?.trim() ||
    shop.longDescription?.trim() ||
    "We'd love to hear from you. Whether you have a question about products, support, or the store itself, feel free to get in touch.";
  const detailsTitle = content.detailsTitle?.trim() || "Contact details";
  const detailsDescription =
    content.detailsDescription?.trim() ||
    "Use the information below for direct support or general store questions.";
  const formTitle = content.formTitle?.trim() || "Message";
  const formDescription = content.formDescription?.trim() || null;

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-6 mt-4 sm:mt-6">
      <section className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
          {shop.storeName}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
          {contactPage.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-base-content/70">
          {introText}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <section className="rounded-[28px] border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-base-content">
            {detailsTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-base-content/60">
            {detailsDescription}
          </p>

          <div className="mt-6 grid gap-4">
            {primaryEmail && (
              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Support
                </p>
                <a
                  className="mt-2 inline-block text-base font-medium text-base-content hover:text-primary"
                  href={`mailto:${primaryEmail}`}
                >
                  {primaryEmail}
                </a>
              </div>
            )}

            {secondaryEmail && (
              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  General contact
                </p>
                <a
                  className="mt-2 inline-block text-base font-medium text-base-content hover:text-primary"
                  href={`mailto:${secondaryEmail}`}
                >
                  {secondaryEmail}
                </a>
              </div>
            )}

            {phoneNumber && (
              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Phone
                </p>
                <a
                  className="mt-2 inline-block text-base font-medium text-base-content hover:text-primary"
                  href={`tel:${phoneNumber}`}
                >
                  {phoneNumber}
                </a>
              </div>
            )}

            {addressLines.length > 0 && (
              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Address
                </p>
                <div className="mt-2 space-y-1 text-sm leading-6 text-base-content/75">
                  {addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {businessHours && (
              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Business hours
                </p>
                <StructuredText
                  text={businessHours}
                  className="mt-2 text-sm text-base-content/75"
                  paragraphClassName="leading-6 whitespace-pre-line"
                  listClassName="list-disc space-y-1 pl-5"
                />
              </div>
            )}

            {!primaryEmail &&
              !secondaryEmail &&
              !phoneNumber &&
              addressLines.length === 0 &&
              !businessHours && (
              <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/25 p-4 text-sm text-base-content/60">
                Contact details have not been configured yet. You can still use
                the form and the message will be routed through the store inbox.
              </div>
            )}
          </div>

          {contactPage.closingNote?.trim() ? (
            <StructuredText
              text={contactPage.closingNote}
              className="mt-6 rounded-2xl border border-base-300 bg-base-200/35 p-4 text-sm text-base-content/65"
              paragraphClassName="leading-6 whitespace-pre-line"
              listClassName="list-disc space-y-1 pl-5"
            />
          ) : null}
        </section>

        <ContactForm
          recipientHint={shop.showSupportEmail ? primaryEmail : null}
          storeName={shop.storeName}
          title={formTitle}
          description={formDescription}
        />
      </div>
    </div>
  );
}
