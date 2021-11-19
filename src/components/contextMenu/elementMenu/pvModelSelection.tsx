/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Input, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { SolarPanelNominalSize } from '../../../models/SolarPanelNominalSize';
import { ObjectType, Scope, ShadeTolerance } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';

const { Option } = Select;

const PvModelSelection = ({
  pvModelDialogVisible,
  setPvModelDialogVisible,
}: {
  pvModelDialogVisible: boolean;
  setPvModelDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateSolarPanelModelById = useStore(Selector.updateSolarPanelModelById);
  const updateSolarPanelModelOnSurface = useStore(Selector.updateSolarPanelModelOnSurface);
  const updateSolarPanelModelAboveFoundation = useStore(Selector.updateSolarPanelModelAboveFoundation);
  const updateSolarPanelModelForAll = useStore(Selector.updateSolarPanelModelForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [selectedPvModel, setSelectedPvModel] = useState<string>(solarPanel?.pvModelName ?? 'SPR-X21-335-BLK');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [panelSizeString, setPanelSizeString] = useState<string>();
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };
  const pvModel = getPvModule(selectedPvModel ?? 'SPR-X21-335-BLK');

  useEffect(() => {
    setPanelSizeString(
      pvModel.nominalWidth.toFixed(2) +
        'm×' +
        pvModel.nominalLength.toFixed(2) +
        'm (' +
        pvModel.n +
        '×' +
        pvModel.m +
        ' ' +
        i18n.t('pvModelPanel.Cells', lang) +
        ')',
    );
  }, [pvModel]);

  useEffect(() => {
    setSelectedPvModel(solarPanel?.pvModelName ?? 'SPR-X21-335-BLK');
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setPvModel = (value: string) => {
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldModelsAll = new Map<string, string>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldModelsAll.set(elem.id, (elem as SolarPanelModel).pvModelName);
          }
        }
        const undoableChangeAll = {
          name: 'Set Model for All Solar Panels',
          timestamp: Date.now(),
          oldValues: oldModelsAll,
          newValue: value,
          undo: () => {
            for (const [id, model] of undoableChangeAll.oldValues.entries()) {
              updateSolarPanelModelById(id, model as string);
            }
          },
          redo: () => {
            updateSolarPanelModelForAll(undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelModelForAll(value);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          const oldModelsAboveFoundation = new Map<string, string>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldModelsAboveFoundation.set(elem.id, (elem as SolarPanelModel).pvModelName);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Model for All Solar Panels Above Foundation',
            timestamp: Date.now(),
            oldValues: oldModelsAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, model] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateSolarPanelModelById(id, model as string);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelModelAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelModelAboveFoundation(solarPanel.foundationId, value);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (solarPanel.parentId) {
          const parent = getElementById(solarPanel.parentId);
          if (parent) {
            const oldModelsOnSurface = new Map<string, string>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  oldModelsOnSurface.set(elem.id, (elem as SolarPanelModel).pvModelName);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  oldModelsOnSurface.set(elem.id, (elem as SolarPanelModel).pvModelName);
                }
              }
            }
            const normal = isParentCuboid ? solarPanel.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Model for All Solar Panels on Surface',
              timestamp: Date.now(),
              oldValues: oldModelsOnSurface,
              newValue: value,
              groupId: solarPanel.parentId,
              normal: normal,
              undo: () => {
                for (const [id, model] of undoableChangeOnSurface.oldValues.entries()) {
                  updateSolarPanelModelById(id, model as string);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateSolarPanelModelOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as string,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateSolarPanelModelOnSurface(solarPanel.parentId, normal, value);
          }
        }
        break;
      default:
        const oldModel = solarPanel.pvModelName;
        const undoableChange = {
          name: 'Set Model for Selected Solar Panel',
          timestamp: Date.now(),
          oldValue: oldModel,
          newValue: value,
          undo: () => {
            updateSolarPanelModelById(solarPanel.id, undoableChange.oldValue as string);
          },
          redo: () => {
            updateSolarPanelModelById(solarPanel.id, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateSolarPanelModelById(solarPanel.id, value);
    }
    setUpdateFlag(!updateFlag);
  };

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

  return (
    <>
      <Modal
        width={600}
        visible={pvModelDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('pvModelPanel.SolarPanelSpecs', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setPvModel(selectedPvModel);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setSelectedPvModel(solarPanel.pvModelName);
              setPvModelDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setPvModel(selectedPvModel);
              setPvModelDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button at the upper-right corner to work
        onCancel={() => {
          setSelectedPvModel(solarPanel.pvModelName);
          setPvModelDialogVisible(false);
        }}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('pvModelPanel.Model', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              defaultValue="Custom"
              style={{ width: '100%' }}
              value={selectedPvModel}
              onChange={(value) => {
                setSelectedPvModel(value);
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
            {i18n.t('pvModelPanel.PanelSize', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              disabled={true}
              style={{ width: '100%' }}
              value={panelSizeString}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            >
              {SolarPanelNominalSize.instance.nominalStrings.map((key) => (
                <Option key={key} value={key}>
                  {key}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('pvModelPanel.CellType', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              disabled={true}
              style={{ width: '100%' }}
              value={pvModel.cellType}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            >
              <Option key={'Monocrystalline'} value={'Monocrystalline'}>
                {i18n.t('pvModelPanel.Monocrystalline', lang)}
              </Option>
              )
              <Option key={'Polycrystalline'} value={'Polycrystalline'}>
                {i18n.t('pvModelPanel.Polycrystalline', lang)}
              </Option>
              )
              <Option key={'Thin Film'} value={'Thin Film'}>
                {i18n.t('pvModelPanel.ThinFilm', lang)}
              </Option>
              )
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('word.Color', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              disabled={true}
              style={{ width: '100%' }}
              value={pvModel.color}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            >
              <Option key={'Black'} value={'Black'}>
                {i18n.t('pvModelPanel.Black', lang)}
              </Option>
              )
              <Option key={'Blue'} value={'Blue'}>
                {i18n.t('pvModelPanel.Blue', lang)}
              </Option>
              )
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('pvModelPanel.SolarCellEfficiency', lang) + ' (%):'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Input
              disabled={true}
              style={{ width: '100%' }}
              value={100 * pvModel.efficiency}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            />
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('pvModelPanel.NominalOperatingCellTemperature', lang) + ' (°C):'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Input
              disabled={true}
              style={{ width: '100%' }}
              value={pvModel.noct}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            />
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('pvModelPanel.TemperatureCoefficientOfPmax', lang) + ' (%/°C):'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Input
              disabled={true}
              style={{ width: '100%' }}
              value={pvModel.pmaxTC}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            />
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={14}>
            {i18n.t('pvModelPanel.ShadeTolerance', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={10}>
            <Select
              disabled={true}
              style={{ width: '100%' }}
              value={pvModel.shadeTolerance}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            >
              <Option key={ShadeTolerance.HIGH} value={ShadeTolerance.HIGH}>
                {ShadeTolerance.HIGH}
              </Option>
              )
              <Option key={ShadeTolerance.NONE} value={ShadeTolerance.NONE}>
                {ShadeTolerance.NONE}
              </Option>
              )
              <Option key={ShadeTolerance.PARTIAL} value={ShadeTolerance.PARTIAL}>
                {ShadeTolerance.PARTIAL}
              </Option>
              )
            </Select>
          </Col>
        </Row>
        <Row
          gutter={6}
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
        >
          <Col className="gutter-row" span={3}>
            {i18n.t('word.ApplyTo', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={21}>
            <Radio.Group onChange={onScopeChange} value={solarPanelActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                  {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('solarPanelMenu.AllSolarPanels', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default PvModelSelection;
