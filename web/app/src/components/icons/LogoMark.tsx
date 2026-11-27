export function LogoMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`inline-block shrink-0 rounded-full object-cover select-none ${className ?? ''}`}
      style={{ width: size, height: size }}
    />
  );
}
