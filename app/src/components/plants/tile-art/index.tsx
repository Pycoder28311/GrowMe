import type { TileArt } from '@/config/plant-tiles';

import { AromaticArt, ClimbingArt, DifficultyArt, FoodArt, KindArt, OrnamentalArt, SizeArt, SucculentArt } from './plants';
import { FrostArt, SeasonArt, WindArt } from './weather';

export { ART } from './layer';

/** One tile animation, drawn in code (no background); still while not `playing` */
export function TileArtView({ art, playing }: { art: TileArt; playing: boolean }) {
  switch (art.kind) {
    case 'wind':
      return <WindArt level={art.level} playing={playing} />;
    case 'season':
      return <SeasonArt season={art.season} playing={playing} />;
    case 'climbing':
      return <ClimbingArt playing={playing} />;
    case 'ornamental':
      return <OrnamentalArt playing={playing} />;
    case 'aromatic':
      return <AromaticArt playing={playing} />;
    case 'frost':
      return <FrostArt playing={playing} />;
    case 'food':
      return <FoodArt edible={art.value} playing={playing} />;
    case 'succulent':
      return <SucculentArt succulent={art.value} playing={playing} />;
    case 'plantKind':
      return <KindArt kind={art.value} playing={playing} />;
    case 'difficulty':
      return <DifficultyArt difficulty={art.value} playing={playing} />;
    case 'size':
      return <SizeArt size={art.value} playing={playing} />;
  }
}
