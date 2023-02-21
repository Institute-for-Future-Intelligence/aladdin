/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie, Xiaotong Ding
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import { Canvas } from '@react-three/fiber';
import Sky from './views/sky';
import Axes from './views/axes';
import ElementsRenderer from './elementsRenderer';
import Ground from './views/ground';
import Heliodon from './views/heliodonWrapper';
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from './mainMenu';
import { VERSION } from './constants';
import { visitHomepage, visitIFI } from './helpers';
import AcceptCookie from './acceptCookie';
import GroundImage from './views/groundImage';
import DropdownContextMenu from './components/contextMenu';
import { DesignProblem, EvolutionMethod } from './types';
import MainToolBar from './mainToolBar';
import ActionLogger from './actionLogger';
import Lights from './lights';
import { Auxiliary } from './auxiliary';
import CompassContainer from './compassContainer';
import i18n from './i18n/i18n';
import KeyboardListener from './keyboardListener';
import CloudImage from './assets/cloud.png';
import SceneRadiusCalculator from './sceneRadiusCalculator';
import { UndoableChange } from './undo/UndoableChange';
import CameraController from './cameraController';
import { useRefStore } from './stores/commonRef';
import { UndoableCameraChange } from './undo/UndoableCameraChange';
import ShareLink from './shareLinks';
import SolarPanelTiltAngleGa from './ai/ga/solarPanelTiltAngleGa';
import SolarPanelArrayGa from './ai/ga/solarPanelArrayGa';
import SolarPanelTiltAnglePso from './ai/pso/solarPanelTiltAnglePso';
import SolarPanelArrayPso from './ai/pso/solarPanelArrayPso';
import PointerStyleController from './pointerStyleController';
import Loading from './loading';
import Panels from './panels';
import Simulations from './simulations';

export interface AppCreatorProps {
  viewOnly: boolean;
}

