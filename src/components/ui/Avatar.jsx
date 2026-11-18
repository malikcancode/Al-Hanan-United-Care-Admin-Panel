const initials = (name = "") =>
  name
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/^\s*(dr|prof)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export default function Avatar({ src, alt = "", name, size = "h-12 w-12", rounded = "rounded-full", text = "text-sm" }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`${size} ${rounded} shrink-0 bg-canvas object-cover`} />;
  }

  return (
    <span
      className={`${size} ${rounded} ${text} flex shrink-0 items-center justify-center bg-brand-50 font-semibold text-brand-700`}
      aria-hidden="true"
    >
      {initials(name || alt) || "—"}
    </span>
  );
}
