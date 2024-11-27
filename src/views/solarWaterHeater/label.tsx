import React, { useEffect, useState } from 'react';
import { tempVector3_0 } from 'src/helpers';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { SolarWaterHeaterModel } from 'src/models/SolarWaterHeaterModel';
import { Group } from 'three';

interface LabelProps {
  solarWaterHeater: SolarWaterHeaterModel;
  groupRef: React.MutableRefObject<Group>;
}

const Label = React.memo(({ solarWaterHeater, groupRef }: LabelProps) => {
  const {
    label,
    locked,
    labelColor = 'white',
    labelFontSize = 20,
    labelSize = 0.2,
    labelHeight = 2,
  } = solarWaterHeater;

  const lang = useLanguage();
  const [text, setText] = useState('');

  useEffect(() => {
    if (!groupRef.current) return;
    const { x, y, z } = groupRef.current.getWorldPosition(tempVector3_0);
    setText(
      (label ?? i18n.t('shared.SolarWaterHeaterElement', lang)) +
        (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
        (label
          ? ''
          : '\n' +
            i18n.t('word.Coordinates', lang) +
            ': (' +
            x.toFixed(1) +
            ', ' +
            y.toFixed(1) +
            ', ' +
            z.toFixed(1) +
            ') ' +
            i18n.t('word.MeterAbbreviation', lang)),
    );
  }, [label, locked, lang]);

  return (
    <textSprite
      userData={{ unintersectable: true }}
      name={'Label'}
      fontFace={'Roboto'}
      text={text}
      color={labelColor}
      fontSize={labelFontSize}
      textHeight={labelSize}
      position={[0, 0, labelHeight]}
    />
  );
});

export default Label;
