import { Instance, Instances } from '@react-three/drei';
import { useMemo } from 'react';
import { DEFAULT_LEAF_OFF_DAY, DEFAULT_LEAF_OUT_DAY } from 'src/constants';
import { InstancedTree } from 'src/models/InstancedModel';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Util } from 'src/Util';
import { Color } from 'three';

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

// Seasonal base colors for tree canopies (HSL)
// dayOfYear is already adjusted for hemisphere
const getSeasonalBaseHSL = (dayOfYear: number): { h: number; s: number; l: number } => {
  // Spring: day 90~150, Summer: 150~270, Autumn: 270~330, Winter: 330~90
  if (dayOfYear >= 90 && dayOfYear < 150) {
    // Spring: fresh light green, interpolate from winter-brown to summer-green
    const t = (dayOfYear - 90) / 60;
    return { h: 0.2 + t * 0.1, s: 0.4 + t * 0.4, l: 0.35 + t * 0.05 };
  } else if (dayOfYear >= 150 && dayOfYear < 270) {
    // Summer: deep green
    return { h: 0.3, s: 0.8, l: 0.25 };
  } else if (dayOfYear >= 270 && dayOfYear < 330) {
    // Autumn: green -> orange dominant
    const t = (dayOfYear - 270) / 60;
    return { h: 0.25 - t * 0.17, s: 0.85 - t * 0.15, l: 0.3 + t * 0.1 };
  } else {
    // Winter: bare brown / muted
    return { h: 0.08, s: 0.4, l: 0.35 };
  }
};

// Generate a seasonal + random color variation for park tree canopy
const getParkBodyColor = (id: string, dayOfYear: number): string => {
  const base = getSeasonalBaseHSL(dayOfYear);
  // Random variation on top of seasonal base
  const h = base.h + (hashToRandom(id, 1) - 0.5) * 0.1;
  const s = base.s + (hashToRandom(id, 2) - 0.5) * 0.3;
  const l = base.l * 1.3 + (hashToRandom(id, 3) - 0.5) * 0.15;
  const color = new Color();
  color.setHSL(h, Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, l)));
  return '#' + color.getHexString();
};

// Generate a seasonal color for street tree canopy (no per-tree randomness, darker than park trees)
const getStreetBodyColor = (dayOfYear: number): string => {
  const base = getSeasonalBaseHSL(dayOfYear);
  const color = new Color();
  color.setHSL(base.h, Math.max(0, Math.min(1, base.s)), Math.max(0, Math.min(1, base.l * 0.7)));
  return '#' + color.getHexString();
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

  const streetBodyColor = useMemo(() => getStreetBodyColor(dayOfYear), [dayOfYear]);

  // Pre-compute random rotation for street trees
  const streetTreeRotations = useMemo(() => streetTrees.map(() => Math.random() * Math.PI * 2), [streetTrees]);

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
        {streetTrees.map((model, i) => (
          <Instance
            key={model.id}
            position={[model.cx, model.cy, STREET_TREE.trunkHeight / 2]}
            scale={[STREET_TREE.trunkWidth, STREET_TREE.trunkWidth, STREET_TREE.trunkHeight]}
            color={STREET_TREE.trunkColor}
          />
        ))}
      </Instances>

      {/* Street tree canopies */}
      {!noLeaves && (
        <Instances limit={2000} castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
          <dodecahedronGeometry args={[STREET_TREE.dodecahedronRadius, STREET_TREE.dodecahedronDetail]} />
          <meshStandardMaterial />
          {streetTrees.map((model, i) => (
            <Instance
              key={model.id}
              scale={STREET_TREE.bodyScale}
              position={[
                model.cx,
                model.cy,
                STREET_TREE.trunkHeight + STREET_TREE.dodecahedronRadius * STREET_TREE.bodyScale[2] * 0.6,
              ]}
              rotation={[0, 0, streetTreeRotations[i]]}
              color={streetBodyColor}
            />
          ))}
        </Instances>
      )}
    </group>
  );
};

export default InstancedTrees;
