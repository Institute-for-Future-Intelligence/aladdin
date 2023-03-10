/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import i18n from './i18n/i18n';
import { Drawer, Empty, Input, Space } from 'antd';
import { ModelSite } from './types';
import { LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons';
import { getIconUrl } from './components/modelsMap';

export interface ModelsGalleryProps {
  author: string | undefined; // if undefined, the user is the owner of models
  models: Map<string, ModelSite> | undefined;
  closeCallback: () => void;
  openCloudFile?: (userid: string, title: string) => void;
}

const ModelsGallery = ({ author, models, closeCallback, openCloudFile }: ModelsGalleryProps) => {
  const user = useStore(Selector.user);
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const modelsMapType = useStore(Selector.modelsMapType);

  // make an editable copy because models is not mutable
  const modelsRef = useRef<Map<string, ModelSite>>(models ? new Map(models) : new Map());
  // set a flag so that we can update when modelsRef changes
  const [recountFlag, setRecountFlag] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelSite | undefined>();
  const [ascendingOrder, setAscendingOrder] = useState<boolean>(false);

  const { Search } = Input;
  const lang = { lng: language };

  useEffect(() => {
    if (models) {
      modelsRef.current = new Map(models);
      setRecountFlag(!recountFlag);
    }
  }, [models]);

  const countModels = useMemo(() => {
    let count = 0;
    for (const v of modelsRef.current.values()) {
      // when author is defined, all the models belong to him/her
      // when user is undefined, we only count those that belong to the current user
      if (author || v.userid === user.uid) count++;
    }
    return count;
  }, [modelsRef.current, author, user.uid, recountFlag]);

  // use a dark theme when the map is in the satellite mode to match the color
  const dark = author && modelsMapType !== 'roadmap';

  return modelsRef.current.size === 0 ? (
    <Drawer
      extra={
        <Search
          title={'Search by label'}
          allowClear
          size={'small'}
          enterButton
          onSearch={(s) => {
            if (!models) return;
            modelsRef.current.clear();
            for (const [k, v] of models) {
              if (v.label?.toLowerCase().includes(s.toLowerCase())) {
                modelsRef.current.set(k, v);
              }
            }
            setRecountFlag(!recountFlag);
          }}
        />
      }
      mask={false}
      headerStyle={{
        height: '40px',
        paddingLeft: '1px',
        paddingRight: '1px',
        paddingTop: '16px',
        paddingBottom: '12px',
        background: dark ? '#6A6B6E' : 'whitesmoke',
      }}
      bodyStyle={{ padding: '0px 4px 0px 4px', overflowY: 'hidden', background: dark ? '#2A2B2E' : 'white' }}
      style={{ scrollbarColor: dark ? '#6A6B6E' : 'whitesmoke' }}
      title={(author ?? i18n.t('modelsMap.MyPublishedModels', lang)) + ' (0)'}
      placement="bottom"
      visible={true}
      height={'150px'}
      onClose={() => {
        closeCallback();
      }}
    >
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ color: dark ? 'lightgray' : 'dimgray' }} />
    </Drawer>
  ) : (
    <Drawer
      extra={
        <Space>
          {ascendingOrder ? (
            <LeftCircleOutlined
              title={i18n.t('modelsMap.FromNewestToOldest', { lng: language })}
              style={{ cursor: 'pointer', marginLeft: '2px', marginRight: '6px' }}
              onClick={() => {
                setAscendingOrder(false);
              }}
            />
          ) : (
            <RightCircleOutlined
              title={i18n.t('modelsMap.FromOldestToNewest', { lng: language })}
              style={{ cursor: 'pointer', marginLeft: '2px', marginRight: '6px' }}
              onClick={() => {
                setAscendingOrder(true);
              }}
            />
          )}
          <Search
            allowClear
            size={'small'}
            enterButton
            onSearch={(s) => {
              if (!models) return;
              modelsRef.current.clear();
              for (const [k, v] of models) {
                if (v.label?.toLowerCase().includes(s.toLowerCase())) {
                  modelsRef.current.set(k, v);
                }
              }
              setRecountFlag(!recountFlag);
            }}
          />
        </Space>
      }
      mask={false}
      headerStyle={{
        height: '40px',
        color: dark ? 'white' : 'black', // doesn't work
        background: dark ? '#6A6B6E' : 'whitesmoke',
        paddingLeft: '1px',
        paddingRight: '1px',
        paddingTop: '16px',
        paddingBottom: '12px',
        border: 'none',
      }}
      bodyStyle={{ padding: '0px 4px 0px 4px', overflowY: 'hidden', background: dark ? '#2A2B2E' : 'white' }}
      title={(author ?? i18n.t('modelsMap.MyPublishedModels', lang)) + ' (' + countModels + ')'}
      placement="bottom"
      visible={true}
      height={'150px'}
      onClose={() => {
        setSelectedModel(undefined);
        closeCallback();
      }}
    >
      <table>
        <tbody>
          <tr>
            {[...modelsRef.current.keys()]
              .sort((a, b) => {
                const modelA = modelsRef.current.get(a);
                const modelB = modelsRef.current.get(b);
                if (!modelA || !modelB) return 0;
                return (ascendingOrder ? -1 : 1) * ((modelB.timeCreated ?? 0) - (modelA.timeCreated ?? 0));
              })
              .map((key: string, index: number) => {
                const m = modelsRef.current.get(key);
                if (!m) return null;
                // only show the models that belong to the current user when author is undefined
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
                            // provided when displaying current user's models
                            openCloudFile(m.userid, m.title);
                          } else {
                            // go to the location on the map when the map is open
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
                      {/* the following div is needed to wrap the image and text */}
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