const AppCreator = ({ viewOnly = false }: AppCreatorProps) => {
  const user = useStore(Selector.user);
  const loggable = useStore(Selector.loggable);
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const changed = useStore(Selector.changed);
  const addUndoable = useStore(Selector.addUndoable);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const sceneRadius = useStore(Selector.sceneRadius);
  const cloudFile = useStore(Selector.cloudFile);
  const axes = useStore(Selector.viewState.axes);
  const theme = useStore(Selector.viewState.theme);
  const groundImage = useStore(Selector.viewState.groundImage);
  const openModelMap = useStore(Selector.openModelsMap);
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const evolutionaryAlgorithmState = useStore(Selector.evolutionaryAlgorithmState);

  const [initializing, setInitializing] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lang = { lng: language };

  useEffect(() => {
    setInitializing(false);
  }, []);

  useEffect(() => {
    setCommonStore((state) => {
      // state.loggable = false; // temporarily disabled
      state.loggable = user && user.uid ? !user.email?.endsWith('@intofuture.org') : false;
      if (
        user &&
        (user.noLogging ||
          !user.schoolID ||
          user.schoolID === 'UNKNOWN SCHOOL' ||
          !user.classID ||
          user.classID === 'UNKNOWN CLASS')
      ) {
        state.loggable = false;
      }
    });
  }, [user]);

  const zoomView = (scale: number) => {
    if (orthographic) {
      // Previously, we declared this in the header: const cameraZoom = useStore(Selector.viewState.cameraZoom) ?? 20;
      // But it causes the app to be re-rendered every time zoom is called.
      const cameraZoom = useStore.getState().viewState.cameraZoom ?? 20;
      const oldZoom = cameraZoom;
      const newZoom = cameraZoom / scale;
      const undoableChange = {
        name: 'Zoom',
        timestamp: Date.now(),
        oldValue: oldZoom,
        newValue: newZoom,
        undo: () => {
          setCommonStore((state) => {
            state.viewState.cameraZoom = undoableChange.oldValue as number;
          });
        },
        redo: () => {
          setCommonStore((state) => {
            state.viewState.cameraZoom = undoableChange.newValue as number;
          });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      setCommonStore((state) => {
        state.viewState.cameraZoom = newZoom;
      });
    } else {
      const orbitControlsRef = useRefStore.getState().orbitControlsRef;
      if (orbitControlsRef?.current) {
        const p = orbitControlsRef.current.object.position;
        const x = p.x * scale;
        const y = p.y * scale;
        const z = p.z * scale;
        const undoableCameraChange = {
          name: 'Zoom',
          timestamp: Date.now(),
          oldCameraPosition: [p.x, p.y, p.z],
          newCameraPosition: [x, y, z],
          undo: () => {
            const oldX = undoableCameraChange.oldCameraPosition[0];
            const oldY = undoableCameraChange.oldCameraPosition[1];
            const oldZ = undoableCameraChange.oldCameraPosition[2];
            orbitControlsRef.current?.object.position.set(oldX, oldY, oldZ);
            orbitControlsRef.current?.update();
            setCommonStore((state) => {
              state.viewState.cameraPosition = [oldX, oldY, oldZ];
            });
          },
          redo: () => {
            const newX = undoableCameraChange.newCameraPosition[0];
            const newY = undoableCameraChange.newCameraPosition[1];
            const newZ = undoableCameraChange.newCameraPosition[2];
            orbitControlsRef.current?.object.position.set(newX, newY, newZ);
            orbitControlsRef.current?.update();
            setCommonStore((state) => {
              state.viewState.cameraPosition = [newX, newY, newZ];
            });
          },
        } as UndoableCameraChange;
        addUndoable(undoableCameraChange);
        orbitControlsRef.current.object.position.set(x, y, z);
        orbitControlsRef.current.update();
        setCommonStore((state) => {
          state.viewState.cameraPosition = [x, y, z];
        });
      }
    }
  };

  const resetView = () => {
    const orbitControlsRef = useRefStore.getState().orbitControlsRef;
    if (orbitControlsRef?.current) {
      // I don't know why the reset method results in a black screen.
      // So we are resetting it here to a predictable position.
      const z = Math.min(50, sceneRadius * 4);
      orbitControlsRef.current.object.position.set(z, z, z);
      orbitControlsRef.current.target.set(0, 0, 0);
      orbitControlsRef.current.update();
      setCommonStore((state) => {
        const v = state.viewState;
        v.cameraPosition = [z, z, z];
        v.panCenter = [0, 0, 0];
      });
    }
  };

  const set2DView = (selected: boolean) => {
    setCommonStore((state) => {
      state.viewState.orthographic = selected;
      state.viewState.enableRotate = !selected;
    });
  };

  console.log('x');

  return (
    <div className="App">
      {/* Spinner, Simulation and Evolution control panels */}
      <Loading initializing={initializing} />

      <div
        style={{
          backgroundColor: 'lightblue',
          height: '72px',
          paddingTop: '10px',
          textAlign: 'start',
          userSelect: 'none',
          fontSize: '30px',
        }}
      >
        <span
          style={{
            marginLeft: '120px',
            verticalAlign: 'middle',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title={i18n.t('tooltip.visitAladdinHomePage', lang)}
          onClick={visitHomepage}
        >
          {i18n.t('name.Aladdin', lang)}
        </span>
        {cloudFile && !openModelMap && (
          <span
            style={{
              marginLeft: '20px',
              fontSize: '14px',
              verticalAlign: 'center',
              userSelect: 'none',
              color: new URLSearchParams(window.location.search).get('userid') === user.uid ? 'black' : 'gray',
            }}
            title={i18n.t('toolbar.CloudFile', lang)}
          >
            <img
              title={i18n.t('toolbar.CloudFile', lang)}
              alt={'Cloud'}
              src={CloudImage}
              height={32}
              width={32}
              style={{ paddingRight: '8px' }}
            />
            {cloudFile + (changed ? ' *' : '')}
          </span>
        )}
      </div>
      {viewOnly ? (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '6px',
            zIndex: 999,
            fontSize: '8px',
            userSelect: 'none',
            color: 'antiquewhite',
          }}
        >
          <img
            alt="IFI Logo"
            src={ifiLogo}
            height="30px"
            style={{ verticalAlign: 'bottom', cursor: 'pointer' }}
            title={i18n.t('tooltip.gotoIFI', lang)}
            onClick={visitIFI}
          />
          {' V ' + VERSION}
        </div>
      ) : (
        <>
          <img
            alt="IFI Logo"
            src={ifiLogo}
            height="40px"
            style={{
              position: 'absolute',
              cursor: 'pointer',
              bottom: '6px',
              left: '6px',
              zIndex: 999,
              userSelect: 'none',
            }}
            title={i18n.t('tooltip.gotoIFI', lang)}
            onClick={visitIFI}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '44px',
              zIndex: 999,
              fontSize: '10px',
              userSelect: 'none',
              color: 'antiquewhite',
            }}
          >
            &nbsp;&nbsp; &copy;{new Date().getFullYear()} {i18n.t('name.IFI', lang)}
            &nbsp;
            {i18n.t('word.VersionInitial', lang) + VERSION + '. ' + i18n.t('word.AllRightsReserved', lang) + '. '}
          </div>
        </>
      )}
      {!viewOnly && (
        <ShareLink size={16} round={true} margin={'2px'} style={{ position: 'absolute', right: '0', top: '80px' }} />
      )}
      <MainMenu
        viewOnly={viewOnly}
        canvas={canvasRef.current}
        set2DView={set2DView}
        resetView={resetView}
        zoomView={zoomView}
      />
      <MainToolBar viewOnly={viewOnly} />
      <Panels />
      <DropdownContextMenu>
        <div>
          <Canvas
            ref={canvasRef}
            shadows={true}
            gl={{ preserveDrawingBuffer: true, logarithmicDepthBuffer: true }}
            frameloop={'demand'}
            style={{ height: 'calc(100vh - 72px)', backgroundColor: 'black' }}
          >
            <PointerStyleController />
            <CameraController />
            <Lights />
            <Ground />
            <Auxiliary />
            {/* somehow we have to use two suspense wrappers as follows */}
            <Suspense fallback={null}>
              <ElementsRenderer />
            </Suspense>
            <Suspense fallback={null}>
              {axes && <Axes />}
              <Sky theme={theme} />
              <Heliodon />
              {groundImage && <GroundImage />}
              {/* <Obj/> */}
            </Suspense>
            <SceneRadiusCalculator />
            <Simulations />
            {evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM &&
              evolutionaryAlgorithmState.geneticAlgorithmParams.problem === DesignProblem.SOLAR_PANEL_TILT_ANGLE && (
                <SolarPanelTiltAngleGa />
              )}
            {evolutionMethod === EvolutionMethod.GENETIC_ALGORITHM &&
              evolutionaryAlgorithmState.geneticAlgorithmParams.problem === DesignProblem.SOLAR_PANEL_ARRAY && (
                <SolarPanelArrayGa />
              )}
            {evolutionMethod === EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION &&
              evolutionaryAlgorithmState.particleSwarmOptimizationParams.problem ===
                DesignProblem.SOLAR_PANEL_TILT_ANGLE && <SolarPanelTiltAnglePso />}
            {evolutionMethod === EvolutionMethod.PARTICLE_SWARM_OPTIMIZATION &&
              evolutionaryAlgorithmState.particleSwarmOptimizationParams.problem ===
                DesignProblem.SOLAR_PANEL_ARRAY && <SolarPanelArrayPso />}
          </Canvas>
          <KeyboardListener
            canvas={canvasRef.current}
            set2DView={set2DView}
            resetView={resetView}
            zoomView={zoomView}
          />
        </div>
      </DropdownContextMenu>
      <CompassContainer visible={!orthographic} />
      {!viewOnly && <AcceptCookie />}
      {!viewOnly && loggable && <ActionLogger />}
    </div>
  );
};

export default React.memo(AppCreator);
