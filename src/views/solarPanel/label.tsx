import React, { useMemo } from 'react';
import { useLanguage } from 'src/hooks';
import i18n from 'src/i18n/i18n';
import { SolarPanelModel } from 'src/models/SolarPanelModel';

interface LabelProps {
  solarPanel: SolarPanelModel;
}

const Label = React.memo(({ solarPanel }: LabelProps) => {
  const {
    cx,
    cy,
    cz,
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

  const labelText = useMemo(
    () =>
      (label ?? i18n.t('shared.SolarPanelElement', lang)) +
      (locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '') +
      (label
        ? ''
        : '\n' +
          i18n.t('word.Coordinates', lang) +
          ': (' +
          cx.toFixed(1) +
          ', ' +
          cy.toFixed(1) +
          ', ' +
          cz.toFixed(1) +
          ') ' +
          i18n.t('word.MeterAbbreviation', lang)),
    [label, locked, lang, cx, cy, cz],
  );

  const _labelHeight = labelHeight ?? Math.max(hy * Math.abs(Math.sin(tiltAngle)) + 0.1, 0.2);

  return (
    <textSprite
      userData={{ unintersectable: true }}
      name={'Label'}
      fontFace={'Roboto'}
      text={labelText}
      color={labelColor}
      fontSize={labelFontSize}
      textHeight={labelSize}
      position={[0, 0, _labelHeight]}
    />
  );
});

export default Label;
