/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import { MenuItem } from '../../menuItems';
import { Checkbox, InputNumber, Radio, Space } from 'antd';
import * as Selector from '../../../../stores/selector';
import i18n from 'src/i18n/i18n';
import { useLanguage } from 'src/hooks';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import type { RadioChangeEvent } from 'antd';
import { UndoableChange } from 'src/undo/UndoableChange';
import { computeSunriseAndSunsetInMinutes } from 'src/analysis/sunTools';
import { useMemo } from 'react';
import { themes } from '../../../../constants';

export const AxesCheckbox = ({ forModelTree }: { forModelTree?: boolean }) => {
  const axes = useStore(Selector.viewState.axes);
  const lang = useLanguage();

  const setAxes = (checked: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.axes = checked;
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
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
    useStore.getState().addUndoable(undoableCheck);
    setAxes(checked);
  };

  return forModelTree ? (
    <Space>
      <span> {i18n.t('skyMenu.Axes', lang)} :</span>
      <Checkbox style={{ width: '100%' }} checked={axes} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={axes} onChange={onChange}>
        {i18n.t('skyMenu.Axes', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const ThemeRadioGroup = () => {
  const theme = useStore(Selector.viewState.theme);
  const lang = useLanguage();

  const setTheme = (theme: string) => {
    useStore.getState().set((state) => {
      state.viewState.theme = theme;
    });
  };

  const onChange = (e: RadioChangeEvent) => {
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
    useStore.getState().addUndoable(undoableChange);
    setTheme(newTheme);
  };

  return (
    <MenuItem stayAfterClick noPadding>
      <Radio.Group value={theme} onChange={onChange}>
        <Space direction="vertical">
          {themes.map((radio, idx) => (
            <Radio style={{ width: '100%' }} key={`${idx}-${radio.value}`} value={radio.value}>
              {i18n.t(radio.label, lang)}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </MenuItem>
  );
};

export const ShowAzimuthAngleCheckbox = ({ forModelTree }: { forModelTree?: boolean }) => {
  const showAzimuthAngle = useStore(Selector.viewState.showAzimuthAngle) ?? true;
  const lang = useLanguage();

  const setShowAzimuthAngle = (value: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.showAzimuthAngle = value;
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
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
    useStore.getState().addUndoable(undoableChange);
    setShowAzimuthAngle(newValue);
  };

  return forModelTree ? (
    <Space>
      <span> {i18n.t('skyMenu.ShowAzimuthAngle', lang)} :</span>
      <Checkbox style={{ width: '100%' }} checked={showAzimuthAngle} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={showAzimuthAngle} onChange={onChange}>
        {i18n.t('skyMenu.ShowAzimuthAngle', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const ShowElevationAngleCheckbox = ({ forModelTree }: { forModelTree?: boolean }) => {
  const showElevationAngle = useStore(Selector.viewState.showElevationAngle) ?? true;
  const lang = useLanguage();

  const setShowElevationAngle = (value: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.showElevationAngle = value;
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
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
    useStore.getState().addUndoable(undoableChange);
    setShowElevationAngle(newValue);
  };

  return forModelTree ? (
    <Space>
      <span> {i18n.t('skyMenu.ShowElevationAngle', lang)} :</span>
      <Checkbox style={{ width: '100%' }} checked={showElevationAngle} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={showElevationAngle} onChange={onChange}>
        {i18n.t('skyMenu.ShowElevationAngle', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const ShowZenithAngleCheckbox = ({ forModelTree }: { forModelTree?: boolean }) => {
  const showZenithAngle = useStore(Selector.viewState.showZenithAngle) ?? true;
  const lang = useLanguage();

  const setShowZenithAngle = (value: boolean) => {
    useStore.getState().set((state) => {
      state.viewState.showZenithAngle = value;
    });
  };

  const onChange = (e: CheckboxChangeEvent) => {
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
    useStore.getState().addUndoable(undoableChange);
    setShowZenithAngle(newValue);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('skyMenu.ShowZenithAngle', lang)} :</span>
      <Checkbox style={{ width: '100%' }} checked={showZenithAngle} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick noPadding>
      <Checkbox style={{ width: '100%' }} checked={showZenithAngle} onChange={onChange}>
        {i18n.t('skyMenu.ShowZenithAngle', lang)}
      </Checkbox>
    </MenuItem>
  );
};

export const DirectLightIntensityInput = ({ forModelTree }: { forModelTree?: boolean }) => {
  const directLightIntensity = useStore(Selector.viewState.directLightIntensity) ?? 3.5;
  const lang = useLanguage();

  const setDirectLightIntensity = (value: number) => {
    useStore.getState().set((state) => {
      state.viewState.directLightIntensity = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;

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
    useStore.getState().addUndoable(undoableChange);
    setDirectLightIntensity(newValue);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('skyMenu.DirectLightBrightnessAtNoon', lang) + ' :'}</span>
      <InputNumber min={0.1} max={10} step={0.1} precision={2} value={directLightIntensity} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick>
      <Space style={{ width: '270px' }}>{i18n.t('skyMenu.DirectLightBrightnessAtNoon', lang) + ' [0.1-10]:'}</Space>
      <InputNumber min={0.1} max={10} step={0.1} precision={2} value={directLightIntensity} onChange={onChange} />
    </MenuItem>
  );
};

export const AmbientLightIntensityInput = ({ forModelTree }: { forModelTree?: boolean }) => {
  const ambientLightIntensity = useStore(Selector.viewState.ambientLightIntensity) ?? 0.2;
  const lang = useLanguage();

  const setAmbientLightIntensity = (value: number) => {
    useStore.getState().set((state) => {
      state.viewState.ambientLightIntensity = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;

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
    useStore.getState().addUndoable(undoableChange);
    setAmbientLightIntensity(newValue);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('skyMenu.AmbientLightBrightnessAtNoon', lang) + ' :'}</span>
      <InputNumber min={0.01} max={1} step={0.01} precision={2} value={ambientLightIntensity} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick>
      <Space style={{ width: '270px' }}>{i18n.t('skyMenu.AmbientLightBrightnessAtNoon', lang) + ' [0.01-1]:'}</Space>
      <InputNumber min={0.01} max={1} step={0.01} precision={2} value={ambientLightIntensity} onChange={onChange} />
    </MenuItem>
  );
};

export const AirAttenuationCoefficientInput = ({ forModelTree }: { forModelTree?: boolean }) => {
  const airAttenuationCoefficient = useStore(Selector.world.airAttenuationCoefficient) ?? 0.01;
  const lang = useLanguage();

  const setAirAttenuationCoefficient = (value: number) => {
    useStore.getState().set((state) => {
      state.world.airAttenuationCoefficient = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;

    const oldValue = airAttenuationCoefficient;
    const newValue = value;
    const undoableChange = {
      name: 'Set Sunlight Attenuation Coefficient of Air',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        setAirAttenuationCoefficient(undoableChange.oldValue as number);
      },
      redo: () => {
        setAirAttenuationCoefficient(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setAirAttenuationCoefficient(newValue);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('skyMenu.SunlightAttenuationCoefficientInAir', lang) + ' :'}</span>
      <InputNumber min={0} max={0.1} step={0.001} precision={3} value={airAttenuationCoefficient} onChange={onChange} />
    </Space>
  ) : (
    <MenuItem stayAfterClick>
      <Space style={{ width: '270px' }}>{i18n.t('skyMenu.SunlightAttenuationCoefficientInAir', lang) + ':'}</Space>
      <InputNumber min={0} max={0.1} step={0.001} precision={3} value={airAttenuationCoefficient} onChange={onChange} />
    </MenuItem>
  );
};

export const AirConvectiveCoefficientInput = ({ forModelTree }: { forModelTree?: boolean }) => {
  const airConvectiveCoefficient = useStore(Selector.world.airConvectiveCoefficient) ?? 5;
  const lang = useLanguage();

  const setAirConvectiveCoefficient = (value: number) => {
    useStore.getState().set((state) => {
      state.world.airConvectiveCoefficient = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;

    const oldValue = airConvectiveCoefficient;
    const newValue = value;
    const undoableChange = {
      name: 'Set Convective Coefficient of Air',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        setAirConvectiveCoefficient(undoableChange.oldValue as number);
      },
      redo: () => {
        setAirConvectiveCoefficient(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setAirConvectiveCoefficient(newValue);
  };

  return forModelTree ? (
    <Space>
      <span>{i18n.t('skyMenu.ConvectiveCoefficientOfAir', lang)} :</span>
      <InputNumber min={2.5} max={20} step={0.1} precision={2} value={airConvectiveCoefficient} onChange={onChange} />
      <span>W/(m²×K)</span>
    </Space>
  ) : (
    <MenuItem stayAfterClick>
      <Space style={{ width: '270px' }}>{i18n.t('skyMenu.ConvectiveCoefficientOfAir', lang) + ' [W/(m²×K)]:'}</Space>
      <InputNumber min={2.5} max={20} step={0.1} precision={2} value={airConvectiveCoefficient} onChange={onChange} />
    </MenuItem>
  );
};

export const HighestTemperatureTimeInput = () => {
  const highestTemperatureTimeInMinutes = useStore(Selector.world.highestTemperatureTimeInMinutes) ?? 900;
  const world = useStore.getState().world;
  const lang = useLanguage();

  const sunMinutes = useMemo(
    () => computeSunriseAndSunsetInMinutes(new Date(world.date), world.latitude),
    [world.date, world.latitude],
  );

  const setHighestTemperatureTimeInMinutes = (value: number) => {
    useStore.getState().set((state) => {
      state.world.highestTemperatureTimeInMinutes = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;

    const oldValue = highestTemperatureTimeInMinutes;
    const newValue = value;
    const undoableChange = {
      name: 'Set Time of Highest Temperature in Minutes',
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        setHighestTemperatureTimeInMinutes(undoableChange.oldValue as number);
      },
      redo: () => {
        setHighestTemperatureTimeInMinutes(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setHighestTemperatureTimeInMinutes(newValue);
  };

  return (
    <MenuItem stayAfterClick>
      <Space style={{ width: '270px' }}>{i18n.t('skyMenu.HighestTemperatureTimeInMinutes', lang) + ':'}</Space>
      <InputNumber
        min={720}
        max={sunMinutes.sunset}
        step={5}
        precision={0}
        value={highestTemperatureTimeInMinutes}
        onChange={onChange}
      />
    </MenuItem>
  );
};
