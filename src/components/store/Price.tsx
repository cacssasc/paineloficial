import { splitPrice } from "@/lib/format";

export function Price({ value, className = "" }: { value: number; className?: string }) {
  const { int, cents } = splitPrice(value);
  return (
    <span className={className}>
      R$ {int}
      <sup className="ml-0.5 text-[0.55em]">{cents}</sup>
    </span>
  );
}
