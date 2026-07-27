import Image from "next/image";
import { getPremierLeagueTeams } from "@/lib/footballData";

export async function ClubCrestStrip() {
  const teams = await getPremierLeagueTeams().catch(() => []);

  if (teams.length === 0) return null;

  return (
    <div className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-3 opacity-80">
      {teams
        .filter((team) => team.crest)
        .map((team) => (
          <Image
            key={team.id}
            src={team.crest!}
            alt={team.shortName ?? team.name}
            title={team.shortName ?? team.name}
            width={28}
            height={28}
            className="object-contain"
            unoptimized
          />
        ))}
    </div>
  );
}
