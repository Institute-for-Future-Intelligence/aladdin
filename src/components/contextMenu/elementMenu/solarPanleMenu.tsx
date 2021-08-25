import { Checkbox, Input, InputNumber, Menu, Select, Space } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import React, { useState } from 'react';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { useStore } from 'src/stores/common';
import { Orientation, TrackerType } from 'src/types';
import { Util } from 'src/Util';
import { Copy, Cut } from '../menuItems';

const { Option } = Select;

export const SolarPanelMenu = ({ setPvDialogVisible }: { setPvDialogVisible: (visible: boolean) => void }) => {
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const selectedElement = getSelectedElement();
  const setElementSize = useStore((state) => state.setElementSize);
  const updateElementById = useStore((state) => state.updateElementById);

  const [labelText, setLabelText] = useState<string>(selectedElement?.label ?? '');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);

  const solarPanel = selectedElement as SolarPanelModel;
  const dx = solarPanel.orientation === Orientation.portrait ? solarPanel.pvModel.width : solarPanel.pvModel.length;
  const dy = solarPanel.orientation === Orientation.portrait ? solarPanel.pvModel.length : solarPanel.pvModel.width;

  const showElementLabel = (e: CheckboxChangeEvent) => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { showLabel: e.target.checked });
      setUpdateFlag(!updateFlag);
    }
  };

  const updateElementLabelText = () => {
    if (selectedElement) {
      updateElementById(selectedElement.id, { label: labelText });
      setUpdateFlag(!updateFlag);
    }
  };

  return (
    <>
      <Copy />
      <Cut />
      <Menu.Item
        key={'solar-panel-change'}
        onClick={() => {
          setPvDialogVisible(true);
        }}
        style={{ paddingLeft: '40px' }}
      >
        Change PV Model {'(' + solarPanel.pvModel.name + ')'}...
      </Menu.Item>
      <Menu>
        <Menu.Item key={'solar-panel-orientation'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>Orientation: </Space>
          <Select
            style={{ width: '120px' }}
            value={solarPanel.orientation}
            onChange={(value) => {
              if (solarPanel) {
                if (value === Orientation.portrait) {
                  // calculate the current x-y layout
                  const nx = Math.max(1, Math.round(solarPanel.lx / solarPanel.pvModel.width));
                  const ny = Math.max(1, Math.round(solarPanel.ly / solarPanel.pvModel.length));
                  setElementSize(solarPanel.id, nx * solarPanel.pvModel.width, ny * solarPanel.pvModel.length);
                } else {
                  // calculate the current x-y layout
                  const nx = Math.max(1, Math.round(solarPanel.lx / solarPanel.pvModel.length));
                  const ny = Math.max(1, Math.round(solarPanel.ly / solarPanel.pvModel.width));
                  setElementSize(solarPanel.id, nx * solarPanel.pvModel.length, ny * solarPanel.pvModel.width);
                }
                updateElementById(solarPanel.id, { orientation: value });
                setUpdateFlag(!updateFlag);
              }
            }}
          >
            <Option key={Orientation.portrait} value={Orientation.portrait}>
              {Orientation.portrait}
            </Option>
            )
            <Option key={Orientation.landscape} value={Orientation.landscape}>
              {Orientation.landscape}
            </Option>
            )
          </Select>
        </Menu.Item>
        <Menu.Item key={'solar-panel-width'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>{'Width (' + Math.round(solarPanel.lx / dx) + ' panels):'}</Space>
          <InputNumber
            min={dx}
            max={100 * dx}
            step={dx}
            style={{ width: 120 }}
            precision={2}
            value={solarPanel.lx}
            formatter={(a) => Number(a).toFixed(2) + ' m'}
            onChange={(value) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, { lx: value ?? 1 });
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
        <Menu.Item key={'solar-panel-length'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>{'Length (' + Math.round(solarPanel.ly / dy) + ' panels):'}</Space>
          <InputNumber
            min={dy}
            max={100 * dy}
            step={dy}
            style={{ width: 120 }}
            precision={2}
            value={solarPanel.ly}
            formatter={(a) => Number(a).toFixed(2) + ' m'}
            onChange={(value) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, { ly: value ?? 2 });
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
        <Menu.Item key={'solar-panel-tilt-angle'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>Tilt Angle: </Space>
          <InputNumber
            min={-90}
            max={90}
            style={{ width: 120 }}
            precision={1}
            value={Util.toDegrees(solarPanel.tiltAngle)}
            step={1}
            formatter={(a) => Number(a).toFixed(1) + '°'}
            onChange={(value) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, { tiltAngle: Util.toRadians(value ?? 0) });
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
        <Menu.Item key={'solar-panel-relative-azimuth'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>Relative Azimuth: </Space>
          <InputNumber
            min={-180}
            max={180}
            style={{ width: 120 }}
            precision={1}
            value={Util.toDegrees(solarPanel.relativeAzimuth)}
            step={1}
            formatter={(a) => Number(a).toFixed(1) + '°'}
            onChange={(value) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, {
                  relativeAzimuth: Util.toRadians(value ?? 0),
                });
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
        <Menu.Item key={'solar-panel-tracker'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>Tracker: </Space>
          <Select
            style={{ width: '120px' }}
            value={solarPanel.trackerType}
            onChange={(value) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, { trackerType: value });
                setUpdateFlag(!updateFlag);
              }
            }}
          >
            <Option key={'NONE'} value={TrackerType.NO_TRACKER} title={'No tracker'}>
              None
            </Option>
            )
            <Option
              key={'HSAT'}
              value={TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER}
              title={'Horizontal single axis tracker'}
            >
              HSAT
            </Option>
            )
            <Option
              key={'VSAT'}
              value={TrackerType.VERTICAL_SINGLE_AXIS_TRACKER}
              title={'Vertical single axis tracker'}
            >
              VSAT
            </Option>
            )
            <Option
              key={'AADAT'}
              value={TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER}
              title={'Altazimuth single axis tracker'}
            >
              AADAT
            </Option>
            )
          </Select>
        </Menu.Item>
        <Menu.Item key={'solar-panel-pole-height'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>Pole Height: </Space>
          <InputNumber
            min={0}
            max={5}
            style={{ width: 120 }}
            step={0.1}
            precision={1}
            value={solarPanel.poleHeight}
            formatter={(a) => Number(a).toFixed(1) + ' m'}
            onChange={(e) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, { poleHeight: e });
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
        <Menu.Item key={'solar-panel-pole-spacing'} style={{ paddingLeft: '40px' }}>
          <Space style={{ width: '150px' }}>Pole Spacing: </Space>
          <InputNumber
            min={2}
            max={10}
            step={1}
            style={{ width: 120 }}
            precision={0}
            value={solarPanel.poleSpacing}
            formatter={(a) => Number(a).toFixed(0) + ' m'}
            onChange={(value) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, { poleSpacing: value ?? 1 });
                setUpdateFlag(!updateFlag);
              }
            }}
          />
        </Menu.Item>
        <Menu.Item key={'solar-panel-draw-sun-beam'}>
          <Checkbox
            checked={!!solarPanel?.drawSunBeam}
            onChange={(e) => {
              if (solarPanel) {
                updateElementById(solarPanel.id, { drawSunBeam: e.target.checked });
                setUpdateFlag(!updateFlag);
              }
            }}
          >
            Draw Sun Beam
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'solar-panel-show-label'}>
          <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
            Keep Showing Label
          </Checkbox>
        </Menu.Item>
        <Menu.Item key={'solar-panel-label-text'} style={{ paddingLeft: '40px' }}>
          <Input
            addonBefore="Label:"
            value={labelText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
            onPressEnter={updateElementLabelText}
            onBlur={updateElementLabelText}
          />
        </Menu.Item>
      </Menu>
    </>
  );
};
