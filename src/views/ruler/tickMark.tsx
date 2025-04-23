import { Line } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FontLoader, Line2, LineGeometry, LineSegments2, TextGeometryParameters } from 'three/examples/jsm/Addons';
//@ts-expect-error ignore
import helvetikerFont from '../../assets/helvetiker_regular.typeface.fnt';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/hooks';
import { Vector3 } from 'three';

interface Props {
  length: number;
}

export interface TickMarkRef {
  update: (l: number) => void;
}

const TickMark = forwardRef<TickMarkRef, Props>(({ length }: Props, ref) => {
  const [_length, setLength] = useState(length);
  const lengthMemoRef = useRef(length);
  const _lengthMemoRef = useRef(length);

  // have to do this for performance issue. l is the true value of the tick mark.
  let l = length;
  if (lengthMemoRef.current !== length) {
    lengthMemoRef.current = length;
    l = length;
  } else if (_lengthMemoRef.current !== _length) {
    _lengthMemoRef.current = _length;
    l = _length;
  }

  const tickMarks = useMemo(() => {
    const len = Math.floor(l) + 1;
    const arr = new Array(len).fill(0);
    const offset = l / 2;
    for (let i = 0; i < arr.length; i++) {
      arr[i] = -offset + i;
    }
    return arr;
  }, [l]);

  const font = useLoader(FontLoader, helvetikerFont);
  const textGeometryParamsTickLabel = {
    font: font,
    height: 0,
    size: 0.2,
  } as TextGeometryParameters;

  useImperativeHandle(ref, () => ({
    update(l) {
      if (l !== _length) {
        setLength(l);
      }
    },
  }));

  const lang = useLanguage();

  return (
    <>
      <group position={[0, 0, 0.002]}>
        <Line
          userData={{ unintersectable: true }}
          points={[
            [-l / 2, 0, 0],
            [l / 2, 0, 0],
          ]}
          lineWidth={1}
          color={'Black'}
        />
        {tickMarks.map((x, i) => {
          const textGeometry = <textGeometry args={[`${i}`, textGeometryParamsTickLabel]} />;
          return (
            <group key={i}>
              <Line
                userData={{ unintersectable: true }}
                points={[
                  [x, -0.2, 0],
                  [x, 0, 0],
                ]}
                lineWidth={1}
                color={'Black'}
              />
              <mesh position={[x - 0.1, -0.5, 0]} userData={{ unintersectable: true }}>
                {textGeometry}
                <meshBasicMaterial color={'Black'} />
              </mesh>

              {x + 0.5 < _length / 2 && (
                <Line
                  userData={{ unintersectable: true }}
                  points={[
                    [x + 0.5, -0.1, 0],
                    [x + 0.5, 0, 0],
                  ]}
                  lineWidth={0.5}
                  color={'Black'}
                />
              )}
            </group>
          );
        })}
      </group>

      <textSprite
        userData={{ unintersectable: true }}
        backgroundColor={'darkorchid'}
        fontSize={Math.max(30, length)}
        fontFace={'Times Roman'}
        textHeight={Math.max(0.5, length / 60)}
        text={l.toFixed(1) + i18n.t('word.MeterAbbreviation', lang)}
        position={[0, -1, 0.25]}
      />
    </>
  );
});

export default TickMark;
