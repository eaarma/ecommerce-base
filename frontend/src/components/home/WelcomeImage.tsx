"use client";

import { ReactNode } from "react";

import { getBackgroundImageValue } from "./productVisuals";

interface WelcomeImageProps {
  imageUrl: string;
  contentPosition?: "LEFT" | "CENTER" | "RIGHT";
  overlayStrength?: number;
  children?: ReactNode;
}

const contentPositionClasses = {
  LEFT: {
    container: "justify-start",
    content: "text-left",
  },
  CENTER: {
    container: "justify-center",
    content: "text-center",
  },
  RIGHT: {
    container: "justify-end",
    content: "text-right",
  },
} as const;

const WelcomeImage: React.FC<WelcomeImageProps> = ({
  imageUrl,
  contentPosition = "LEFT",
  overlayStrength = 36,
  children,
}) => {
  const positionClasses = contentPositionClasses[contentPosition];
  const normalizedOverlayStrength = Math.min(
    100,
    Math.max(0, overlayStrength),
  );
  const leadingOverlayOpacity = normalizedOverlayStrength / 100;
  const middleOverlayOpacity = leadingOverlayOpacity * 0.4;
  const overlayStyle = {
    backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, ${leadingOverlayOpacity.toFixed(2)}) 0%, rgba(15, 23, 42, ${middleOverlayOpacity.toFixed(2)}) 38%, rgba(15, 23, 42, 0) 72%)`,
  };

  return (
    <div className="full-bleed relative z-30 w-full">
      <div className="relative w-full h-50 sm:h-60 md:h-70 lg:h-80 sm:rounded-xl overflow-hidden">
        <div
          aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center shadow-md sm:rounded-xl"
            style={{ backgroundImage: getBackgroundImageValue(imageUrl) }}
        />
        <div className="absolute inset-0" style={overlayStyle} />

        {children ? (
          <div
            className={`absolute inset-x-0 bottom-0 z-10 flex p-4 sm:p-6 lg:bottom-[8%] lg:px-8 ${positionClasses.container}`}
          >
            <div
              className={`pointer-events-auto w-full max-w-3xl ${positionClasses.content}`}
            >
              {children}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WelcomeImage;
