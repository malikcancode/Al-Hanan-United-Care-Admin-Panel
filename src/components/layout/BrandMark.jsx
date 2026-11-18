import Image from "next/image";

export default function BrandMark({ className = "h-10 w-10", tone = "light" }) {
  const light = tone === "light";
  return (
    <Image
      src="/logo.jpeg"
      alt=""
      width={96}
      height={96}
      priority
      className={`shrink-0 rounded-full bg-white object-contain ${light ? "ring-2 ring-white/20" : "ring-1 ring-line"} ${className}`}
    />
  );
}
