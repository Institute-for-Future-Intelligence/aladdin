/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useLoader } from '@react-three/fiber';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { Euler, Vector3 } from 'three';
import { FontLoader, TextGeometryParameters } from 'three/examples/jsm/Addons';
// @ts-expect-error
import helvetikerFont from 'src/assets/helvetiker_regular.typeface.fnt';
import { Line } from '@react-three/drei';
import { HALF_PI } from 'src/constants';
import { ResizeHandleType } from 'src/types';
import { useStore } from 'src/stores/common';
import { HandleType } from './handlesGroup';

export interface VerticalRulerRef {
  updateLz: (lz: number) => void;
}

interface Props {
  id: string;
  fId: string;
  hx: number;
  hy: number;
  lz: number;
  handle: HandleType;
}

const VerticalRuler = forwardRef<VerticalRulerRef, Props>((args, ref) => {
  const color = 'lightGray';
  const font = useLoader(FontLoader, helvetikerFont);
  const textGeometryParamsTickLabel = {
    font: font,
    height: 0,
    size: 0.2,
  } as TextGeometryParameters;
  const textGeometryParams = {
    font: font,
    height: 0,
    size: 0.35,
  } as TextGeometryParameters;

  const [lz, setLz] = useState(args.lz);

  const position = getPosition(args.handle);
  const rotation = getRotation();
  const rulerLength = Math.ceil(lz) + 1;
  const heightText = `${lz.toFixed(1)} m`;
  const textPositionZ = lz - 0.175;
  const tickLabels = new Array(rulerLength + 1).fill(0);

  useImperativeHandle(ref, () => ({
    updateLz: (lz) => {
      setLz(lz);
    },
  }));

  function getPosition(handleType: HandleType) {
    const { hx, hy } = args;
    switch (handleType) {
      case ResizeHandleType.LowerLeftTop:
        return new Vector3(-hx, -hy, 0);
      case ResizeHandleType.LowerRightTop:
        return new Vector3(hx, -hy, 0);
      case ResizeHandleType.UpperLeftTop:
        return new Vector3(-hx, hy, 0);
      case ResizeHandleType.UpperRightTop:
        return new Vector3(hx, hy, 0);
      default:
        return new Vector3();
    }
  }

  function getRotation() {
    const cameraDirection = useStore.getState().cameraDirection;
    const camRot = -Math.atan2(cameraDirection.x, cameraDirection.y) + Math.PI;
    const worldRot = useStore.getState().elements.reduce((acc, curr) => {
      if (curr.id === args.id || curr.id === args.fId) {
        acc += curr.rotation[2];
      }
      return acc;
    }, 0);
    return new Euler(HALF_PI, 0, camRot - worldRot, 'ZXY');
  }

  return (
    <group position={position} rotation={rotation} name={'Vertical Ruler'}>
      <Line
        userData={{ unintersectable: true }}
        points={[
          [0, 0, 0],
          [0, rulerLength, 0],
        ]}
        color={color}
      />
      <mesh position={[-1.5, textPositionZ, 0]} userData={{ unintersectable: true }}>
        <textGeometry args={[heightText, textGeometryParams]} />
        <meshBasicMaterial attach="material" color={'white'} />
      </mesh>
      {tickLabels.map((e, i) => {
        const len = 0.2 + (i % 5 === 0 ? 0.05 : 0);
        const textGeometry = <textGeometry args={[`${i}`, textGeometryParamsTickLabel]} />;
        return (
          <group key={i}>
            <Line
              userData={{ unintersectable: true }}
              points={[
                [-len, i, 0],
                [len, i, 0],
              ]}
              lineWidth={0.5}
              color={color}
            />
            <mesh position={[0.4, i - 0.125, 0]} userData={{ unintersectable: true }}>
              {textGeometry}
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});

export default VerticalRuler;

// export const VerticalRuler = React.memo(() => {
//   const cameraDirection = useStore(Selector.cameraDirection);
//   const resizeHandleType = useStore(Selector.resizeHandleType);
//   const hoveredHandle = useStore(Selector.hoveredHandle);

//   const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);

//   const isRoof = element.type === ObjectType.Roof;
//   const color = 'lightGray';
//   const font = useLoader(FontLoader, helvetikerFont);
//   const textGeometryParamsTickLabel = {
//     font: font,
//     height: 0,
//     size: 0.2,
//   } as TextGeometryParameters;
//   const textGeometryParams = {
//     font: font,
//     height: 0,
//     size: 0.35,
//   } as TextGeometryParameters;

//   const position = useMemo(() => {
//     const handle = resizeHandleType ?? hoveredHandle;
//     return getResizeHandlePosition(element, handle as ResizeHandleType);
//   }, [resizeHandleType, hoveredHandle]);

//   const rotation = useMemo(() => {
//     const rotation = -Math.atan2(cameraDirection.x, cameraDirection.y) + Math.PI;
//     return new Euler(HALF_PI, 0, rotation, 'ZXY');
//   }, [cameraDirection.x, cameraDirection.y]);

//   const getRulerLength = () => {
//     let height = element.lz;
//     if (isRoof) {
//       height = useStore.getState().selectedElementHeight;
//     }
//     return Math.ceil(height) + 1;
//   };

//   const getHeightText = () => {
//     let height = element.lz;
//     if (isRoof) {
//       height = (element as RoofModel).rise;
//     }
//     return height.toFixed(1) + ' m';
//   };

//   const getTextPositionZ = () => {
//     if (isRoof) {
//       return useStore.getState().selectedElementHeight + 1;
//     }
//     return element.lz - 0.175;
//   };

//   if (!resizeHandleType && !hoveredHandle) return null;

//   const rulerLength = getRulerLength();
//   const heightText = getHeightText();
//   const textPositionZ = getTextPositionZ();
//   const tickLabels = new Array(rulerLength + 1).fill(0);

//   return (
//     <group position={position} rotation={rotation} name={'Vertical Ruler'}>
//       <Line
//         userData={{ unintersectable: true }}
//         points={[
//           [0, 0, 0],
//           [0, rulerLength, 0],
//         ]}
//         color={color}
//       />
//       <mesh position={[-1.5, textPositionZ, 0]} userData={{ unintersectable: true }}>
//         <textGeometry args={[heightText, textGeometryParams]} />
//         <meshBasicMaterial attach="material" color={'white'} />
//       </mesh>
//       {tickLabels.map((e, i) => {
//         const len = 0.2 + (i % 5 === 0 ? 0.05 : 0);
//         const textGeometry = <textGeometry args={[`${i}`, textGeometryParamsTickLabel]} />;
//         return (
//           <group key={i}>
//             <Line
//               userData={{ unintersectable: true }}
//               points={[
//                 [-len, i, 0],
//                 [len, i, 0],
//               ]}
//               lineWidth={0.5}
//               color={color}
//             />
//             {!isRoof && (
//               <mesh position={[0.4, i - 0.125, 0]} userData={{ unintersectable: true }}>
//                 {textGeometry}
//                 <meshBasicMaterial attach="material" color={color} />
//               </mesh>
//             )}
//           </group>
//         );
//       })}
//     </group>
//   );
// });
