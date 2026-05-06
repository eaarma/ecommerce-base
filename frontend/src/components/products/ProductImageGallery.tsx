"use client";

import { useRef, useState } from "react";

interface ProductImageGalleryProps {
  images?: string[];
  title?: string;
}

export default function ProductImageGallery({
  images = [],
  title,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const placeholder = "/images/item_placeholder.jpg";
  const safeSelectedIndex =
    images.length === 0 ? 0 : Math.min(selectedIndex, images.length - 1);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX.current;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const mainImage = images.length > 0 ? images[safeSelectedIndex] : placeholder;
  const isPlaceholder = images.length === 0;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="w-full">
        <img
          src={mainImage}
          alt={title || "Product Image"}
          className={`h-72 w-full rounded-xl object-cover shadow-md lg:h-[420px] ${
            isPlaceholder ? "grayscale opacity-70" : ""
          }`}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.src = placeholder;
            img.classList.add("opacity-70", "grayscale", "blur-[1px]");
          }}
        />
      </div>

      {images.length > 1 && (
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="flex w-full max-w-full cursor-grab select-none gap-3 overflow-x-auto pb-2 active:cursor-grabbing"
        >
          {images.map((img, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                safeSelectedIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="pointer-events-none h-20 w-28 object-cover"
                onError={(e) => {
                  const thumb = e.currentTarget as HTMLImageElement;
                  thumb.src = placeholder;
                  thumb.classList.add("opacity-70", "grayscale", "blur-[1px]");
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
