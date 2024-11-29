/*
 * @Copyright 2024. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DeleteOutlined,
  ExportOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Button, Col, Divider, Input, InputNumber, List, Modal, Row, Select, Space, Tabs, TabsProps } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import i18n from '../i18n/i18n';
import { useLanguage } from '../hooks';
import { PvModel } from '../models/PvModel';
import { ObjectType, ShadeTolerance } from '../types';
import { showError, showInfo } from '../helpers';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { UndoableCustomSolarPanelAction } from '../undo/UndoableCustomSolarPanelAction';

const { Option } = Select;

const SolarPanelCustomizationPanel = React.memo(({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const supportedPvModules = useStore(Selector.supportedPvModules);
  const customPvModules = useStore(Selector.customPvModules);
  const addCustomPvModule = useStore(Selector.addCustomPvModule);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<string>('Unknown');
  const brandRef = useRef<string>('Unknown');
  const cellTypeRef = useRef<string>('Monocrystalline');
  const cellNxRef = useRef<number>(12);
  const cellNyRef = useRef<number>(8);
  const colorRef = useRef<string>('Black');
  const widthRef = useRef<number>(1);
  const lengthRef = useRef<number>(1.5);
  const bifacialityFactorRef = useRef<number>(0);
  const efficiencyRef = useRef<number>(0.2);
  const noctRef = useRef<number>(45);
  const pmaxRef = useRef<number>(300);
  const pmaxTCRef = useRef<number>(-0.002);
  const thicknessRef = useRef<number>(0.005);
  const weightRef = useRef<number>(30);
  const vmppRef = useRef<number>(30);
  const imppRef = useRef<number>(10);
  const vocRef = useRef<number>(40);
  const iscRef = useRef<number>(15);

  const lang = useLanguage();

  useEffect(() => {
    const nodes = document.getElementsByClassName('ant-modal-wrap');
    if (nodes) {
      for (const node of nodes) {
        //@ts-expect-error ignore
        node.style['pointer-events'] = 'none';
      }
    }
  }, []);

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

  const names = useMemo(() => {
    const array: string[] = [];
    for (const key in customPvModules) {
      array.push(key);
    }
    return array;
  }, [customPvModules]);

  const getPv = (): PvModel => {
    return {
      name: modelRef.current.trim(),
      brand: brandRef.current.trim(),
      cellType: cellTypeRef.current,
      efficiency: efficiencyRef.current,
      length: lengthRef.current,
      nominalLength: lengthRef.current,
      width: widthRef.current,
      nominalWidth: widthRef.current,
      thickness: thicknessRef.current,
      m: cellNxRef.current,
      n: cellNyRef.current,
      pmax: pmaxRef.current,
      vmpp: vmppRef.current,
      impp: imppRef.current,
      voc: vocRef.current,
      isc: iscRef.current,
      pmaxTC: pmaxTCRef.current,
      noct: noctRef.current,
      weight: weightRef.current,
      color: colorRef.current,
      shadeTolerance: ShadeTolerance.PARTIAL,
      bifacialityFactor: bifacialityFactorRef.current,
    } as PvModel;
  };

  const setPv = (pv: PvModel) => {
    modelRef.current = pv.name;
    brandRef.current = pv.brand;
    cellTypeRef.current = pv.cellType;
    efficiencyRef.current = pv.efficiency;
    lengthRef.current = pv.length;
    widthRef.current = pv.width;
    thicknessRef.current = pv.thickness;
    cellNxRef.current = pv.m;
    cellNyRef.current = pv.n;
    pmaxRef.current = pv.pmax;
    vmppRef.current = pv.vmpp;
    imppRef.current = pv.impp;
    vocRef.current = pv.voc;
    iscRef.current = pv.isc;
    pmaxTCRef.current = pv.pmaxTC;
    noctRef.current = pv.noct;
    weightRef.current = pv.weight;
    colorRef.current = pv.color;
    bifacialityFactorRef.current = pv.bifacialityFactor;
  };

  const confirmAddCustomSolarPanel = () => {
    if (modelRef.current.trim() === '') {
      Modal.info({
        title: i18n.t('pvModelPanel.CannotAddCustomSolarPanel', lang),
        content: i18n.t('pvModelPanel.CustomSolarPanelMustHaveModelName', lang) + '.',
      });
      return;
    }
    if (supportedPvModules[modelRef.current.trim()]) {
      Modal.info({
        title: i18n.t('pvModelPanel.NoNeedToAddThisCustomSolarPanel', lang),
        content: i18n.t('pvModelPanel.SolarPanelModelAlreadyProvidedBySystem', lang) + ' (' + modelRef.current + ').',
      });
      return;
    }
    if (names.includes(modelRef.current)) {
      Modal.info({
        title: i18n.t('pvModelPanel.CannotAddCustomSolarPanel', lang),
        content: i18n.t('pvModelPanel.CustomSolarPanelExists', lang) + ': "' + modelRef.current + '"',
      });
    } else {
      const pv = getPv();
      const undoableAdd = {
        name: 'Add Custom Solar Panel',
        timestamp: Date.now(),
        pvModel: pv,
        undo: () => {
          deletePvModel(modelRef.current.trim());
        },
        redo: () => {
          addCustomPvModule(pv);
        },
      } as UndoableCustomSolarPanelAction;
      addUndoable(undoableAdd);
      addCustomPvModule(pv);
    }
  };

  const parsePv = (text: string) => {
    try {
      const pv = JSON.parse(text);
      // if the clipboard does not have either of these two properties, then it is not a solar panel,
      // even though the parser does not return a parsing error
      if (!pv['cellType'] || !pv['pmax']) {
        showError(i18n.t('pvModelPanel.FailInImportingDataFromClipboard', lang));
        return;
      }
      setPv(pv as PvModel);
      setUpdateFlag(!updateFlag);
    } catch (err) {
      showError(i18n.t('pvModelPanel.FailInImportingDataFromClipboard', lang) + ':' + err);
    }
  };

  const confirmImportFromClipboard = () => {
    Modal.confirm({
      title: i18n.t('pvModelPanel.DoYouReallyWantToImportCustomSolarPanel', lang) + '?',
      content: (
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          <WarningOutlined style={{ marginRight: '6px' }} />
          {i18n.t('word.Warning', lang) + ': ' + i18n.t('pvModelPanel.ExistingSettingsWillBeOverwritten', lang) + '.'}
        </span>
      ),
      icon: <QuestionCircleOutlined />,
      onOk: () => {
        navigator.clipboard
          .readText()
          .then((text) => {
            const undoableImport = {
              name: 'Import Custom Solar Panel',
              timestamp: Date.now(),
              pvModel: getPv(),
              info: text,
              undo: () => {
                setPv(undoableImport.pvModel);
                console.log(getPv().name);
                setUpdateFlag(!updateFlag);
              },
              redo: () => {
                if (undoableImport.info) parsePv(undoableImport.info);
                console.log(getPv().name);
              },
            } as UndoableCustomSolarPanelAction;
            addUndoable(undoableImport);
            parsePv(text);
          })
          .catch((err) => {
            showError(i18n.t('pvModelPanel.FailInImportingDataFromClipboard', lang) + ':' + err);
          });
      },
    });
  };

  const deletePvModel = (name: string) => {
    setCommonStore((state) => {
      delete state.customPvModules[name];
    });
  };

  const removeCustomPvModule = (name: string) => {
    setCommonStore((state) => {
      let used = false;
      for (const e of state.elements) {
        if (e.type === ObjectType.SolarPanel) {
          if ((e as SolarPanelModel).pvModelName === name) {
            used = true;
            break;
          }
        }
      }
      if (used) {
        showError(i18n.t('pvModelPanel.ThisCustomSolarPanelIsUsed', { lng: state.language }));
      } else {
        const selectedPvModel = { ...state.customPvModules[name] };
        const undoableRemove = {
          name: 'Remove Custom Solar Panel',
          timestamp: Date.now(),
          pvModel: selectedPvModel,
          undo: () => {
            addCustomPvModule(selectedPvModel);
          },
          redo: () => {
            deletePvModel(name);
          },
        } as UndoableCustomSolarPanelAction;
        addUndoable(undoableRemove);
        delete state.customPvModules[name];
      }
    });
  };

  const confirmRemoveCustomSolarPanel = (name: string) => {
    Modal.confirm({
      title: i18n.t('pvModelPanel.DoYouReallyWantToRemoveThisCustomSolarPanel', lang) + ' "' + name + '"?',
      content: (
        <span style={{ color: 'red', fontWeight: 'bold' }}>
          <WarningOutlined style={{ marginRight: '6px' }} />
          {i18n.t('word.Warning', lang) +
            ': ' +
            i18n.t('pvModelPanel.MakeSureThisCustomSolarPanelIsNotUsed', lang) +
            '.'}
        </span>
      ),
      icon: <QuestionCircleOutlined />,
      onOk: () => {
        removeCustomPvModule(name);
      },
    });
  };

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: i18n.t('pvModelPanel.General', lang),
      children: (
        <>
          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>{i18n.t('pvModelPanel.Model', lang) + ': '}</Col>
            <Col span={10}>
              <Input
                style={{ width: '100%' }}
                value={modelRef.current}
                onChange={(e) => {
                  modelRef.current = e.target.value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>{i18n.t('word.BrandName', lang) + ': '}</Col>
            <Col span={10}>
              <Input
                style={{ width: '100%' }}
                value={brandRef.current}
                onChange={(e) => {
                  brandRef.current = e.target.value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>{i18n.t('pvModelPanel.CellType', lang) + ':'}</Col>
            <Col span={10}>
              <Select
                style={{ width: '100%' }}
                value={cellTypeRef.current}
                onChange={(value) => {
                  cellTypeRef.current = value;
                  setUpdateFlag(!updateFlag);
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
            <Col span={14}>
              {i18n.t('word.Length', lang) + ' ([0.1, 3]' + i18n.t('word.MeterAbbreviation', lang) + '): '}
            </Col>
            <Col span={10}>
              <InputNumber
                min={0.1}
                max={3}
                style={{ width: '100%' }}
                precision={3}
                value={lengthRef.current}
                step={0.01}
                onChange={(value) => {
                  if (value === null) return;
                  lengthRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
                onBlur={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  lengthRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
                onPressEnter={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  lengthRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>
              {i18n.t('word.Width', lang) + ' ([0.1, 3]' + i18n.t('word.MeterAbbreviation', lang) + '): '}
            </Col>
            <Col span={10}>
              <InputNumber
                min={0.1}
                max={3}
                style={{ width: '100%' }}
                precision={3}
                value={widthRef.current}
                step={0.01}
                onChange={(value) => {
                  if (value === null) return;
                  widthRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
                onBlur={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  widthRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
                onPressEnter={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  widthRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>{i18n.t('pvModelPanel.PowerBifaciality', lang) + ' ([0, 1]):'}</Col>
            <Col span={10}>
              <InputNumber
                style={{ width: '100%' }}
                precision={2}
                step={0.01}
                value={bifacialityFactorRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  bifacialityFactorRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>
              {i18n.t('pvModelPanel.Weight', lang) + ' (' + i18n.t('pvModelPanel.Kilogram', lang) + '):'}
            </Col>
            <Col span={10}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                step={0.1}
                value={weightRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  weightRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>{i18n.t('word.Thickness', lang) + ' (' + i18n.t('word.MeterAbbreviation', lang) + '):'}</Col>
            <Col span={10}>
              <InputNumber
                style={{ width: '100%' }}
                precision={4}
                step={0.0001}
                value={thicknessRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  thicknessRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={14}>{i18n.t('word.Color', lang) + ':'}</Col>
            <Col span={10}>
              <Select
                style={{ width: '100%' }}
                value={colorRef.current}
                onChange={(value) => {
                  colorRef.current = value;
                  setUpdateFlag(!updateFlag);
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
        </>
      ),
    },
    {
      key: '2',
      label: i18n.t('pvModelPanel.Electrical', lang),
      children: (
        <>
          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>{i18n.t('pvModelPanel.SolarCellEfficiency', lang) + ' (%):'}</Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                step={0.1}
                value={100 * efficiencyRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  efficiencyRef.current = value * 0.01;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>{i18n.t('pvModelPanel.CellCountInXDirection', lang) + ': '}</Col>
            <Col span={8}>
              <InputNumber
                min={1}
                max={36}
                style={{ width: '100%' }}
                precision={0}
                value={cellNxRef.current}
                step={1}
                onChange={(value) => {
                  if (value === null) return;
                  cellNxRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
                onBlur={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNxRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
                onPressEnter={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNxRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>{i18n.t('pvModelPanel.CellCountInYDirection', lang) + ': '}</Col>
            <Col span={8}>
              <InputNumber
                min={1}
                max={36}
                style={{ width: '100%' }}
                precision={0}
                value={cellNyRef.current}
                step={1}
                onChange={(value) => {
                  if (value === null) return;
                  cellNyRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
                onBlur={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNyRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
                onPressEnter={(e) => {
                  const v = parseFloat((e.target as HTMLInputElement).value);
                  cellNyRef.current = Number.isNaN(v) ? 1 : v;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>
              {i18n.t('pvModelPanel.MaximumRatedPower', lang) +
                ' Pmax (' +
                i18n.t('word.WattAbbreviation', lang) +
                '):'}
            </Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                step={1}
                value={pmaxRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  pmaxRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>{i18n.t('pvModelPanel.TemperatureCoefficientOfPmax', lang) + ' (%/°C):'}</Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                step={0.0001}
                value={pmaxTCRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  pmaxTCRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>{i18n.t('pvModelPanel.NominalOperatingCellTemperature', lang) + ' (°C):'}</Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                step={1}
                precision={1}
                value={noctRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  noctRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>
              {i18n.t('pvModelPanel.RatedVoltage', lang) + ' Vmpp (' + i18n.t('word.VoltAbbreviation', lang) + '):'}
            </Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                step={0.1}
                value={vmppRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  vmppRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>
              {i18n.t('pvModelPanel.RatedCurrent', lang) + ' Impp (' + i18n.t('word.AmpereAbbreviation', lang) + '):'}
            </Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={2}
                step={0.1}
                value={imppRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  imppRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>
              {i18n.t('pvModelPanel.OpenCircuitVoltage', lang) +
                ' Voc (' +
                i18n.t('word.VoltAbbreviation', lang) +
                '):'}
            </Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={1}
                step={0.1}
                value={vocRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  vocRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>

          <Row gutter={6} style={{ paddingBottom: '4px' }}>
            <Col span={16}>
              {i18n.t('pvModelPanel.ShortCircuitCurrent', lang) +
                ' Isc (' +
                i18n.t('word.AmpereAbbreviation', lang) +
                '):'}
            </Col>
            <Col span={8}>
              <InputNumber
                style={{ width: '100%' }}
                precision={2}
                step={0.1}
                value={iscRef.current}
                onChange={(value) => {
                  if (value === null) return;
                  iscRef.current = value;
                  setUpdateFlag(!updateFlag);
                }}
              />
            </Col>
          </Row>
        </>
      ),
    },
  ];

  return (
    <Modal
      width={720}
      open={true}
      title={
        <div
          style={{ width: '100%', cursor: 'move' }}
          onMouseOver={() => setDragEnabled(true)}
          onMouseOut={() => setDragEnabled(false)}
        >
          {i18n.t('menu.settings.CustomizeSolarPanel', lang)}
        </div>
      }
      footer={[
        <Button key="Close" onClick={() => setDialogVisible(false)}>
          {i18n.t('word.Close', lang)}
        </Button>,
      ]}
      // this must be specified for the x button in the upper-right corner to work
      onCancel={() => setDialogVisible(false)}
      maskClosable={false}
      mask={false}
      destroyOnClose={false}
      modalRender={(modal) => (
        <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
          <div ref={dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Col flex={3}>
          <Tabs defaultActiveKey="1" type="card" items={items} />
        </Col>
        <Col flex={0.5}>
          <Space style={{ height: '100%', justifyContent: 'center', marginLeft: '12px' }} direction={'vertical'}>
            <ArrowRightOutlined
              title={i18n.t('word.Add', lang)}
              style={{
                cursor: 'pointer',
                fontSize: '20px',
                color: 'dimgray',
                border: '2px solid lightgray',
                borderRadius: '6px',
                padding: '4px',
              }}
              onClick={() => confirmAddCustomSolarPanel()}
            />
            <Divider style={{ marginTop: '12px', marginBottom: '12px' }} />
            <ArrowLeftOutlined
              title={i18n.t('pvModelPanel.ImportCustomSolarPanelFromClipboard', lang)}
              style={{
                cursor: 'pointer',
                fontSize: '20px',
                color: 'dimgray',
                border: '2px solid lightgray',
                borderRadius: '6px',
                padding: '4px',
              }}
              onClick={() => {
                confirmImportFromClipboard();
              }}
            />
          </Space>
        </Col>
        <Col flex={2}>
          <List
            style={{ marginTop: '56px', marginLeft: '8px' }}
            size="small"
            header={<div style={{ fontWeight: 'bold' }}>{i18n.t('pvModelPanel.AddedCustomSolarPanels', lang)}</div>}
            bordered
            dataSource={names}
            renderItem={(item) => (
              <List.Item key={item}>
                <ExportOutlined
                  title={i18n.t('pvModelPanel.ExportThisCustomSolarPanel', lang)}
                  style={{ paddingRight: '4px', cursor: 'pointer' }}
                  onClick={() => {
                    const pv = customPvModules[item];
                    navigator.clipboard.writeText(JSON.stringify(pv)).then(() => {
                      showInfo(i18n.t('pvModelPanel.CustomSolarPanelExportedToClipboard', lang) + ' (' + item + ').');
                    });
                  }}
                />
                <DeleteOutlined
                  title={i18n.t('word.Delete', lang)}
                  style={{ paddingRight: '6px', cursor: 'pointer' }}
                  onClick={() => confirmRemoveCustomSolarPanel(item)}
                />
                {item}
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </Modal>
  );
});

export default SolarPanelCustomizationPanel;
