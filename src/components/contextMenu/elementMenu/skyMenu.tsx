/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { Checkbox, InputNumber, Menu, Radio, Space } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Theme } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import { computeSunriseAndSunsetInMinutes } from '../../../analysis/sunTools';

export const SkyMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const addUndoable = useStore(Selector.addUndoable);
  const world = useStore.getState().world;
  const axes = useStore(Selector.viewState.axes);
  const theme = useStore(Selector.viewState.theme);
  const showAzimuthAngle = useStore(Selector.viewState.showAzimuthAngle) ?? true;
  const showElevationAngle = useStore(Selector.viewState.showElevationAngle) ?? true;
  const showZenithAngle = useStore(Selector.viewState.showZenithAngle) ?? true;
  const directLightIntensity = useStore(Selector.viewState.directLightIntensity) ?? 1;
  const ambientLightIntensity = useStore(Selector.viewState.ambientLightIntensity) ?? 0.1;
  const airAttenuationCoefficient = useStore(Selector.world.airAttenuationCoefficient) ?? 0.01;
  const airConvectiveCoefficient = useStore(Selector.world.airConvectiveCoefficient) ?? 5;
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;

  const lang = { lng: language };
  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(new Date(world.date), world.latitude);
  }, [world.date, world.latitude]);

  const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
  };

  const setAxes = (checked: boolean) => {
    setCommonStore((state) => {
      state.viewState.axes = checked;
    });
  };

  const setTheme = (theme: string) => {
    setCommonStore((state) => {
      state.viewState.theme = theme;
    });
  };

  const setShowAzimuthAngle = (value: boolean) => {
    setCommonStore((state) => {
      state.viewState.showAzimuthAngle = value;
    });
  };

  const setShowElevationAngle = (value: boolean) => {
    setCommonStore((state) => {
      state.viewState.showElevationAngle = value;
    });
  };

  const setShowZenithAngle = (value: boolean) => {
    setCommonStore((state) => {
      state.viewState.showZenithAngle = value;
    });
  };

  const setDirectLightIntensity = (value: number) => {
    setCommonStore((state) => {
      state.viewState.directLightIntensity = value;
    });
  };

  const setAmbientLightIntensity = (value: number) => {
    setCommonStore((state) => {
      state.viewState.ambientLightIntensity = value;
    });
  };

  const setAirAttenuationCoefficient = (value: number) => {
    setCommonStore((state) => {
      state.world.airAttenuationCoefficient = value;
    });
  };

  const setAirConvectiveCoefficient = (value: number) => {
    setCommonStore((state) => {
      state.world.airConvectiveCoefficient = value;
    });
  };

  const setHighestTemperatureTimeInMinutes = (value: number) => {
    setCommonStore((state) => {
      state.world.highestTemperatureTimeInMinutes = value;
    });
  };

  return (
    <Menu.ItemGroup>
      <Menu.Item key={'axes'}>
        <Checkbox
          checked={axes}
          onChange={(e) => {
            const checked = e.target.checked;
            const undoableCheck = {
              name: 'Show Axes',
              timestamp: Date.now(),
              checked: checked,
              undo: () => {
                setAxes(!undoableCheck.checked);
              },
              redo: () => {
                setAxes(undoableCheck.checked);
              },
            } as UndoableCheck;
            addUndoable(undoableCheck);
            setAxes(checked);
          }}
        >
          {i18n.t('skyMenu.Axes', lang)}
        </Checkbox>
      </Menu.Item>

      <SubMenu key={'theme'} title={i18n.t('skyMenu.Theme', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={theme}
          style={{ height: '135px' }}
          onChange={(e) => {
            const oldTheme = theme;
            const newTheme = e.target.value;
            const undoableChange = {
              name: 'Select Theme',
              timestamp: Date.now(),
              oldValue: oldTheme,
              newValue: newTheme,
              undo: () => {
                setTheme(undoableChange.oldValue as string);
              },
              redo: () => {
                setTheme(undoableChange.newValue as string);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            setTheme(newTheme);
          }}
        >
          <Radio style={radioStyle} value={Theme.Default}>
            {i18n.t('skyMenu.ThemeDefault', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Desert}>
            {i18n.t('skyMenu.ThemeDesert', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Dune}>
            {i18n.t('skyMenu.ThemeDune', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Forest}>
            {i18n.t('skyMenu.ThemeForest', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Grassland}>
            {i18n.t('skyMenu.ThemeGrassland', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Hill}>
            {i18n.t('skyMenu.ThemeHill', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Lake}>
            {i18n.t('skyMenu.ThemeLake', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Mountain}>
            {i18n.t('skyMenu.ThemeMountain', lang)}
          </Radio>
          <Radio style={radioStyle} value={Theme.Rural}>
            {i18n.t('skyMenu.ThemeRural', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>

      <SubMenu key={'sun-angles'} title={i18n.t('skyMenu.SelectSunAnglesToShow', lang)} style={{ paddingLeft: '24px' }}>
        <Menu.ItemGroup>
          <Menu.Item>
            <Checkbox
              checked={showAzimuthAngle}
              onChange={(e) => {
                const oldValue = showAzimuthAngle;
                const newValue = e.target.checked;
                const undoableChange = {
                  name: 'Show Azimuth Angle ' + newValue,
                  timestamp: Date.now(),
                  oldValue: oldValue,
                  newValue: newValue,
                  undo: () => {
                    setShowAzimuthAngle(undoableChange.oldValue as boolean);
                  },
                  redo: () => {
                    setShowAzimuthAngle(undoableChange.newValue as boolean);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setShowAzimuthAngle(newValue);
              }}
            >
              {i18n.t('skyMenu.ShowAzimuthAngle', lang)}
            </Checkbox>
          </Menu.Item>
          <Menu.Item>
            <Checkbox
              checked={showElevationAngle}
              onChange={(e) => {
                const oldValue = showElevationAngle;
                const newValue = e.target.checked;
                const undoableChange = {
                  name: 'Show Elevation Angle ' + newValue,
                  timestamp: Date.now(),
                  oldValue: oldValue,
                  newValue: newValue,
                  undo: () => {
                    setShowElevationAngle(undoableChange.oldValue as boolean);
                  },
                  redo: () => {
                    setShowElevationAngle(undoableChange.newValue as boolean);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setShowElevationAngle(newValue);
              }}
            >
              {i18n.t('skyMenu.ShowElevationAngle', lang)}
            </Checkbox>
          </Menu.Item>
          <Menu.Item>
            <Checkbox
              checked={showZenithAngle}
              onChange={(e) => {
                const oldValue = showZenithAngle;
                const newValue = e.target.checked;
                const undoableChange = {
                  name: 'Show Zenith Angle ' + newValue,
                  timestamp: Date.now(),
                  oldValue: oldValue,
                  newValue: newValue,
                  undo: () => {
                    setShowZenithAngle(undoableChange.oldValue as boolean);
                  },
                  redo: () => {
                    setShowZenithAngle(undoableChange.newValue as boolean);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setShowZenithAngle(newValue);
              }}
            >
              {i18n.t('skyMenu.ShowZenithAngle', lang)}
            </Checkbox>
          </Menu.Item>
        </Menu.ItemGroup>
      </SubMenu>

      <Menu>
        <Menu.Item
          style={{ height: '36px', paddingLeft: '36px', marginBottom: 0, marginTop: 0 }}
          key={'direct-light-intensity'}
        >
          <Space style={{ width: '270px' }}>{i18n.t('skyMenu.DirectLightBrightnessAtNoon', lang) + ' [0.1-5]:'}</Space>
          <InputNumber
            min={0.1}
            max={5}
            step={0.1}
            precision={2}
            value={directLightIntensity}
            onChange={(value) => {
              if (value) {
                const oldValue = directLightIntensity;
                const newValue = value;
                const undoableChange = {
                  name: 'Set Direct Light Intensity',
                  timestamp: Date.now(),
                  oldValue: oldValue,
                  newValue: newValue,
                  undo: () => {
                    setDirectLightIntensity(undoableChange.oldValue as number);
                  },
                  redo: () => {
                    setDirectLightIntensity(undoableChange.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setDirectLightIntensity(newValue);
              }
            }}
          />
        </Menu.Item>

        <Menu.Item
          style={{ height: '36px', paddingLeft: '36px', marginBottom: 0, marginTop: 0 }}
          key={'ambient-light-intensity'}
        >
          <Space style={{ width: '270px' }}>
            {i18n.t('skyMenu.AmbientLightBrightnessAtNoon', lang) + ' [0.01-1]:'}
          </Space>
          <InputNumber
            min={0.01}
            max={1}
            step={0.01}
            precision={2}
            value={ambientLightIntensity}
            onChange={(value) => {
              if (value) {
                const oldValue = ambientLightIntensity;
                const newValue = value;
                const undoableChange = {
                  name: 'Set Ambient Light Intensity',
                  timestamp: Date.now(),
                  oldValue: oldValue,
                  newValue: newValue,
                  undo: () => {
                    setAmbientLightIntensity(undoableChange.oldValue as number);
                  },
                  redo: () => {
                    setAmbientLightIntensity(undoableChange.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setAmbientLightIntensity(newValue);
              }
            }}
          />
        </Menu.Item>

        <Menu.Item
          style={{ height: '36px', paddingLeft: '36px', marginBottom: 0, marginTop: 0 }}
          key={'air-attenuation-coefficient'}
        >
          <Space style={{ width: '270px' }}>{i18n.t('skyMenu.SunlightAttenuationCoefficientInAir', lang) + ':'}</Space>
          <InputNumber
            min={0}
            max={0.1}
            step={0.001}
            precision={3}
            value={airAttenuationCoefficient}
            onChange={(value) => {
              if (value) {
                const oldAttenuationCoefficient = airAttenuationCoefficient;
                const newAttenuationCoefficient = value;
                const undoableChange = {
                  name: 'Set Sunlight Attenuation Coefficient of Air',
                  timestamp: Date.now(),
                  oldValue: oldAttenuationCoefficient,
                  newValue: newAttenuationCoefficient,
                  undo: () => {
                    setAirAttenuationCoefficient(undoableChange.oldValue as number);
                  },
                  redo: () => {
                    setAirAttenuationCoefficient(undoableChange.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setAirAttenuationCoefficient(newAttenuationCoefficient);
              }
            }}
          />
        </Menu.Item>

        <Menu.Item
          style={{ height: '36px', paddingLeft: '36px', marginBottom: 0, marginTop: 0 }}
          key={'air-convective-coefficient'}
        >
          <Space style={{ width: '270px' }}>
            {i18n.t('skyMenu.ConvectiveCoefficientOfAir', lang) + ' [W/(m²×K)]:'}
          </Space>
          <InputNumber
            min={2.5}
            max={20}
            step={0.1}
            precision={2}
            value={airConvectiveCoefficient}
            onChange={(value) => {
              if (value) {
                const oldConvectiveCoefficient = airConvectiveCoefficient;
                const newConvectiveCoefficient = value;
                const undoableChange = {
                  name: 'Set Convective Coefficient of Air',
                  timestamp: Date.now(),
                  oldValue: oldConvectiveCoefficient,
                  newValue: newConvectiveCoefficient,
                  undo: () => {
                    setAirConvectiveCoefficient(undoableChange.oldValue as number);
                  },
                  redo: () => {
                    setAirConvectiveCoefficient(undoableChange.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setAirConvectiveCoefficient(newConvectiveCoefficient);
              }
            }}
          />
        </Menu.Item>

        <Menu.Item
          style={{ height: '36px', paddingLeft: '36px', marginTop: 0 }}
          key={'highest-temperature-time-in-minutes'}
        >
          <Space style={{ width: '270px' }}>{i18n.t('skyMenu.HighestTemperatureTimeInMinutes', lang) + ':'}</Space>
          <InputNumber
            min={720}
            max={sunMinutes.sunset}
            step={5}
            precision={0}
            value={highestTemperatureTimeInMinutes}
            onChange={(value) => {
              if (value) {
                const oldMinutes = highestTemperatureTimeInMinutes;
                const newMinutes = value;
                const undoableChange = {
                  name: 'Set Time of Highest Temperature in Minutes',
                  timestamp: Date.now(),
                  oldValue: oldMinutes,
                  newValue: newMinutes,
                  undo: () => {
                    setHighestTemperatureTimeInMinutes(undoableChange.oldValue as number);
                  },
                  redo: () => {
                    setHighestTemperatureTimeInMinutes(undoableChange.newValue as number);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                setHighestTemperatureTimeInMinutes(newMinutes);
              }
            }}
          />
        </Menu.Item>
      </Menu>
    </Menu.ItemGroup>
  );
};
