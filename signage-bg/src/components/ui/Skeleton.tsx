export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: "var(--surface-1)" }}
    />
  );
}
