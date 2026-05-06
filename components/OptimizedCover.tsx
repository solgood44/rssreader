import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  /** Square card thumb — keeps decoded weight small vs full RSS art. */
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Wrapper around next/image with conservative dimensions so we never blast
 * full 1400px artwork across list grids (CPU + bandwidth).
 */
export function OptimizedCover({ src, alt, size = 320, className, priority }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      sizes={`${Math.min(size * 2, 640)}px`}
      quality={70}
      className={className}
      priority={priority}
    />
  );
}
