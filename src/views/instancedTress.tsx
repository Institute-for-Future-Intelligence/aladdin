import { Instance, Instances } from '@react-three/drei';
import { useMemo } from 'react';
import { DEFAULT_LEAF_OFF_DAY, DEFAULT_LEAF_OUT_DAY } from 'src/constants';
import { InstancedTree } from 'src/models/InstancedModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Util } from 'src/Util';

interface InstancedTreesProps {
  trees: InstancedTree[];
}

const PARK_TREE = {
  trunkWidth: 0.75,
  trunkHeight: 6,
  dodecahedronRadius: 3,
  dodecahedronDetail: 0,
  bodyScale: [1, 1, 1.8] as [number, number, number],
  trunkColor: '#5c3a1e',
};

const STREET_TREE = {
  trunkWidth: 0.5,
  trunkHeight: 7,
  dodecahedronRadius: 3.5,
  dodecahedronDetail: 0,
  bodyScale: [1, 1, 2] as [number, number, number],
  trunkColor: '#5c3a1e',
};

// Simple hash to get a deterministic random number from a string id
const hashToRandom = (id: string, seed: number = 0): number => {
  let hash = seed;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ((hash & 0x7fffffff) % 10000) / 10000; // 0~1
};

// Green palette for spring/summer (from 240+ Shades of Green chart)
const GREEN_PALETTE = [
  '#90EE90', // Light Green
  '#006400', // Dark Green
  '#708238', // Olive Green
  '#50C878', // Emerald Green
  '#98FB98', // Mint Green
  '#33B864', // Cool Green
  '#01796F', // Pine Green
  '#4CBB17', // Kelly Green
  '#4B5320', // Army Green
  '#2E8B57', // Sea Green
  '#9ACD32', // Yellow Green
  '#00563B', // Castleton Green
  '#228B22', // Forest Green
  '#355E3B', // Hunter Green
  '#088F8F', // Blue Green
  '#9FE2BF', // Seafoam Green
  '#2FF924', // Lightsaber Green
];

// Orange palette for autumn (from 100+ Shades of Orange chart)
const ORANGE_PALETTE = [
  '#E34234', // Vermillion
  '#F28500', // Tangerine
  '#FF7F50', // Coral
  '#FBCEB1', // Apricot
  '#FFBF00', // Amber
  '#FFE5B4', // Peach
  '#FF7900', // Safety Orange
  '#F4C430', // Saffron
  '#FF7518', // Pumpkin Orange
  '#B7410E', // Rust
  '#FEBA4F', // Pastel Orange
  '#F89880', // Pink Orange
  '#FA8072', // Salmon
  '#F04A00', // International Orange
  '#BF5700', // Burnt Orange
  '#FF5F1F', // Neon Orange
];

// Winter bare brown color
const WINTER_COLOR = '#8B7355';

// Determine season from dayOfYear (already adjusted for hemisphere)
// Spring: 90~150, Summer: 150~270, Autumn: 270~330, Winter: 330~90
const getSeason = (dayOfYear: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
  if (dayOfYear >= 90 && dayOfYear < 150) return 'spring';
  if (dayOfYear >= 150 && dayOfYear < 270) return 'summer';
  if (dayOfYear >= 270 && dayOfYear < 330) return 'autumn';
  return 'winter';
};

// Pick a color from palette using deterministic hash
const pickFromPalette = (palette: string[], id: string, seed: number = 0): string => {
  const index = Math.floor(hashToRandom(id, seed) * palette.length);
  return palette[index];
};

// Generate a seasonal color for park tree canopy by picking from palettes
const getParkBodyColor = (id: string, dayOfYear: number): string => {
  const season = getSeason(dayOfYear);
  if (season === 'spring' || season === 'summer') {
    return pickFromPalette(GREEN_PALETTE, id, 1);
  } else if (season === 'autumn') {
    return pickFromPalette(ORANGE_PALETTE, id, 1);
  }
  return WINTER_COLOR;
};

// Generate a seasonal color for street tree canopy by picking from palettes
const getStreetBodyColor = (id: string, dayOfYear: number): string => {
  const season = getSeason(dayOfYear);
  if (season === 'spring' || season === 'summer') {
    return pickFromPalette(GREEN_PALETTE, id, 2);
  } else if (season === 'autumn') {
    return pickFromPalette(ORANGE_PALETTE, id, 2);
  }
  return WINTER_COLOR;
};

