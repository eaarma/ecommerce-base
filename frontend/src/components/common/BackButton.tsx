"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  fallbackUrl = "/",
  label = "Back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <div className={`mb-4 flex justify-start self-start ${className}`}>
      <button
        onClick={handleBack}
        className="btn btn-outline btn-primary btn-md flex w-fit items-center gap-2 transition-all hover:gap-3 shadow-sm hover:shadow-md"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </button>
    </div>
  );
}
