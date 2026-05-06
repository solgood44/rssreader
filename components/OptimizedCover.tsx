import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  /** Intrinsic dimensions for the optimizer (aspect ratio hint). */
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** Default contain so full artwork stays visible (no cropping). */
  objectFit?: "contain" | "cover";
  /**
   * When true: width 100% of parent, height auto — use for blog heroes and show headers
   * so landscape/portrait art is never clipped.
   */
  responsive?: boolean;
};

/**
 * next/image wrapper. Prefer `objectFit="contain"` + `responsive` for heroes;
 * square cards get a fixed box from parent CSS + contain.
 */
export function OptimizedCover({
  src,
  alt,
  width,
  height,
  sizes = "(max-width: 1100px) 90vw, 400px",
  className,
  priority,
  objectFit = "contain",
  responsive = false,
}: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      quality={75}
      className={className}
      priority={priority}
      style={{
        objectFit,
        ...(responsive ? { width: "100%", height: "auto", maxHeight: "min(72vh, 560px)" } : {}),
      }}
    />
  );
}
