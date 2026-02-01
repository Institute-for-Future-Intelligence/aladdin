import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from './stores/common';
import { Color } from 'three';

// 山峰参数类型
interface Peak {
  H: number; // 高度
  A: number; // x方向坡度系数
  B: number; // y方向坡度系数
  a: number; // 峰中心x坐标
  b: number; // 峰中心y坐标
}

interface TerrainProps {
  width?: number;
  depth?: number;
  segments?: number;
  peaks?: Peak[];
}

// 高度函数：h(x,y) = Σ Hi / (1 + Ai(x-ai)² + Bi(y-bi)²)
export function calculateHeight(x: number, y: number, peaks: Peak[]): number {
  return peaks.reduce((sum, peak) => {
    const { H, A, B, a, b } = peak;
    return sum + H / (1 + A * (x - a) ** 2 + B * (y - b) ** 2);
  }, 0);
}

const presetPeaks = [
  // { H: 3, A: 0.8, B: 0.8, a: 0, b: 0 }, // 主峰
  // { H: 2, A: 1.2, B: 1.0, a: 3, b: 2 }, // 副峰1
  // { H: 1.5, A: 1.5, B: 1.5, a: -2, b: 3 }, // 副峰2
  // { H: 1.8, A: 0.6, B: 1.0, a: -3, b: -2 }, // 副峰3
  // { H: 1.2, A: 2.0, B: 2.0, a: 2, b: -3 }, // 副峰4

  { H: 300, A: 0.00002, B: 0.000025, a: 100, b: 100 }, // 主峰 800m
  // { H: 100, A: 0.000015, B: 0.00002, a: -100, b: -100 }, // 副峰 600m
  { H: 255, A: 0.000018, B: 0.000022, a: 300, b: -400 }, // 副峰 450m
];

const Terrain = ({ width = 4000, depth = 4000, segments = 128, peaks = presetPeaks }: TerrainProps) => {
  const groundColor = useStore((state) => state.viewState.groundColor);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const segmentWidth = width / segments;
    const segmentDepth = depth / segments;

    // 计算最大高度用于颜色归一化
    let maxHeight = 0;
    for (const peak of peaks) {
      maxHeight += peak.H;
    }

    // 计算四条边的最大z值
    let maxEdgeZ = -Infinity;
    for (let i = 0; i <= segments; i++) {
      const x = -halfWidth + i * segmentWidth;
      const y = -halfDepth + i * segmentDepth;
      // 上边 (y = -halfDepth)
      maxEdgeZ = Math.max(maxEdgeZ, calculateHeight(x, -halfDepth, peaks));
      // 下边 (y = halfDepth)
      maxEdgeZ = Math.max(maxEdgeZ, calculateHeight(x, halfDepth, peaks));
      // 左边 (x = -halfWidth)
      maxEdgeZ = Math.max(maxEdgeZ, calculateHeight(-halfWidth, y, peaks));
      // 右边 (x = halfWidth)
      maxEdgeZ = Math.max(maxEdgeZ, calculateHeight(halfWidth, y, peaks));
    }

    // 生成顶点 (x, y, z) - xy为地面，z为高度
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = -halfWidth + i * segmentWidth;
        const y = -halfDepth + j * segmentDepth;
        let z = 0;
        if (x > -1000 && x < 1000 && y > -800 && y < 800) {
        } else {
          z = calculateHeight(x, y, peaks);
        }
        positions.push(x, y, z);

        // // 根据高度着色
        // const t = Math.min(z / (maxHeight * 0.6), 1);
        // if (t > 0.7) {
        //   colors.push(1, 1, 1); // 雪顶
        // } else if (t > 0.4) {
        //   colors.push(0.5, 0.4, 0.3); // 岩石
        // } else if (t > 0.15) {
        //   colors.push(0.2, 0.5, 0.2); // 森林
        // } else {
        //   colors.push(0.3, 0.7, 0.3); // 草地
        // }

        const t = Math.min(z / (maxHeight * 0.6), 1);
        if (t > 0.075) {
          colors.push(0.2, 0.5, 0.2); // 森林
        } else {
          const color = new Color(groundColor);
          colors.push(color.r, color.g, color.b);
        }
      }
    }

    // 生成三角面索引
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = a + 1;
        const c = a + (segments + 1);
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, [width, depth, segments, peaks, groundColor]);

  return (
    <mesh geometry={geometry} position={[0, 0, -100]}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} depthTest={true} depthWrite={true} />
    </mesh>
  );
};

const Wrapper = () => {
  const terrain = useStore((state) => state.terrain);
  console.log('terrain', terrain);
  if (terrain && terrain.length > 0) {
    return <Terrain peaks={terrain} />;
  }

  return null;
};

export default Wrapper;
