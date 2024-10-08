/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useMemo } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Language } from './types';

export interface TeamProps {
  top: number;
  height?: number;
  color?: string;
}

const Team = React.memo(({ top, height, color }: TeamProps) => {
  const language = useStore(Selector.language);

  const lang = useMemo(() => {
    return { lng: language };
  }, [language]);

  const linePos = top + 56 + 'px';
  const top100 = top + 100 + 'px';
  const top200 = top + 205 + 'px';

  return (
    <div>
      <div
        style={{
          position: 'absolute',
          borderRadius: '20px',
          border: 'thin',
          textAlign: 'center',
          left: '15%',
          right: '15%',
          top: top + 'px',
          height: (height ?? 300) + 'px',
        }}
      >
        <h2 style={{ marginTop: '20px', color: color }}>{i18n.t('aboutUs.ProductBroughtToYouBy', lang)}</h2>
        <p style={{ paddingTop: '6px', fontSize: '12px', color: color }}>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://intofuture.org/aladdin-terms.html"
            style={{ color: color, textDecoration: 'none' }}
          >
            {i18n.t('aboutUs.TermsOfService', lang)}
          </a>
          &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://intofuture.org/aladdin-privacy.html"
            style={{ color: color, textDecoration: 'none' }}
          >
            {i18n.t('aboutUs.PrivacyPolicy', lang)}
          </a>
        </p>
      </div>
      <div>
        <hr
          style={{
            position: 'absolute',
            left: '10%',
            width: '80%',
            marginTop: linePos,
            color: color,
          }}
        />
        <table
          style={{
            position: 'absolute',
            border: 'none',
            top: top100,
            left: '10%',
            width: '80%',
            fontSize: 'small',
            color: color,
          }}
        >
          <tbody>
            <tr
              style={{
                verticalAlign: 'top',
              }}
            >
              <td>
                <h3 style={{ color: color }}>{i18n.t('aboutUs.Software', lang)}</h3>
                Xiaotong Ding
                <br />
                Charles Xie
                <br />
              </td>
              <td>
                <h3 style={{ color: color }}>{i18n.t('aboutUs.Content', lang)}</h3>
                Charles Xie
                <br />
              </td>
              <td>
                <h3 style={{ color: color }}>{i18n.t('aboutUs.Support', lang)}</h3>
                Charles Xie
                <br />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '10%',
          marginRight: '10%',
          top: top200,
          fontSize: '12px',
          textAlign: 'justify',
          color: color,
        }}
      >
        {i18n.t('aboutUs.Translators', lang)}: {Language.Ukrainian} (Andriy Kashyrskyy), {Language.Spanish} (Alex
        Barco), {Language.Turkish} (Hasan Bircan)
        <br />
        <br />
        {i18n.t('aboutUs.Acknowledgment', lang)}: {i18n.t('aboutUs.FundingInformation', lang)}{' '}
        {i18n.t('aboutUs.Contact', lang)}
      </div>
    </div>
  );
});

export default Team;
