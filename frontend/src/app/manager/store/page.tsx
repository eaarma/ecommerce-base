import ManagerShell from "@/components/manager/layout/ManagerShell";
import StoreCustomizationSection from "@/components/manager/store/StoreCustomizationSection";

export default function ManagerStorePage() {
  return (
    <ManagerShell
      title="Store"
      description="Customize shop identity, storefront content, branding, and SEO defaults from one manager workspace."
    >
      <StoreCustomizationSection />
    </ManagerShell>
  );
}
