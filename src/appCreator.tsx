/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
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
import { DEFAULT_FOV, DEFAULT_SHADOW_CAMERA_FAR, VERSION } from './constants';
import { visitHomepage } from './helpers';
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
import { Badge, Button, Empty, Space, Splitter, Tree, TreeDataNode } from 'antd';
import ProjectGallery from './panels/projectGallery';
import GroupMasterWrapper from './components/groupMaster';
import { useRefStore } from './stores/commonRef';
import { PerspectiveCamera, Vector2 } from 'three';
import { useLanguage, useModelTree } from './hooks';
import { AlertFilled } from '@ant-design/icons';

export interface AppCreatorProps {
  viewOnly: boolean;
}

const HEADER_HEIGHT = 72;
const AppCreator = React.memo(({ viewOnly = false }: AppCreatorProps) => {
  const user = useStore(Selector.user);
  const latestVersion = usePrimitiveStore(Selector.latestVersion);
  const loggable = useStore(Selector.loggable);
  const setCommonStore = useStore(Selector.set);
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
  const cloudFileBelongToProject = useStore(Selector.cloudFileBelongToProject);
  const logAction = useStore(Selector.logAction);
  const closeProject = useStore(Selector.closeProject);
  const elements = useStore(Selector.elements);
  const showModelTree = useStore(Selector.viewState.showModelTree);

  const [initializing, setInitializing] = useState<boolean>(true);
  const [canvasPercentWidth, setCanvasRelativeWidth] = useState<number>(50);
  const [latestVersionReminder, setLatestVersionReminder] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lang = useLanguage();

  useEffect(() => {
    setInitializing(false);
  }, []);

  useEffect(() => {
    if (latestVersion) setLatestVersionReminder(VERSION.localeCompare(latestVersion) < 0);
  }, [latestVersion]);

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

  const updatePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    useRefStore.setState((state) => {
      if (!canvasRef.current) return state;
      const pointer = state.pointer;
      pointer.x = (e.clientX / canvasRef.current.clientWidth) * 2 - 1;
      pointer.y = -((e.clientY - HEADER_HEIGHT) / canvasRef.current.clientHeight) * 2 + 1;
      return { pointer };
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointer(e);
  };

  const createCanvas = () => {
    return (
      <Canvas
        ref={canvasRef}
        shadows={true}
        gl={{ preserveDrawingBuffer: true, logarithmicDepthBuffer: true }}
        frameloop={'demand'}
        style={{ height: '100%', width: '100%', backgroundColor: 'black' }}
        camera={{ fov: DEFAULT_FOV, far: shadowCameraFar, up: [0, 0, 1] }}
        onPointerMove={handlePointerMove}
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

  const resizeCanvas = (width: number) => {
    setCanvasRelativeWidth(Math.round((width / window.innerWidth) * 100));
    const canvas = useRefStore.getState().canvas;
    if (canvas) {
      const { gl, camera } = canvas;
      const newWidth = width;
      gl.getSize(v);
      gl.setSize(newWidth, v.y);
      if (camera instanceof PerspectiveCamera) {
        camera.aspect = newWidth / v.y;
        camera.updateProjectionMatrix();
        invalidate();
      }
    }
  };

  const modelTree: TreeDataNode[] = useModelTree();

  return (
    // disable the default context menu for the entire app
    <div className="App" style={{ position: 'relative', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
      {/* Spinner, Simulation and Evolution control panels */}
      <Waiting initializing={initializing} />

      <div
        style={{
          backgroundColor: 'lightblue',
          height: HEADER_HEIGHT + 'px',
          paddingTop: '10px',
          textAlign: 'start',
          userSelect: 'none',
          fontSize: '30px',
        }}
      >
        <Badge
          offset={['10px', '0px']}
          count={
            latestVersionReminder ? (
              <AlertFilled
                style={{ color: 'red', cursor: 'pointer' }}
                title={i18n.t('message.NewVersionAvailable', lang)}
              />
            ) : undefined
          }
        >
          <Space
            style={{
              marginLeft: '120px',
              verticalAlign: 'middle',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: '30px',
            }}
            title={i18n.t('tooltip.visitAladdinHomePage', lang)}
            onClick={visitHomepage}
          >
            {`${i18n.t('name.Aladdin', lang)}`}
          </Space>
        </Badge>
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
            {!viewOnly && isCloudFileOwner && changed && !cloudFileBelongToProject() && (
              <Button
                type="primary"
                size={'small'}
                style={{ marginLeft: '10px' }}
                title={i18n.t('menu.file.SaveCloudFile', lang)}
                onClick={() => {
                  usePrimitiveStore.getState().setSaveCloudFileFlag(true);
                  if (loggable) logAction('Save Cloud File');
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
          <img alt="IFI Logo" src={ifiLogo} height="30px" style={{ verticalAlign: 'bottom' }} />
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
              bottom: '6px',
              left: '6px',
              zIndex: 999,
              userSelect: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: projectView ? '24px' : '44px',
              zIndex: 999,
              fontSize: '10px',
              userSelect: 'none',
              pointerEvents: 'none',
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
        <div style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
          {projectView ? (
            <Splitter
              onResizeEnd={(sizes) => {
                if (sizes[0] === 0) {
                  closeProject();
                }
                resizeCanvas(sizes[1]);
              }}
            >
              <Splitter.Panel collapsible defaultSize={projectView ? window.innerWidth / 2 : 0}>
                <ProjectGallery canvas={canvasRef.current} relativeWidth={1 - canvasPercentWidth * 0.01} />
              </Splitter.Panel>
              <Splitter.Panel>{createCanvas()}</Splitter.Panel>
            </Splitter>
          ) : (
            <>
              {showModelTree ? (
                <Splitter
                  onResizeEnd={(sizes) => {
                    if (sizes[0] === 0) {
                      setCommonStore((state) => {
                        state.viewState.showModelTree = false;
                      });
                      resizeCanvas(sizes[1]);
                    }
                  }}
                >
                  <Splitter.Panel defaultSize={Math.max(200, window.innerWidth / 5)} style={{ overflow: 'auto' }}>
                    {elements.length === 0 ? (
                      <Empty />
                    ) : (
                      <Tree
                        checkable
                        defaultExpandAll
                        showLine
                        showIcon
                        defaultExpandedKeys={[]}
                        defaultSelectedKeys={[]}
                        defaultCheckedKeys={[]}
                        onSelect={() => {}}
                        onCheck={() => {}}
                        treeData={modelTree}
                      />
                    )}
                  </Splitter.Panel>
                  <Splitter.Panel>{createCanvas()}</Splitter.Panel>
                </Splitter>
              ) : (
                <>{createCanvas()}</>
              )}
            </>
          )}
          <KeyboardListener canvas={canvasRef.current} />
        </div>
      </DropdownContextMenu>
      <Compass visible={!orthographic} />
      {!viewOnly && <AcceptCookie />}
      {!viewOnly && loggable && <ActionLogger />}
    </div>
  );
});

export default AppCreator;
