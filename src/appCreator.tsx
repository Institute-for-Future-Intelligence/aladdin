/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie, Xiaotong Ding
 */

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import { Canvas, invalidate } from '@react-three/fiber';
import Sky from './views/sky';
import Axes from './views/axes';
import ElementsRenderer from './elementsRenderer';
import Ground from './views/ground';
import Heliodon from './views/heliodonWrapper';
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from './components/mainMenu/mainMenu';
import { DEFAULT_SHADOW_CAMERA_FAR, DEFAULT_FOV, VERSION } from './constants';
import { visitHomepage, visitIFI } from './helpers';
import AcceptCookie from './acceptCookie';
import GroundImage from './views/groundImage';
import DropdownContextMenu from './components/contextMenu';
import { DesignProblem, EvolutionMethod } from './types';
import CloudManager from './cloudManager';
import ActionLogger from './actionLogger';
import Lights from './lights';
import { Auxiliary } from './auxiliary';
import Compass from './compassContainer';
import i18n from './i18n/i18n';
import KeyboardListener from './keyboardListener';
import CloudImage from './assets/cloud.png';
import SceneRadiusCalculator from './sceneRadiusCalculator';
import CameraController from './cameraController';
import ShareLink from './shareLinks';
import SolarPanelTiltAngleGa from './ai/ga/solarPanelTiltAngleGa';
import SolarPanelArrayGa from './ai/ga/solarPanelArrayGa';
import SolarPanelTiltAnglePso from './ai/pso/solarPanelTiltAnglePso';
import SolarPanelArrayPso from './ai/pso/solarPanelArrayPso';
import NavigationController from './navigationController';
import Waiting from './waiting';
import Panels from './panels';
import Simulations from './simulations';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { Button } from 'antd';
import ProjectGallery from './panels/projectGallery';
import GroupMasterWrapper from './components/groupMaster';
import SplitPane from './components/splitPane';
import { useRefStore } from './stores/commonRef';
import { PerspectiveCamera, Vector2, Vector3 } from 'three';

export interface AppCreatorProps {
  viewOnly: boolean;
}

