"use client";

import Link from "next/link";
import TitleText from "@/components/common/TitleText";
import type { ShopPublicDto } from "@/types/shop";

type FooterProps = {
  shop: ShopPublicDto;
};

const Footer: React.FC<FooterProps> = ({ shop }) => {
  const supportEmail = shop.showSupportEmail
    ? shop.supportEmail?.trim() || shop.contactEmail?.trim()
    : null;
  const phoneNumber = shop.showPhone ? shop.phoneNumber?.trim() : null;
  const brandImage = shop.logoUrl?.trim() || null;

  return (
    <footer className="bg-base-100 border-t">
      <div className="page-container py-6">
        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          {/* Links section */}
          <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
            <Link href="/legal/faq" className="link link-hover">
              FAQ
            </Link>
            <Link href="/legal/terms" className="link link-hover">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="link link-hover">
              Privacy Policy
            </Link>
            <Link href="/legal/refund" className="link link-hover">
              Cancellation & Refund Policy
            </Link>
            <Link href="/legal/shipping-policy" className="link link-hover">
              Shipping Policy
            </Link>
          </div>

          <TitleText title={shop.storeName} image={brandImage} />

          {(shop.tagline || supportEmail || phoneNumber) && (
            <div className="mt-3 space-y-1 text-sm text-base-content/65">
              {shop.tagline && <p>{shop.tagline}</p>}
              {supportEmail && (
                <p>
                  <a className="link link-hover" href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                </p>
              )}
              {phoneNumber && <p>{phoneNumber}</p>}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
