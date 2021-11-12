/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { DoubleSide, Euler, FontLoader, TextGeometryParameters, Vector3 } from 'three';
import { useLoader } from '@react-three/fiber';
import { Line, Ring } from '@react-three/drei';
import helvetikerFont from './fonts/helvetiker_regular.typeface.fnt';

import { WORKSPACE_SIZE } from './constants';
import { Util } from './Util';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType, ResizeHandleType } from './types';
import { ElementModel } from './models/ElementModel';

export const Grid = () => {
  const grid = useStore(Selector.grid);
  const enableOrbitController = useStore(Selector.enableOrbitController);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const viewStateGroundImage = useStore(Selector.viewState.groundImage);
  const moveHandleType = useStore(Selector.moveHandleType);
  const rotateHandleType = useStore(Selector.rotateHandleType);
  const resizeHandleType = useStore(Selector.resizeHandleType);

  const [showGrid, setShowGrid] = useState(false);
  const [showScale, setShowScale] = useState(false);
  const element = getSelectedElement();

  useEffect(() => {
    if (resizeHandleType) {
      if (
        resizeHandleType === ResizeHandleType.LowerLeftTop ||
        resizeHandleType === ResizeHandleType.LowerRightTop ||
        resizeHandleType === ResizeHandleType.UpperLeftTop ||
        resizeHandleType === ResizeHandleType.UpperRightTop
      ) {
        setShowGrid(false);
        setShowScale(true);
      } else {
        setShowGrid(true);
        setShowScale(false);
      }
    } else {
      setShowGrid(false);
      setShowScale(false);
    }
  }, [resizeHandleType]);

  // only these elements are allowed to be on the ground
  const legalOnGround = () => {
    const type = getSelectedElement()?.type;
    return (
      type === ObjectType.Foundation ||
      type === ObjectType.Cuboid ||
      type === ObjectType.Tree ||
      type === ObjectType.Human
    );
  };

  return (
    <React.Fragment>
      {(grid || !enableOrbitController) && legalOnGround() && !viewStateGroundImage && (
        <>
          {(showGrid || moveHandleType) && (
            <gridHelper
              rotation={[Math.PI / 2, 0, 0]}
              name={'Grid'}
              args={[WORKSPACE_SIZE, WORKSPACE_SIZE, 'gray', 'gray']}
            />
          )}
          {rotateHandleType && element && <PolarGrid element={element} />}
          {showScale && element && <VerticalScale element={element} />}
        </>
      )}
    </React.Fragment>
  );
};

