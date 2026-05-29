/**
 * Awatar użytkownika — okrągły, z fallbackiem do inicjału.
 * Wielkości: xs (20px), sm (28px), md (40px), lg (64px).
 */

type Size = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, string> = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl"
};

export default function Avatar({
  url,
  name,
  size = "sm"
}: {
  url: string | null;
  name: string;
  size?: Size;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg align-middle ${sizeClass}`}
      aria-hidden="true"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold text-muted">{initial}</span>
      )}
    </span>
  );
}
