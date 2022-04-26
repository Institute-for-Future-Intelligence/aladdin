/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row, Select } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { ObjectType, Orientation, RowAxis } from '../../../types';
import { Util } from '../../../Util';
import { PolygonModel } from '../../../models/PolygonModel';
import { FoundationModel } from '../../../models/FoundationModel';
import { ElementModelFactory } from '../../../models/ElementModelFactory';
import { HALF_PI, UNIT_VECTOR_POS_Z } from '../../../constants';
import { Point2 } from '../../../models/Point2';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { UndoableLayout } from '../../../undo/UndoableLayout';
import { ElementModel } from '../../../models/ElementModel';
import { showError } from '../../../helpers';
import { SolarPanelArrayLayoutParams } from '../../../stores/SolarPanelArrayLayoutParams';

const { Option } = Select;

const SolarPanelLayoutWizard = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const solarPanelArrayLayoutParams = useStore.getState().solarPanelArrayLayoutParams;
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getParent = useStore(Selector.getParent);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);
  const updateElementReferenceById = useStore(Selector.updateElementReferenceById);
  const countElementsByReferenceId = useStore(Selector.countElementsByReferenceId);
  const removeElementsByReferenceId = useStore(Selector.removeElementsByReferenceId);
  const clearDeletedElements = useStore(Selector.clearDeletedElements);
  const addUndoable = useStore(Selector.addUndoable);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [warningDialogVisible, setWarningDialogVisible] = useState(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const changedRef = useRef(true);
  const okButtonRef = useRef<HTMLElement | null>(null);
  const warningOkButtonRef = useRef<HTMLElement | null>(null);
  const okButtonClickedRef = useRef<boolean>(false);
  const pvModelNameRef = useRef<string>(useStore(Selector.solarPanelArrayLayoutParams.pvModelName));
  const rowAxisRef = useRef<RowAxis>(useStore(Selector.solarPanelArrayLayoutParams.rowAxis));
  const orientationRef = useRef<Orientation>(useStore(Selector.solarPanelArrayLayoutParams.orientation));
  const tiltAngleRef = useRef<number>(useStore(Selector.solarPanelArrayLayoutParams.tiltAngle));
  const rowsPerRackRef = useRef<number>(useStore(Selector.solarPanelArrayLayoutParams.rowWidth));
  const interRowSpacingRef = useRef<number>(useStore(Selector.solarPanelArrayLayoutParams.interRowSpacing));
  const poleHeightRef = useRef<number>(useStore(Selector.solarPanelArrayLayoutParams.poleHeight));
  const poleSpacingRef = useRef<number>(useStore(Selector.solarPanelArrayLayoutParams.poleSpacing));

  const lang = { lng: language };
  const pvModel = getPvModule(pvModelNameRef.current);
  const reference = getSelectedElement();
  const relativeMargin = 0.01;

  useEffect(() => {
    okButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (warningDialogVisible) {
      warningOkButtonRef.current?.focus();
    }
  }, [warningDialogVisible]);

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  const changeOrientation = (solarPanel: SolarPanelModel, value: Orientation) => {
    if (solarPanel) {
      solarPanel.orientation = value;
      const pvModel = getPvModule(solarPanel.pvModelName);
      // add a small number because the round-off error may cause the floor to drop one
      solarPanel.lx += 0.00001;
      solarPanel.ly += 0.00001;
      if (value === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.floor(solarPanel.lx / pvModel.width));
        const ny = Math.max(1, Math.floor(solarPanel.ly / pvModel.length));
        solarPanel.lx = nx * pvModel.width;
        solarPanel.ly = ny * pvModel.length;
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.floor(solarPanel.lx / pvModel.length));
        const ny = Math.max(1, Math.floor(solarPanel.ly / pvModel.width));
        solarPanel.lx = nx * pvModel.length;
        solarPanel.ly = ny * pvModel.width;
      }
    }
  };

  const isLayoutOk = () => {
    const ly =
      (orientationRef.current === Orientation.portrait ? pvModel.length : pvModel.width) * rowsPerRackRef.current;
    const projectedWidth = ly * Math.abs(Math.sin(tiltAngleRef.current));
    // The solar panel intersects with the ground?
    if (0.5 * projectedWidth > poleHeightRef.current) {
      showError(i18n.t('message.SolarPanelsCannotIntersectWithGround', lang));
      return false;
    }
    // The inter-row spacing is too small?
    if (ly > interRowSpacingRef.current) {
      showError(i18n.t('message.SolarPanelsCannotOverlapWithOneAnother', lang));
      return false;
    }
    // others?
    return true;
  };

  const referenceExistingSolarPanels = (area: PolygonModel) => {
    const existingSolarPanels = elements.filter(
      (e) => e.type === ObjectType.SolarPanel && e.parentId === area.parentId,
    );
    if (existingSolarPanels.length > 0) {
      for (const sp of existingSolarPanels) {
        if (sp.referenceId !== area.id) {
          if (Util.pointInsidePolygon({ x: sp.cx, y: sp.cy } as Point2, area.vertices)) {
            updateElementReferenceById(sp.id, area.id);
          }
        }
      }
    }
  };

  const layout = () => {
    if (reference?.type === ObjectType.Polygon) {
      const area = reference as PolygonModel;
      const bounds = Util.calculatePolygonBounds(area.vertices);
      const base = getParent(area);
      if (base?.type === ObjectType.Foundation) {
        const newElements: ElementModel[] = [];
        const foundation = base as FoundationModel;
        let n: number;
        let start: number;
        let delta: number;
        const ly =
          (orientationRef.current === Orientation.portrait ? pvModel.length : pvModel.width) * rowsPerRackRef.current;
        let h = 0.5 * Math.abs(Math.sin(tiltAngleRef.current)) * ly;
        if (rowAxisRef.current === RowAxis.meridional) {
          // north-south axis, so the array is laid in x direction
          n = Math.floor(((bounds.maxX() - bounds.minX()) * foundation.lx - ly) / interRowSpacingRef.current);
          start = bounds.minX() + ly / (2 * foundation.lx);
          delta = interRowSpacingRef.current / foundation.lx;
          h /= foundation.lx;
          let a: Point2 = { x: 0, y: -0.5 } as Point2;
          let b: Point2 = { x: 0, y: 0.5 } as Point2;
          const rotation = 'rotation' in foundation ? foundation.rotation : undefined;
          for (let i = 0; i <= n; i++) {
            const cx = start + i * delta;
            a.x = b.x = cx - h;
            const p1 = Util.polygonIntersections(a, b, area.vertices);
            a.x = b.x = cx + h;
            const p2 = Util.polygonIntersections(a, b, area.vertices);
            if (p1.length > 1 && p2.length > 1) {
              const b = Math.abs(p1[0].y - p1[1].y) < Math.abs(p2[0].y - p2[1].y);
              let y1 = b ? p1[0].y : p2[0].y;
              let y2 = b ? p1[1].y : p2[1].y;
              const lx = Math.abs(y1 - y2) - 2 * relativeMargin;
              if (lx > 0) {
                const solarPanel = ElementModelFactory.makeSolarPanel(
                  foundation,
                  pvModel,
                  cx,
                  (y1 + y2) / 2,
                  foundation.lz,
                  Orientation.portrait,
                  UNIT_VECTOR_POS_Z,
                  rotation,
                  lx * foundation.ly,
                  ly,
                );
                solarPanel.tiltAngle = tiltAngleRef.current;
                solarPanel.relativeAzimuth = HALF_PI;
                solarPanel.poleHeight = poleHeightRef.current;
                solarPanel.poleSpacing = poleSpacingRef.current;
                solarPanel.referenceId = area.id;
                changeOrientation(solarPanel, orientationRef.current);
                newElements.push(JSON.parse(JSON.stringify(solarPanel)));
                setCommonStore((state) => {
                  state.elements.push(solarPanel);
                });
              }
            }
          }
        } else {
          // east-west axis, so the array is laid in y direction
          n = Math.floor(((bounds.maxY() - bounds.minY()) * foundation.ly - ly) / interRowSpacingRef.current);
          start = bounds.minY() + ly / (2 * foundation.ly) + relativeMargin;
          delta = interRowSpacingRef.current / foundation.ly;
          h /= foundation.ly;
          let a: Point2 = { x: -0.5, y: 0 } as Point2;
          let b: Point2 = { x: 0.5, y: 0 } as Point2;
          const rotation = 'rotation' in foundation ? foundation.rotation : undefined;
          for (let i = 0; i <= n; i++) {
            const cy = start + i * delta;
            a.y = b.y = cy - h;
            const p1 = Util.polygonIntersections(a, b, area.vertices);
            a.y = b.y = cy + h;
            const p2 = Util.polygonIntersections(a, b, area.vertices);
            if (p1.length > 1 && p2.length > 1) {
              const b = Math.abs(p1[0].x - p1[1].x) < Math.abs(p2[0].x - p2[1].x);
              let x1 = b ? p1[0].x : p2[0].x;
              let x2 = b ? p1[1].x : p2[1].x;
              const lx = Math.abs(x1 - x2) - 2 * relativeMargin;
              if (lx > 0) {
                const solarPanel = ElementModelFactory.makeSolarPanel(
                  foundation,
                  pvModel,
                  (x1 + x2) / 2,
                  cy,
                  foundation.lz,
                  Orientation.portrait,
                  UNIT_VECTOR_POS_Z,
                  rotation,
                  lx * foundation.lx,
                  ly,
                );
                solarPanel.tiltAngle = tiltAngleRef.current;
                solarPanel.relativeAzimuth = 0;
                solarPanel.poleHeight = poleHeightRef.current;
                solarPanel.poleSpacing = poleSpacingRef.current;
                solarPanel.referenceId = area.id;
                changeOrientation(solarPanel, orientationRef.current);
                newElements.push(JSON.parse(JSON.stringify(solarPanel)));
                setCommonStore((state) => {
                  state.elements.push(solarPanel);
                });
              }
            }
          }
        }
        const undoableLayout = {
          name: 'Solar Panel Array Layout',
          timestamp: Date.now(),
          oldElements: useStore.getState().deletedElements,
          newElements: newElements,
          oldParams: {
            pvModelName: solarPanelArrayLayoutParams.pvModelName,
            rowAxis: solarPanelArrayLayoutParams.rowAxis,
            orientation: solarPanelArrayLayoutParams.orientation,
            tiltAngle: solarPanelArrayLayoutParams.tiltAngle,
            rowsPerRack: solarPanelArrayLayoutParams.rowsPerRack,
            interRowSpacing: solarPanelArrayLayoutParams.interRowSpacing,
            poleHeight: solarPanelArrayLayoutParams.poleHeight,
            poleSpacing: solarPanelArrayLayoutParams.poleSpacing,
          } as SolarPanelArrayLayoutParams,
          newParams: {
            pvModelName: pvModelNameRef.current,
            rowAxis: rowAxisRef.current,
            orientation: orientationRef.current,
            tiltAngle: tiltAngleRef.current,
            rowsPerRack: rowsPerRackRef.current,
            interRowSpacing: interRowSpacingRef.current,
            poleHeight: poleHeightRef.current,
            poleSpacing: poleSpacingRef.current,
          } as SolarPanelArrayLayoutParams,
          referenceId: area.id,
          undo: () => {
            removeElementsByReferenceId(undoableLayout.referenceId, false);
            if (undoableLayout.oldElements.length > 0) {
              setCommonStore((state) => {
                for (const e of undoableLayout.oldElements) {
                  state.elements.push(e);
                }
              });
            }
            setParams(undoableLayout.oldParams);
            updateStoreParams();
          },
          redo: () => {
            removeElementsByReferenceId(undoableLayout.referenceId, false);
            if (undoableLayout.newElements.length > 0) {
              setCommonStore((state) => {
                for (const e of undoableLayout.newElements) {
                  state.elements.push(e);
                }
              });
            }
            setParams(undoableLayout.newParams);
            updateStoreParams();
          },
        } as UndoableLayout;
        addUndoable(undoableLayout);
        setApplyCount(applyCount + 1);
      }
    }
    changedRef.current = false;
    setCommonStore((state) => {
      state.updateDesignInfo();
    });
    updateStoreParams();
  };

  const setParams = (params: SolarPanelArrayLayoutParams) => {
    pvModelNameRef.current = params.pvModelName;
    rowAxisRef.current = params.rowAxis;
    orientationRef.current = params.orientation;
    tiltAngleRef.current = params.tiltAngle;
    rowsPerRackRef.current = params.rowsPerRack;
    interRowSpacingRef.current = params.interRowSpacing;
    poleHeightRef.current = params.poleHeight;
    poleSpacingRef.current = params.poleSpacing;
  };

  // save the values in the common store so that they can be retrieved
  const updateStoreParams = () => {
    setCommonStore((state) => {
      state.solarPanelArrayLayoutParams.pvModelName = pvModelNameRef.current;
      state.solarPanelArrayLayoutParams.rowAxis = rowAxisRef.current;
      state.solarPanelArrayLayoutParams.orientation = orientationRef.current;
      state.solarPanelArrayLayoutParams.tiltAngle = tiltAngleRef.current;
      state.solarPanelArrayLayoutParams.rowsPerRack = rowsPerRackRef.current;
      state.solarPanelArrayLayoutParams.interRowSpacing = interRowSpacingRef.current;
      state.solarPanelArrayLayoutParams.poleHeight = poleHeightRef.current;
      state.solarPanelArrayLayoutParams.poleSpacing = poleSpacingRef.current;
    });
  };

  const apply = () => {
    if (!changedRef.current) return;
    if (isLayoutOk()) {
      if (reference) {
        referenceExistingSolarPanels(reference as PolygonModel);
        if (countElementsByReferenceId(reference.id) > 0) {
          setWarningDialogVisible(true);
        } else {
          clearDeletedElements();
          layout();
        }
      }
    } else {
      showError(i18n.t('polygonMenu.LayoutNotAcceptedCheckYourParameters', lang));
    }
  };

  const onApplyClick = () => {
    apply();
    okButtonClickedRef.current = false;
  };

  const onCancelClick = () => {
    setDialogVisible(false);
    revertApply();
    changedRef.current = true;
    okButtonClickedRef.current = false;
  };

  const onOkClick = () => {
    if (changedRef.current) {
      apply();
      okButtonClickedRef.current = true;
    } else {
      setDialogVisible(false);
    }
  };

  const onWarningCancelClick = () => {
    setWarningDialogVisible(false);
  };

  const onWarningOkClick = () => {
    if (reference) {
      removeElementsByReferenceId(reference.id, true);
      layout();
      if (okButtonClickedRef.current) {
        setDialogVisible(false);
        setApplyCount(0);
      }
    }
    setWarningDialogVisible(false);
  };

  return (
    <>
      {warningDialogVisible && (
        <Modal
          width={400}
          visible={warningDialogVisible}
          title={
            <div
              style={{ width: '100%', cursor: 'move' }}
              onMouseOver={() => setDragEnabled(true)}
              onMouseOut={() => setDragEnabled(false)}
            >
              {i18n.t('word.Reminder', lang)}
            </div>
          }
          footer={[
            <Button key="Cancel" onClick={onWarningCancelClick}>
              {i18n.t('word.Cancel', lang)}
            </Button>,
            <Button key="OK" type="primary" ref={warningOkButtonRef} onClick={onWarningOkClick}>
              {i18n.t('word.OK', lang)}
            </Button>,
          ]}
        >
          {i18n.t('message.ExistingSolarPanelsWillBeRemovedBeforeApplyingNewLayout', lang) +
            ' ' +
            i18n.t('message.DoYouWantToContinue', lang)}
        </Modal>
      )}
      <Modal
        width={560}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('polygonMenu.SolarPanelArrayLayoutParametricDesign', lang)}
          </div>
        }
        footer={[
          <Button key="Apply" disabled={!changedRef.current} onClick={onApplyClick}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={onCancelClick}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" ref={okButtonRef} onClick={onOkClick}>
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setDialogVisible(false);
          changedRef.current = true;
        }}
        maskClosable={false}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayModel', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              defaultValue="Custom"
              style={{ width: '100%' }}
              value={pvModelNameRef.current}
              onChange={(value) => {
                pvModelNameRef.current = value;
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            >
              {Object.keys(pvModules).map((key) => (
                <Option key={key} value={key}>
                  {key}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayRowAxis', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              style={{ width: '100%' }}
              value={rowAxisRef.current}
              onChange={(value) => {
                rowAxisRef.current = value;
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            >
              <Option key={RowAxis.zonal} value={RowAxis.zonal}>
                {i18n.t('polygonMenu.SolarPanelArrayZonalRowAxis', lang)}
              </Option>
              <Option key={RowAxis.meridional} value={RowAxis.meridional}>
                {i18n.t('polygonMenu.SolarPanelArrayMeridionalRowAxis', lang)}
              </Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayOrientation', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              style={{ width: '100%' }}
              value={orientationRef.current}
              onChange={(value) => {
                orientationRef.current = value;
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            >
              <Option key={Orientation.portrait} value={Orientation.portrait}>
                {i18n.t('solarPanelMenu.Portrait', lang)}
              </Option>
              <Option key={Orientation.landscape} value={Orientation.landscape}>
                {i18n.t('solarPanelMenu.Landscape', lang)}
              </Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayTiltAngle', lang) + ' ([-90°, 90°]): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={-90}
              max={90}
              style={{ width: '100%' }}
              precision={1}
              value={Util.toDegrees(tiltAngleRef.current)}
              step={1}
              formatter={(a) => Number(a).toFixed(1) + '°'}
              onChange={(value) => {
                tiltAngleRef.current = Util.toRadians(value);
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayRowWidth', lang) +
              ' ([1-100] ' +
              i18n.t('solarPanelMenu.Panels', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={1}
              max={100}
              step={1}
              style={{ width: '100%' }}
              precision={3}
              value={rowsPerRackRef.current}
              formatter={(a) => Number(a).toFixed(0)}
              onChange={(value) => {
                rowsPerRackRef.current = value;
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayInterRowSpacing', lang) +
              ' ([1, 20] ' +
              i18n.t('word.MeterAbbreviation', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={1}
              max={20}
              style={{ width: '100%' }}
              precision={1}
              value={interRowSpacingRef.current}
              step={0.5}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => {
                interRowSpacingRef.current = value;
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayPoleHeight', lang) +
              ' ([0, 10] ' +
              i18n.t('word.MeterAbbreviation', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={0}
              max={10}
              style={{ width: '100%' }}
              precision={1}
              value={poleHeightRef.current}
              step={0.1}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => {
                poleHeightRef.current = value;
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>

        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('polygonMenu.SolarPanelArrayPoleSpacing', lang) +
              ' ([1, 10] ' +
              i18n.t('word.MeterAbbreviation', lang) +
              '): '}
          </Col>
          <Col className="gutter-row" span={10}>
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              precision={1}
              value={poleSpacingRef.current}
              step={0.5}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => {
                poleSpacingRef.current = value;
                changedRef.current = true;
                setUpdateFlag(!updateFlag);
              }}
            />
          </Col>
        </Row>
      </Modal>
    </>
  );
};

// don't wrap this with React.memo as changedRef would be saved
export default SolarPanelLayoutWizard;
