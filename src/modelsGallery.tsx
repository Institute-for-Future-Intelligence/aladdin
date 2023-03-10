/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Drawer } from 'antd';
import { getIconUrl } from './components/modelsMap';
import { ModelSite } from './types';

export interface ModelsGalleryProps {
  author: string | undefined;
  models: Map<string, ModelSite> | undefined;
  close: () => void;
  openCloudFile?: (userid: string, title: string) => void;
}

const ModelsGallery = ({ author, models, close, openCloudFile }: ModelsGalleryProps) => {
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const modelsMapType = useStore(Selector.modelsMapType);

  const [selectedModel, setSelectedModel] = useState<ModelSite | undefined>();

  const lang = { lng: language };

  const countModels = useMemo(() => {
    if (!models) return 0;
    let count = 0;
    for (const v of models.values()) {
      if (!author && v.userid !== user.uid) continue;
      count++;
    }
    return count;
  }, [models, author]);

  const dark = author && modelsMapType !== 'roadmap';

  return !models || models.size === undefined || models.size === 0 ? (
    <Drawer
      mask={false}
      headerStyle={{ height: '10px', background: 'whitesmoke' }}
      bodyStyle={{ padding: '0px 4px 0px 4px', overflowY: 'hidden' }}
      style={{ scrollbarColor: dark ? '#6A6B6E' : 'whitesmoke' }}
      title={(author ?? i18n.t('modelsMap.MyPublishedModels', lang)) + ': 0'}
      placement="bottom"
      visible={true}
      height={'150px'}
      onClose={() => {
        close();
      }}
    />
  ) : (
    <Drawer
      mask={false}
      headerStyle={{
        height: '10px',
        color: dark ? 'white' : 'black',
        background: dark ? '#6A6B6E' : 'whitesmoke',
        border: 'none',
      }}
      bodyStyle={{ padding: '0px 4px 0px 4px', overflowY: 'hidden', background: dark ? '#2A2B2E' : 'white' }}
      title={(author ?? i18n.t('modelsMap.MyPublishedModels', lang)) + ' (' + countModels + ')'}
      placement="bottom"
      visible={true}
      height={'150px'}
      onClose={() => {
        setSelectedModel(undefined);
        close();
      }}
    >
      <table>
        <tbody>
          <tr>
            {[...models.keys()]
              .sort((a, b) => {
                const modelA = models.get(a);
                const modelB = models.get(b);
                if (!modelA || !modelB) return 0;
                return (modelB.timeCreated ?? 0) - (modelA.timeCreated ?? 0);
              })
              .map((key: string, index: number) => {
                const m = models.get(key);
                if (!m) return null;
                if (!author && m.userid !== user.uid) return null;
                return (
                  <td key={index}>
                    <div style={{ display: 'block', marginTop: '4px' }}>
                      <img
                        alt={m.label}
                        title={m.label}
                        src={m.thumbnailUrl}
                        style={{
                          cursor: 'pointer',
                          borderRadius: selectedModel === m ? '0' : '10px',
                          border: selectedModel === m ? '2px solid ' + (dark ? 'goldenrod' : 'red') : 'none',
                          marginRight: '4px',
                        }}
                        onClick={() => {
                          setSelectedModel(m);
                          if (openCloudFile) {
                            openCloudFile(m.userid, m.title);
                          } else {
                            setCommonStore((state) => {
                              if (m) {
                                state.modelsMapLatitude = m.latitude;
                                state.modelsMapLongitude = m.longitude;
                                state.modelsMapZoom = 17;
                              }
                            });
                          }
                        }}
                      />
                      <div>
                        <img
                          alt={m.type}
                          src={getIconUrl(m)}
                          style={{
                            position: 'relative',
                            left: '8px',
                            bottom: '28px',
                            width: '16px',
                            height: '16px',
                          }}
                        />
                        <span
                          style={{
                            position: 'relative',
                            left: '16px',
                            bottom: '24px',
                            color: 'white',
                            fontSize: '8px',
                            fontWeight: 'bold',
                          }}
                        >
                          {m.label ? (m.label.length > 30 ? m.label.substring(0, 30) + '...' : m.label) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </td>
                );
              })}
          </tr>
        </tbody>
      </table>
    </Drawer>
  );
};

export default React.memo(ModelsGallery);
