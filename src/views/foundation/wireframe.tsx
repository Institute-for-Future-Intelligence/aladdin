import { Line } from '@react-three/drei';

interface Props {
  lx: number;
  ly: number;
  lz: number;
  slope: number;
  lineWidth?: number;
  lineColor?: string;
}

const Wireframe = ({ lx, ly, lz, slope, lineWidth, lineColor }: Props) => {
  const [hx, hy, hz] = [lx / 2, ly / 2, lz / 2];
  const slopeHeight = Math.tan(slope) * lx;
  const slopeZ = slopeHeight + hz;
  return (
    <Line
      points={[
        [-hx, -hy, -hz],
        [hx, -hy, -hz],
        // draw vertical line between faces
        [hx, -hy, slopeZ],
        [hx, -hy, -hz],
        [hx, hy, -hz],
        // draw vertical line between faces
        [hx, hy, slopeZ],
        [hx, hy, -hz],
        [-hx, hy, -hz],
        // draw vertical line between faces
        [-hx, hy, hz],
        [-hx, hy, -hz],
        [-hx, -hy, -hz],
        [-hx, -hy, hz],
        [hx, -hy, slopeZ],
        [hx, hy, slopeZ],
        [-hx, hy, hz],
        [-hx, -hy, hz],
      ]}
      name={'Wireframe'}
      userData={{ unintersectable: true }}
      lineWidth={lineWidth}
      color={lineColor}
    />
  );
};

export default Wireframe;
