/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
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

const { Option } = Select;

const SolarPanelLayoutWizard = ({
  dialogVisible,
  setDialogVisible,
}: {
  dialogVisible: boolean;
  setDialogVisible: (b: boolean) => void;
}) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const getElementById = useStore(Selector.getElementById);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);
  const countElementsByReferenceId = useStore(Selector.countElementsByReferenceId);
  const removeElementsByReferenceId = useStore(Selector.removeElementsByReferenceId);
  const clearDeletedElements = useStore(Selector.clearDeletedElements);
  const addUndoable = useStore(Selector.addUndoable);
  const pvModelName = useStore.getState().solarPanelArrayLayoutParams.pvModelName;
  const rowAxis = useStore.getState().solarPanelArrayLayoutParams.rowAxis;
  const orientation = useStore.getState().solarPanelArrayLayoutParams.orientation;
  const tiltAngle = useStore.getState().solarPanelArrayLayoutParams.tiltAngle;
  const rowWidthInPanels = useStore.getState().solarPanelArrayLayoutParams.rowWidthInPanels;
  const interRowSpacing = useStore.getState().solarPanelArrayLayoutParams.interRowSpacing;
  const poleHeight = useStore.getState().solarPanelArrayLayoutParams.poleHeight;
  const poleSpacing = useStore.getState().solarPanelArrayLayoutParams.poleSpacing;
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [warningDialogVisible, setWarningDialogVisible] = useState(false);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const changedRef = useRef(true);

  const lang = { lng: language };
  const pvModel = getPvModule(pvModelName);
  const reference = getSelectedElement();
  const relativeMargin = 0.01;

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
    const ly = (orientation === Orientation.portrait ? pvModel.length : pvModel.width) * rowWidthInPanels;
    const projectedWidth = ly * Math.abs(Math.sin(tiltAngle));
    // The solar panel intersects with the ground?
    if (0.5 * projectedWidth > poleHeight) {
      showError(i18n.t('message.SolarPanelsCannotIntersectWithGround', lang));
      return false;
    }
    // The inter-row spacing is too small?
    if (ly > interRowSpacing) {
      showError(i18n.t('message.SolarPanelsCannotOverlapWithOneAnother', lang));
      return false;
    }
    // others?
    return true;
  };

  const layout = () => {
    if (reference?.type === ObjectType.Polygon) {
      const area = reference as PolygonModel;
      const bounds = Util.calculatePolygonBounds(area.vertices);
      const base = getElementById(area.parentId);
      if (base?.type === ObjectType.Foundation) {
        const newElements: ElementModel[] = [];
        const foundation = base as FoundationModel;
        let n: number;
        let start: number;
        let delta: number;
        const ly = (orientation === Orientation.portrait ? pvModel.length : pvModel.width) * rowWidthInPanels;
        let h = 0.5 * Math.abs(Math.sin(tiltAngle)) * ly;
        if (rowAxis === RowAxis.meridional) {
          // north-south axis, so the array is laid in x direction
          n = Math.floor(((bounds.maxX - bounds.minX) * foundation.lx - ly) / interRowSpacing);
          start = bounds.minX + ly / (2 * foundation.lx);
          delta = interRowSpacing / foundation.lx;
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
                solarPanel.tiltAngle = tiltAngle;
                solarPanel.relativeAzimuth = HALF_PI;
                solarPanel.poleHeight = poleHeight;
                solarPanel.poleSpacing = poleSpacing;
                solarPanel.referenceId = area.id;
                changeOrientation(solarPanel, orientation);
                newElements.push(JSON.parse(JSON.stringify(solarPanel)));
                setCommonStore((state) => {
                  state.elements.push(solarPanel);
                });
              }
            }
          }
        } else {
          // east-west axis, so the array is laid in y direction
          n = Math.floor(((bounds.maxY - bounds.minY) * foundation.ly - ly) / interRowSpacing);
          start = bounds.minY + ly / (2 * foundation.ly) + relativeMargin;
          delta = interRowSpacing / foundation.ly;
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
                solarPanel.tiltAngle = tiltAngle;
                solarPanel.relativeAzimuth = 0;
                solarPanel.poleHeight = poleHeight;
                solarPanel.poleSpacing = poleSpacing;
                solarPanel.referenceId = area.id;
                changeOrientation(solarPanel, orientation);
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
          },
        } as UndoableLayout;
        addUndoable(undoableLayout);
        setApplyCount(applyCount + 1);
      }
    }
    changedRef.current = false;
    setCommonStore((state) => {
      state.updateDesignInfoFlag = !state.updateDesignInfoFlag;
    });
  };

  const apply = () => {
    if (!changedRef.current) return;
    if (isLayoutOk()) {
      if (reference) {
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
          onOk={() => {
            if (reference) {
              removeElementsByReferenceId(reference.id, true);
              layout();
            }
            setWarningDialogVisible(false);
          }}
          onCancel={() => {
            setWarningDialogVisible(false);
          }}
        >
          {i18n.t('message.ExistingSolarPanelsWillBeRemovedBeforeApplyingNewLayout', lang)}
          {i18n.t('message.DoYouWantToContinue', lang)}
        </Modal>
      )}
      <Modal
        width={560}
        visible={dialogVisible}
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
          <Button key="Apply" onClick={apply}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setDialogVisible(false);
              revertApply();
              changedRef.current = true;
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              apply();
              setDialogVisible(false);
              setApplyCount(0);
            }}
          >
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
              value={pvModelName}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.pvModelName = value;
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
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
              value={rowAxis}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.rowAxis = value;
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
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
              value={orientation}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.orientation = value;
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
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
              value={Util.toDegrees(tiltAngle)}
              step={1}
              formatter={(a) => Number(a).toFixed(1) + '°'}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.tiltAngle = Util.toRadians(value);
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
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
              value={rowWidthInPanels}
              formatter={(a) => Number(a).toFixed(0)}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.rowWidthInPanels = value;
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
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
              value={interRowSpacing}
              step={0.5}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.interRowSpacing = value;
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
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
              value={poleHeight}
              step={0.1}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.poleHeight = value;
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
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
              value={poleSpacing}
              step={0.5}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => {
                setCommonStore((state) => {
                  state.solarPanelArrayLayoutParams.poleSpacing = value;
                });
                setUpdateFlag(!updateFlag);
                changedRef.current = true;
              }}
            />
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default React.memo(SolarPanelLayoutWizard);