const InstancedTrees = ({ trees }: InstancedTreesProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const date = useStore(Selector.world.date);
  const latitude = useStore(Selector.world.latitude);
  const leafDayOfYear1 = useStore(Selector.world.leafDayOfYear1) ?? DEFAULT_LEAF_OUT_DAY;
  const leafDayOfYear2 = useStore(Selector.world.leafDayOfYear2) ?? DEFAULT_LEAF_OFF_DAY;

  // Compute day of year, adjusted for hemisphere
  const dayOfYear = useMemo(() => {
    const doy = Util.dayOfYear(new Date(date));
    // For southern hemisphere, shift by 182 days so seasons match
    return latitude < 0 ? (doy + 182) % 365 : doy;
  }, [date, latitude]);

  // Whether trees should show leaves at all
  const noLeaves = useMemo(() => {
    const doy = Util.dayOfYear(new Date(date));
    return latitude > 0 ? doy < leafDayOfYear1 || doy > leafDayOfYear2 : doy >= leafDayOfYear1 && doy <= leafDayOfYear2;
  }, [date, leafDayOfYear1, leafDayOfYear2, latitude]);

  const parkTrees = useMemo(() => trees.filter((t) => t.treeType !== 'street'), [trees]);
  const streetTrees = useMemo(() => trees.filter((t) => t.treeType === 'street'), [trees]);

  // Pre-compute random values for park trees: rotation, height scale, body color
  const parkTreeData = useMemo(
    () =>
      parkTrees.map((t) => ({
        rotation: Math.random() * Math.PI * 2,
        heightScale: 0.75 + hashToRandom(t.id, 4) * 0.5, // 0.75 ~ 1.25
        radiusScale: 0.9 + hashToRandom(t.id, 5) * 0.2, // 0.9 ~ 1.1
        bodyColor: getParkBodyColor(t.id, dayOfYear),
      })),
    [parkTrees, dayOfYear],
  );

  const streetTreeColors = useMemo(
    () => streetTrees.map((t) => getStreetBodyColor(t.id, dayOfYear)),
    [streetTrees, dayOfYear],
  );

  // Pre-compute random values for street trees: rotation, height scale, radius scale
  const streetTreeData = useMemo(
    () =>
      streetTrees.map((t) => ({
        rotation: Math.random() * Math.PI * 2,
        heightScale: 0.85 + hashToRandom(t.id, 6) * 0.3, // 0.85 ~ 1.15
        radiusScale: 0.9 + hashToRandom(t.id, 7) * 0.2, // 0.9 ~ 1.1
      })),
    [streetTrees],
  );

  return (
    <group name="Instanced Models">
      {/* Park tree trunks */}
      <Instances limit={2000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        <boxGeometry />
        <meshStandardMaterial />
        {parkTrees.map((model, i) => {
          const { heightScale } = parkTreeData[i];
          const trunkHeight = PARK_TREE.trunkHeight * heightScale;
          return (
            <Instance
              key={model.id}
              position={[model.cx, model.cy, trunkHeight / 2]}
              scale={[PARK_TREE.trunkWidth, PARK_TREE.trunkWidth, trunkHeight]}
              color={PARK_TREE.trunkColor}
            />
          );
        })}
      </Instances>

      {/* Park tree canopies */}
      {!noLeaves && (
        <Instances limit={2000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
          <dodecahedronGeometry args={[PARK_TREE.dodecahedronRadius, PARK_TREE.dodecahedronDetail]} />
          <meshStandardMaterial />
          {parkTrees.map((model, i) => {
            const { rotation, heightScale, radiusScale, bodyColor } = parkTreeData[i];
            const trunkHeight = PARK_TREE.trunkHeight * heightScale;
            const canopyOffsetZ = PARK_TREE.dodecahedronRadius * PARK_TREE.bodyScale[2] * heightScale * 0.6;
            return (
              <Instance
                key={model.id}
                scale={
                  PARK_TREE.bodyScale.map((s, j) => (j === 2 ? s * heightScale : s * heightScale * radiusScale)) as [
                    number,
                    number,
                    number,
                  ]
                }
                position={[model.cx, model.cy, trunkHeight + canopyOffsetZ]}
                rotation={[0, 0, rotation]}
                color={bodyColor}
              />
            );
          })}
        </Instances>
      )}

      {/* Street tree trunks */}
      <Instances limit={2000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
        <boxGeometry />
        <meshStandardMaterial />
        {streetTrees.map((model, i) => {
          const { heightScale } = streetTreeData[i];
          const trunkHeight = STREET_TREE.trunkHeight * heightScale;
          return (
            <Instance
              key={model.id}
              position={[model.cx, model.cy, trunkHeight / 2]}
              scale={[STREET_TREE.trunkWidth, STREET_TREE.trunkWidth, trunkHeight]}
              color={STREET_TREE.trunkColor}
            />
          );
        })}
      </Instances>

      {/* Street tree canopies */}
      {!noLeaves && (
        <Instances limit={2000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
          <dodecahedronGeometry args={[STREET_TREE.dodecahedronRadius, STREET_TREE.dodecahedronDetail]} />
          <meshStandardMaterial />
          {streetTrees.map((model, i) => {
            const { rotation, heightScale, radiusScale } = streetTreeData[i];
            const trunkHeight = STREET_TREE.trunkHeight * heightScale;
            const canopyOffsetZ = STREET_TREE.dodecahedronRadius * STREET_TREE.bodyScale[2] * heightScale * 0.6;
            return (
              <Instance
                key={model.id}
                scale={
                  STREET_TREE.bodyScale.map((s, j) => (j === 2 ? s * heightScale : s * heightScale * radiusScale)) as [
                    number,
                    number,
                    number,
                  ]
                }
                position={[model.cx, model.cy, trunkHeight + canopyOffsetZ]}
                rotation={[0, 0, rotation]}
                color={streetTreeColors[i]}
              />
            );
          })}
        </Instances>
      )}
    </group>
  );
};

export default InstancedTrees;
