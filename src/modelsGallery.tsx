/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Affix, Drawer } from 'antd';
import { getIconUrl } from './components/modelsMap';
import { ModelSite } from './types';

export interface ModelsGalleryProps {
  author: string | undefined;
  models: Map<string, ModelSite>;
  openCloudFile: (model: ModelSite) => void;
  close: () => void;
}

const ModelsGallery = ({ author, models, openCloudFile, close }: ModelsGalleryProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);

  const [selectedModel, setSelectedModel] = useState<ModelSite | undefined>();

  const lang = { lng: language };

  return (
    <Drawer
      mask={false}
      headerStyle={{ height: '10px', background: 'whitesmoke' }}
      bodyStyle={{ padding: '0px 4px 0px 4px', overflowY: 'hidden' }}
      title={
        (author ?? 'My Models') +
        ': ' +
        models.size +
        ' ' +
        i18n.t((models.size ?? 0) > 1 ? 'word.Models' : 'word.Model', lang)
      }
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
                if (!models) return 0;
                const modelA = models.get(a);
                const modelB = models.get(b);
                if (!modelA || !modelB) return 0;
                return (modelB.timeCreated ?? 0) - (modelA.timeCreated ?? 0);
              })
              .map((key: string, index: number) => {
                if (models) {
                  const m = models.get(key);
                  if (!m) return null;
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
                            border: selectedModel === m ? '2px solid red' : 'none',
                          }}
                          onClick={() => {
                            setSelectedModel(m);
                            setCommonStore((state) => {
                              if (m) {
                                state.modelsMapLatitude = m.latitude;
                                state.modelsMapLongitude = m.longitude;
                                state.modelsMapZoom = 17;
                              }
                            });
                          }}
                        />
                        <Affix>
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
                        </Affix>
                      </div>
                    </td>
                  );
                }
                return null;
              })}
          </tr>
        </tbody>
      </table>
    </Drawer>
  );
};

export default React.memo(ModelsGallery);