export const PolarGrid = ({ element, height }: { element: ElementModel; height?: number }) => {
  const rotateHandle = useStore(Selector.rotateHandleType);
  const angle = useStore(Selector.selectedElementAngle);
  const getElementById = useStore(Selector.getElementById);

  const [position, setPosition] = useState<Vector3>();
  const [radius, setRadius] = useState<number>(10);

  useEffect(() => {
    if (rotateHandle) {
      const { cx, cy, lx, ly, type, parentId } = element;
      switch (type) {
        case ObjectType.SolarPanel:
          const currParent = getElementById(parentId);
          if (currParent) {
            const rcx = cx * currParent.lx;
            const rcy = cy * currParent.ly;
            setPosition(new Vector3(rcx, rcy, height ?? currParent.lz));
          }
          break;
        case ObjectType.Foundation:
          setPosition(new Vector3(cx, cy, 0));
          break;
        default:
          setPosition(new Vector3(cx, cy, 0.2));
      }
      setRadius(Math.max(5, Math.sqrt(Math.pow(lx / 2, 2) + Math.pow(ly / 2, 2)) * 1.5));
    }
  }, [rotateHandle]);

  const font = useLoader(FontLoader, helvetikerFont);
  const fontSize = radius * 0.05;
  const textGeometryParams = {
    font: font,
    height: 0.0,
    size: fontSize,
  } as TextGeometryParameters;

  const scale = new Array(25).fill(0);

  const getOffset = (i: number) => {
    if (i === 0) {
      return -fontSize * 0.3;
    } else if (i > 0 && i < 7) {
      return -fontSize * 0.8;
    } else {
      return -fontSize * 1.2;
    }
  };

  return (
    <>
      {position && (
        <group position={position} rotation={[Math.PI / 2, 0, 0]} name={'Polar Grid'}>
          <polarGridHelper args={[radius, 24, 6]} />
          <Ring args={[radius * 0.98, radius, 24, 1, Math.PI / 2, angle]} rotation={[-Util.HALF_PI, 0, 0]}>
            <meshBasicMaterial side={DoubleSide} color={'yellow'} />
          </Ring>

          {/* shown angle */}
          <group rotation={[0, angle, 0]}>
            <mesh position={[-0.5, 0, -radius * 0.9]} rotation={[-Util.HALF_PI, 0, 0]}>
              <textGeometry args={[`${Math.abs(Math.floor((angle / Math.PI) * 180))}°`, textGeometryParams]} />
            </mesh>
          </group>

          {/* scale */}
          {scale.map((v, i) => {
            const times = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
            const absTimes = Math.abs(times);
            const offset = getOffset(absTimes);
            return (
              <group key={i} rotation={[0, (times * Math.PI) / 12, 0]}>
                <mesh position={[offset, 0, -radius * 1.05]} rotation={[-Util.HALF_PI, 0, 0]}>
                  <textGeometry args={[`${15 * absTimes}°`, textGeometryParams]} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </>
  );
};

export const VerticalScale = ({ element }: { element: ElementModel }) => {
  const getResizeHandlePosition = useStore(Selector.getResizeHandlePosition);
  const getCameraDirection = useStore(Selector.getCameraDirection);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const selectedElementHeight = useStore(Selector.selectedElementHeight);

  const [position, setPostion] = useState<Vector3>();
  const [rotation, setRotation] = useState<Euler>();

  const font = useLoader(FontLoader, helvetikerFont);
  const fontSize = 0.4;
  const textGeometryParams = {
    font: font,
    height: 0.0,
    size: fontSize,
  } as TextGeometryParameters;

  useEffect(() => {
    if (resizeHandleType) {
      const handlePos = getResizeHandlePosition(element, resizeHandleType);
      const cameraDir = getCameraDirection();
      const rotation = -Math.atan2(cameraDir.x, cameraDir.y) + Math.PI;
      setPostion(new Vector3(handlePos.x, handlePos.y, 0));
      setRotation(new Euler(Math.PI / 2, 0, rotation, 'ZXY'));
    }
  }, [resizeHandleType]);

  const height = Math.ceil(selectedElementHeight) + 1;
  const shownHeight = selectedElementHeight.toFixed(1);
  const scale = new Array(height + 1).fill(0);

  return (
    <>
      {position && rotation && (
        <group position={position} rotation={rotation} name={'Vertical Scale'}>
          <Line
            points={[
              [0, 0, 0],
              [0, height, 0],
            ]}
            color={'white'}
          />
          {scale.map((e, i) => {
            const len = 0.4 + (i % 5 === 0 ? 0.4 : 0);
            const lineWidth = i % 5 === 0 ? 1.5 : 0.5;
            const posL = i > 9 ? -1.7 : -1.5;
            const posR = i > 9 ? 1 : 1.2;
            const textGeometry = <textGeometry args={[`${i}`, textGeometryParams]} />;
            return (
              <group key={i}>
                <Line
                  points={[
                    [-len, i, 0],
                    [len, i, 0],
                  ]}
                  lineWidth={lineWidth}
                  color={'white'}
                />
                <mesh position={[posL, i, 0]}>{textGeometry}</mesh>
                <mesh position={[posR, i, 0]}>{textGeometry}</mesh>
                <mesh position={[-0.5, parseFloat(shownHeight) + 0.5, 0]}>
                  <textGeometry args={[`${shownHeight}`, textGeometryParams]} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </>
  );
};

export default React.memo(Grid);
