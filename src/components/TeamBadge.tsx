import Image from "next/image";

interface TeamBadgeProps {
  name: string;
  shortName: string | null;
  crest: string | null;
  size?: number;
}

export function TeamBadge({ name, shortName, crest, size = 40 }: TeamBadgeProps) {
  const displayName = shortName ?? name;

  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {crest ? (
        <Image src={crest} alt={displayName} width={size} height={size} className="object-contain" unoptimized />
      ) : (
        <div
          className="flex shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold text-black/40 dark:bg-white/10 dark:text-white/40"
          style={{ width: size, height: size }}
        >
          {displayName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="max-w-24 text-xs font-medium leading-tight sm:text-sm">{displayName}</span>
    </div>
  );
}
