/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Input, InputNumber, Modal, Radio, RadioChangeEvent, Row, Select, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { SolarPanelNominalSize } from '../../../models/SolarPanelNominalSize';
import { ObjectType, Orientation, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';
import { useSelectedElement } from './menuHooks';

const { Option } = Select;

const SolarPanelModelSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const getParent = useStore(Selector.getParent);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.solarPanelActionScope);
  const setActionScope = useStore(Selector.setSolarPanelActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const solarPanel = useSelectedElement(ObjectType.SolarPanel) as SolarPanelModel | undefined;

  const [selectedPvModel, setSelectedPvModel] = useState<string>(solarPanel?.pvModelName ?? 'SPR-X21-335-BLK');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [panelSizeString, setPanelSizeString] = useState<string>();
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    okButtonRef.current?.focus();
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pvModel]);

  useEffect(() => {
    setSelectedPvModel(solarPanel?.pvModelName ?? 'SPR-X21-335-BLK');
  }, [solarPanel]);

  const updateSolarPanelModelById = (id: string, pvModelName: string) => {
    setCommonStore((state: CommonStoreState) => {
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.id === id && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.pvModelName = pvModelName;
          const pvModel = state.pvModules[pvModelName];
          if (sp.orientation === Orientation.portrait) {
            // calculate the current x-y layout
            const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
            const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
            sp.lx = nx * pvModel.width;
            sp.ly = ny * pvModel.length;
          } else {
            // calculate the current x-y layout
            const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
            const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
            sp.lx = nx * pvModel.length;
            sp.ly = ny * pvModel.width;
          }
          if (sp.parentType === ObjectType.Wall) {
          }
          break;
        }
      }
    });
  };

  const updateSolarPanelModelAboveFoundation = (foundationId: string, pvModelName: string) => {
    setCommonStore((state: CommonStoreState) => {
      const pvModel = state.pvModules[pvModelName];
      let updateWall = false;
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && e.foundationId === foundationId && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.pvModelName = pvModelName;
          if (sp.orientation === Orientation.portrait) {
            // calculate the current x-y layout
            const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
            const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
            sp.lx = nx * pvModel.width;
            sp.ly = ny * pvModel.length;
          } else {
            // calculate the current x-y layout
            const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
            const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
            sp.lx = nx * pvModel.length;
            sp.ly = ny * pvModel.width;
          }
          if (sp.parentType === ObjectType.Wall) {
            updateWall = true;
          }
        }
      }
      if (updateWall) {
      }
    });
  };

  const updateSolarPanelModelOnSurface = (parentId: string, normal: number[] | undefined, pvModelName: string) => {
    setCommonStore((state: CommonStoreState) => {
      const pvModel = state.pvModules[pvModelName];
      let updateWall = false;
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          let found;
          if (normal) {
            found = e.parentId === parentId && Util.isIdentical(e.normal, normal);
          } else {
            found = e.parentId === parentId;
          }
          if (found) {
            const sp = e as SolarPanelModel;
            sp.pvModelName = pvModelName;
            if (sp.orientation === Orientation.portrait) {
              // calculate the current x-y layout
              const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
              const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
              sp.lx = nx * pvModel.width;
              sp.ly = ny * pvModel.length;
            } else {
              // calculate the current x-y layout
              const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
              const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
              sp.lx = nx * pvModel.length;
              sp.ly = ny * pvModel.width;
            }
            if (sp.parentType === ObjectType.Wall) {
              updateWall = true;
            }
          }
        }
      }
      if (updateWall) {
      }
    });
  };

  const updateSolarPanelModelForAll = (pvModelName: string) => {
    setCommonStore((state: CommonStoreState) => {
      const pvModel = state.pvModules[pvModelName];
      let updateWall = false;
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel && !e.locked) {
          const sp = e as SolarPanelModel;
          sp.pvModelName = pvModelName;
          if (sp.orientation === Orientation.portrait) {
            // calculate the current x-y layout
            const nx = Math.max(1, Math.round(sp.lx / pvModel.width));
            const ny = Math.max(1, Math.round(sp.ly / pvModel.length));
            sp.lx = nx * pvModel.width;
            sp.ly = ny * pvModel.length;
          } else {
            // calculate the current x-y layout
            const nx = Math.max(1, Math.round(sp.lx / pvModel.length));
            const ny = Math.max(1, Math.round(sp.ly / pvModel.width));
            sp.lx = nx * pvModel.length;
            sp.ly = ny * pvModel.width;
          }
          if (sp.parentType === ObjectType.Wall) {
            updateWall = true;
          }
        }
      }
      if (updateWall) {
      }
    });
  };

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (pvModelName: string) => {
    if (!solarPanel) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.pvModelName !== pvModelName) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.SolarPanel && e.foundationId === solarPanel?.foundationId && !e.locked) {
            const sp = e as SolarPanelModel;
            if (sp.pvModelName !== pvModelName) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(solarPanel);
        if (parent) {
          const isParentCuboid = parent.type === ObjectType.Cuboid;
          if (isParentCuboid) {
            for (const e of elements) {
              if (
                e.type === ObjectType.SolarPanel &&
                e.parentId === solarPanel.parentId &&
                Util.isIdentical(e.normal, solarPanel.normal) &&
                !e.locked
              ) {
                const sp = e as SolarPanelModel;
                if (sp.pvModelName !== pvModelName) {
                  return true;
                }
              }
            }
          } else {
            for (const e of elements) {
              if (e.type === ObjectType.SolarPanel && e.parentId === solarPanel.parentId && !e.locked) {
                const sp = e as SolarPanelModel;
                if (sp.pvModelName !== pvModelName) {
                  return true;
                }
              }
            }
          }
        }
        break;
      default:
        if (solarPanel?.pvModelName !== pvModelName) {
          return true;
        }
    }
    return false;
  };

  const setPvModel = (value: string) => {
    if (!solarPanel) return;
    if (!needChange(value)) return;
    switch (actionScope) {
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
        setApplyCount(applyCount + 1);
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
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        const parent = getParent(solarPanel);
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
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        // solar panel selected element may be outdated, make sure that we get the latest
        const sp = getElementById(solarPanel.id) as SolarPanelModel;
        const oldModel = sp ? sp.pvModelName : solarPanel.pvModelName;
        const undoableChange = {
          name: 'Set Model for Selected Solar Panel',
          timestamp: Date.now(),
          oldValue: oldModel,
          newValue: value,
          changedElementId: solarPanel.id,
          changedElementType: solarPanel.type,
          undo: () => {
            updateSolarPanelModelById(undoableChange.changedElementId, undoableChange.oldValue as string);
          },
          redo: () => {
            updateSolarPanelModelById(undoableChange.changedElementId, undoableChange.newValue as string);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateSolarPanelModelById(solarPanel.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.solarPanelModelName = value;
    });
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

  const close = () => {
    if (!solarPanel) return;
    setSelectedPvModel(solarPanel.pvModelName);
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setPvModel(selectedPvModel);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return (
    <>
      <Modal
        width={640}
        visible={true}
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
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok} ref={okButtonRef}>
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={close}
        maskClosable={false}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={13}>
            {i18n.t('pvModelPanel.Model', lang) +
              ' (' +
              Object.keys(pvModules).length +
              ' ' +
              i18n.t('word.Options', lang) +
              '):'}
          </Col>
          <Col className="gutter-row" span={11}>
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
                  {key +
                    (pvModules[key].bifacialityFactor > 0 ? ' (' + i18n.t('pvModelPanel.Bifacial', lang) + ')' : '')}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={13}>
            {i18n.t('pvModelPanel.PanelSize', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={11}>
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
          <Col className="gutter-row" span={13}>
            {i18n.t('pvModelPanel.CellType', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={11}>
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
              <Option key={'Polycrystalline'} value={'Polycrystalline'}>
                {i18n.t('pvModelPanel.Polycrystalline', lang)}
              </Option>
              <Option key={'Thin Film'} value={'Thin Film'}>
                {i18n.t('pvModelPanel.ThinFilm', lang)}
              </Option>
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={13}>
            {i18n.t('pvModelPanel.BifacialityFactor', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={11}>
            <InputNumber
              disabled={true}
              style={{ width: '100%' }}
              precision={2}
              value={pvModel.bifacialityFactor}
              onChange={(value) => {
                if (solarPanel) {
                  // TODO for custom solar panel
                }
              }}
            />
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={13}>
            {i18n.t('word.Color', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={11}>
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
              <Option key={'Blue'} value={'Blue'}>
                {i18n.t('pvModelPanel.Blue', lang)}
              </Option>
            </Select>
          </Col>
        </Row>
        <Row gutter={6} style={{ paddingBottom: '4px' }}>
          <Col className="gutter-row" span={13}>
            {i18n.t('pvModelPanel.SolarCellEfficiency', lang) + ' (%):'}
          </Col>
          <Col className="gutter-row" span={11}>
            <InputNumber
              disabled={true}
              style={{ width: '100%' }}
              precision={1}
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
          <Col className="gutter-row" span={13}>
            {i18n.t('pvModelPanel.NominalOperatingCellTemperature', lang) + ' (°C):'}
          </Col>
          <Col className="gutter-row" span={11}>
            <InputNumber
              disabled={true}
              style={{ width: '100%' }}
              precision={1}
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
          <Col className="gutter-row" span={13}>
            {i18n.t('pvModelPanel.TemperatureCoefficientOfPmax', lang) + ' (%/°C):'}
          </Col>
          <Col className="gutter-row" span={11}>
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
        <Row
          gutter={6}
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
        >
          <Col className="gutter-row" span={3}>
            {i18n.t('word.ApplyTo', lang) + ':'}
          </Col>
          <Col className="gutter-row" span={21}>
            <Radio.Group onChange={onScopeChange} value={actionScope}>
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

export default SolarPanelModelSelection;
