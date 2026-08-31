export default function StackMark({ size = "md", showWordmark = false }: { size?: "sm" | "md" | "lg"; showWordmark?: boolean }) {
  const sizeClass = size === "sm" ? "size-7" : size === "lg" ? "size-11" : "size-8";
  const petals = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4;
    return { x: 16 + Math.cos(angle) * 10, y: 16 + Math.sin(angle) * 10 };
  });
  return <span className="inline-flex items-center gap-2.5">
    <span className={`${sizeClass} grid shrink-0 place-items-center rounded-full bg-[#ef4d23]`}>
      <svg viewBox="0 0 32 32" className={size === "lg" ? "size-8" : "size-6"} aria-hidden="true">
        {petals.map((petal, index) => <circle key={index} cx={petal.x} cy={petal.y} r="3.5" fill="white" />)}
        <circle cx="16" cy="16" r="3.5" fill="white" />
      </svg>
    </span>
    {showWordmark && <span className="text-[17px] font-semibold tracking-[-.04em]">Stack</span>}
  </span>;
}
