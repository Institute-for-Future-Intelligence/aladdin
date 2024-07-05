import React, { useEffect, useState } from 'react';
import { tempVector3_0 } from 'src/helpers';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { Group, Object3DEventMap } from 'three';

interface LabelProps {
  solarPanel: SolarPanelModel;
  boxRef: React.MutableRefObject<Group<Object3DEventMap>>;
}

const Label = React.memo(({ solarPanel, boxRef }: LabelProps) => {
  const {
    ly,
    tiltAngle,
    label,
    locked,
    labelColor = 'white',
    labelFontSize = 20,
    labelSize = 0.2,
    labelHeight,
  } = solarPanel;

  const hy = ly / 2;
  const lang = useLanguage();

  const [text, setText] = useState('');

  useEffect(() => {
    if (!boxRef.current) return;

    const { x, y, z } = boxRef.current.getWorldPosition(tempVector3_0);

    setText(
      (label ?? i18n.t('shared.SolarPanelElement', lang)) +
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

  const _labelHeight = labelHeight ?? Math.max(hy * Math.abs(Math.sin(tiltAngle)) + 0.1, 0.2);

  return (
    <textSprite
      userData={{ unintersectable: true }}
      name={'Label'}
      fontFace={'Roboto'}
      text={text}
      color={labelColor}
      fontSize={labelFontSize}
      textHeight={labelSize}
      position={[0, 0, _labelHeight]}
    />
  );
});

export default Label;
