import { useStore } from '../stores/common';
import { useLanguage } from '../hooks';
import { MONTHS } from '../constants';
import { UndoableChange } from '../undo/UndoableChange';
import { InputNumber } from 'antd';
import i18n from '../i18n/i18n';

export const ElectricityConsumptionInput = ({ monthIndex }: { monthIndex: number }) => {
  const monthlyData =
    useStore((state) => {
      if (!state.world.monthlyElectricityConsumptions) {
        return 600;
      }
      return state.world.monthlyElectricityConsumptions[monthIndex];
    }) ?? 600;

  const lang = useLanguage();

  const setMonthlyData = (value: number) => {
    useStore.getState().set((state) => {
      if (!state.world.monthlyElectricityConsumptions) {
        state.world.monthlyElectricityConsumptions = new Array(12).fill(600);
      }
      state.world.monthlyElectricityConsumptions[monthIndex] = value;
    });
  };

  const onChange = (value: number | null) => {
    if (value === null) return;
    const oldValue = monthlyData;
    const newValue = value;
    const undoableChange = {
      name: 'Set Electricity Consumption in ' + MONTHS[monthIndex],
      timestamp: Date.now(),
      oldValue: oldValue,
      newValue: newValue,
      undo: () => {
        setMonthlyData(undoableChange.oldValue as number);
      },
      redo: () => {
        setMonthlyData(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);
    setMonthlyData(newValue);
  };

  return (
    <InputNumber
      addonBefore={<span style={{ fontFamily: 'monospace' }}>{i18n.t(`month.${MONTHS[monthIndex]}`, lang)}</span>}
      style={{ width: '120px', paddingRight: monthIndex % 2 === 0 ? '6px' : 0 }}
      min={0}
      step={1}
      precision={0}
      value={monthlyData}
      onChange={onChange}
    />
  );
};