const AppCreator = ({ viewOnly = false }: AppCreatorProps) => {
  const user = useStore(Selector.user);
  const loggable = useStore(Selector.loggable);
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const changed = usePrimitiveStore(Selector.changed);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const shadowCameraFar = useStore(Selector.viewState.shadowCameraFar) ?? DEFAULT_SHADOW_CAMERA_FAR;
  const cloudFile = useStore(Selector.cloudFile);
  const projectView = useStore(Selector.projectView);
  const axes = useStore(Selector.viewState.axes);
  const theme = useStore(Selector.viewState.theme);
  const groundImage = useStore(Selector.viewState.groundImage);
  const groundImageType = useStore(Selector.viewState.groundImageType) ?? 'roadmap';
  const openModelsMap = usePrimitiveStore(Selector.openModelsMap);
  const evolutionMethod = useStore(Selector.evolutionMethod);
  const evolutionaryAlgorithmState = useStore(Selector.evolutionaryAlgorithmState);

  const [initializing, setInitializing] = useState<boolean>(true);
  const [canvasPercentWidth, setCanvasRelativeWidth] = useState<number>(50);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  console.log('x');

  const isCloudFileOwner = user.uid && new URLSearchParams(window.location.search).get('userid') === user.uid;

  const createCanvas = () => {
    return (
      <Canvas
        ref={canvasRef}
        shadows={true}
        gl={{ preserveDrawingBuffer: true, logarithmicDepthBuffer: true }}
        frameloop={'demand'}
        style={{ height: '100%', width: '100%', backgroundColor: 'black' }}
        camera={{ fov: DEFAULT_FOV, far: shadowCameraFar, up: [0, 0, 1] }}
      >
        <NavigationController />
        <CameraController />
        <Lights />
        <Ground />
        <Auxiliary />
        {/* somehow we have to use two suspense wrappers as follows */}
        <Suspense fallback={null}>
          <ElementsRenderer />
          <GroupMasterWrapper />
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
          evolutionaryAlgorithmState.particleSwarmOptimizationParams.problem === DesignProblem.SOLAR_PANEL_ARRAY && (
            <SolarPanelArrayPso />
          )}
      </Canvas>
    );
  };

  const v = useMemo(() => new Vector2(), []);

  return (
    // disable the default context menu for the entire app
    <div className="App" style={{ position: 'relative', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
      {/* Spinner, Simulation and Evolution control panels */}
      <Waiting initializing={initializing} />

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
          {`${i18n.t('name.Aladdin', lang)}`}
        </span>
        {cloudFile && !openModelsMap && (
          <span
            style={{
              marginLeft: '20px',
              fontSize: '14px',
              verticalAlign: 'center',
              userSelect: 'text',
              color: isCloudFileOwner ? 'black' : 'gray',
            }}
          >
            <img
              title={i18n.t('toolbar.CloudFile', lang)}
              alt={'Cloud'}
              src={CloudImage}
              height={32}
              width={32}
              style={{ paddingRight: '8px' }}
            />
            {cloudFile + (isCloudFileOwner && changed ? ' *' : '')}
            {!viewOnly && isCloudFileOwner && changed && (
              <Button
                type="primary"
                size={'small'}
                style={{ marginLeft: '10px' }}
                title={i18n.t('menu.file.SaveCloudFile', lang)}
                onClick={() => {
                  usePrimitiveStore.getState().setSaveCloudFileFlag(true);
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Save Cloud File',
                        timestamp: new Date().getTime(),
                      };
                    });
                  }
                }}
              >
                {`${i18n.t('word.Save', lang)}`}
              </Button>
            )}
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
            color:
              groundImage || projectView
                ? groundImageType !== 'roadmap'
                  ? 'antiquewhite'
                  : 'darkslategrey'
                : 'antiquewhite',
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
            height={projectView ? '24px' : '40px'}
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
              left: projectView ? '24px' : '44px',
              zIndex: 999,
              fontSize: '10px',
              userSelect: 'none',
              color: groundImage
                ? groundImageType !== 'roadmap'
                  ? 'antiquewhite'
                  : 'darkslategrey'
                : projectView
                ? 'darkslategrey'
                : 'antiquewhite',
            }}
          >
            &nbsp;&nbsp; &copy;{new Date().getFullYear()} {`${i18n.t('name.IFI', lang)}`}
            &nbsp;
            {i18n.t('word.VersionInitial', lang) + VERSION + '. ' + i18n.t('word.AllRightsReserved', lang) + '. '}
          </div>
        </>
      )}
      {!viewOnly && (
        <ShareLink size={16} round={true} margin={'2px'} style={{ position: 'absolute', right: '0', top: '80px' }} />
      )}
      <MainMenu viewOnly={viewOnly} canvas={canvasRef.current} />
      <CloudManager viewOnly={viewOnly} canvas={canvasRef.current} />
      <Panels />
      <DropdownContextMenu>
        {/* must specify the height here for the floating window to have correct boundary check*/}
        <div style={{ height: 'calc(100vh - 72px)' }}>
          <SplitPane
            showGallery={projectView}
            defaultSize={projectView ? 50 : 0}
            onChange={(size) => {
              setCanvasRelativeWidth(Math.round(100 - size));
              const canvas = useRefStore.getState().canvas;
              if (canvas) {
                const { gl, camera } = canvas;
                const newWidth = ((100 - size) * window.innerWidth) / 100;
                gl.getSize(v);
                gl.setSize(newWidth, v.y);
                if (camera instanceof PerspectiveCamera) {
                  camera.aspect = newWidth / v.y;
                  camera.updateProjectionMatrix();
                  invalidate();
                }
              }
            }}
          >
            {projectView ? (
              <ProjectGallery canvas={canvasRef.current} relativeWidth={1 - canvasPercentWidth * 0.01} />
            ) : (
              <></>
            )}
            {createCanvas()}
          </SplitPane>
          <KeyboardListener canvas={canvasRef.current} />
        </div>
      </DropdownContextMenu>
      <Compass visible={!orthographic} />
      {!viewOnly && <AcceptCookie />}
      {!viewOnly && loggable && <ActionLogger />}
    </div>
  );
};

export default React.memo(AppCreator);
