/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Button, message, Space } from 'antd';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { DatumEntry } from './types';
import { Euler, Quaternion, Vector3 } from 'three';
import { useStore } from './stores/common';
import i18n from './i18n/i18n';
import { UNDO_SHOW_INFO_DURATION } from './constants';
import { usePrimitiveStore } from './stores/commonPrimitive';

export const visitIFI = () => {
  window.open('https://intofuture.org', '_blank');
};

export const visitHomepage = () => {
  window.open('https://intofuture.org/aladdin.html', '_blank');
};

export const getSatelliteImage = (size: number, lat: number, lng: number, zoom: number) => {
  return (
    'https://maps.googleapis.com/maps/api/staticmap?maptype=satellite&center=' +
    lat +
    ',' +
    lng +
    '&zoom=' +
    zoom +
    '&size=' +
    size +
    'x' +
    size +
    '&scale=2&key=' +
    import.meta.env.VITE_MAPS_API_KEY
  );
};

export const getRoadMap = (size: number, lat: number, lng: number, zoom: number) => {
  return (
    'https://maps.googleapis.com/maps/api/staticmap?maptype=roadmap&style=feature:poi|element:labels|visibility:off&center=' +
    lat +
    ',' +
    lng +
    '&zoom=' +
    zoom +
    '&size=' +
    size +
    'x' +
    size +
    '&scale=2&key=' +
    import.meta.env.VITE_MAPS_API_KEY
  );
};

export const showSuccess = (msg: string, duration?: number) => {
  message.success({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const showInfo = (msg: string, duration?: number) => {
  message.info({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const showWarning = (msg: string, duration?: number) => {
  message.warning({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const showError = (msg: string, duration?: number) => {
  message.error({
    duration: duration ?? 2,
    content: msg,
    className: 'custom-class',
    style: {
      marginTop: '20vh',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const showUndo = (msg: string, duration?: number) => {
  const lang = { lng: useStore.getState().language };
  // message.config({top: window.innerHeight - 60});
  message.info({
    duration: duration ?? 3,
    content: (
      <Space direction={'horizontal'}>
        <span>{msg}</span>
        <Button
          type={'primary'}
          title={i18n.t('menu.edit.Undo', lang)}
          onClick={() => {
            const commandName = useStore.getState().undoManager.undo();
            if (commandName) {
              setTimeout(() => {
                showInfo(i18n.t('menu.edit.Undone', lang), UNDO_SHOW_INFO_DURATION);
              }, 500);
            }
            if (useStore.getState().loggable) {
              useStore.getState().logAction('Undo');
            }
            message.destroy();
          }}
        >
          {i18n.t('menu.edit.Undo', lang)}
        </Button>
        <Button
          type={'primary'}
          title={i18n.t('message.DoNotShowAgain', lang)}
          onClick={() => {
            usePrimitiveStore.getState().set((state) => {
              state.muteUndoMessage = true;
            });
            message.destroy();
          }}
        >
          {i18n.t('word.Mute', lang)}
        </Button>
      </Space>
    ),
    style: {
      // other styles do not seem to work
      color: 'black',
    },
    onClick: () => {
      message.destroy();
    },
  });
};

export const openInNewTab = (url: string) => {
  const win = window.open(url, '_blank');
  if (win) {
    win.focus();
  }
};

export const extractText = (html: string) => {
  return new DOMParser().parseFromString(html, 'text/html').documentElement.textContent;
};

export const containedInDOMRect = (rect: DOMRect, x: number, y: number, margin: number) => {
  return (
    x > rect.x - margin && x < rect.x + rect.width + margin && y > rect.y - margin && y < rect.y + rect.height + margin
  );
};

export const saveImage = (fileName: string, imgUrl: string) => {
  const a = document.createElement('a') as HTMLAnchorElement;
  a.download = fileName;
  a.href = imgUrl;
  a.click();
};

export const screenshot = async (elementId: string, name: string, options?: object) => {
  const source = window.document.getElementById(elementId);
  if (source) {
    const canvas = await html2canvas(source, { ...options, removeContainer: true });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png', 1.0);
    a.download = `${name}.png`;
    a.click();
  } else {
    throw new Error(`Cannot find element with ID ${elementId}`);
  }
};

export const saveCsv = (data: DatumEntry[], fileName: string) => {
  let content = '';
  for (const k of Object.keys(data[0])) {
    content += k + ', ';
  }
  content += '\n';
  for (const o of data) {
    for (const v of Object.values(o)) {
      content += v + ', ';
    }
    content += '\n';
  }
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, fileName);
};

export const tempVector3_0 = new Vector3();
export const tempVector3_1 = new Vector3();
export const tempVector3_2 = new Vector3();
export const tempVector3_3 = new Vector3();
export const tempEuler = new Euler();
export const tempQuaternion_0 = new Quaternion();
