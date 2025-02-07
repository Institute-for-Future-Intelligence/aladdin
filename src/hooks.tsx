/*
 * @Copyright 2021-2025. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import * as Selector from './stores/selector';
import React, { useMemo } from 'react';
import { InputNumber, Space, TreeDataNode } from 'antd';
import { ObjectType } from './types';
import { HumanModel } from './models/HumanModel';

export const useSelected = (id: string) => {
  return useStore((state) => state.selectedElementIdSet.has(id) && !state.groupActionMode);
};

export const useLanguage = () => {
  const language = useStore(Selector.language);
  return useMemo(() => {
    return { lng: language };
  }, [language]);
};

export const useWeather = (city: string | null) => {
  return useStore.getState().getWeather(city ?? 'Boston MA, USA');
  // useMemo may cache undefined
  // return useMemo(() => useStore.getState().getWeather(city ?? 'Boston MA, USA'), [city]);
};

export const useModelTree = () => {
  const elements = useStore(Selector.elements);
  const getChildren = useStore(Selector.getChildren);

  return useMemo(() => {
    const array: TreeDataNode[] = [];
    for (const e of elements) {
      if (e.type === ObjectType.Foundation) {
        const foundationChildren = getChildren(e.id);
        const children: TreeDataNode[] = [];
        for (const s of foundationChildren) {
          const properties: TreeDataNode[] = [];
          if (s.type === ObjectType.Human) {
            properties.push({
              checkable: false,
              title: <span>Name : {(s as HumanModel).name}</span>,
              key: s.id + ' Name',
            });
          }
          properties.push(
            ...[
              {
                checkable: false,
                title: (
                  <Space>
                    <span>x : </span>
                    <InputNumber value={s.cx} precision={2} />
                  </Space>
                ),
                key: s.id + ' x',
              },
              {
                checkable: false,
                title: (
                  <Space>
                    <span>y : </span>
                    <InputNumber value={s.cy} precision={2} />
                  </Space>
                ),
                key: s.id + ' y',
              },
              {
                checkable: false,
                title: (
                  <Space>
                    <span>z : </span>
                    <InputNumber value={s.cz} precision={2} />
                  </Space>
                ),
                key: s.id + ' z',
              },
            ],
          );
          children.push({
            title: <span style={{ color: 'black' }}>{s.type + (s.label ? ' (' + s.label + ')' : '')}</span>,
            key: s.id,
            children: properties,
          });
        }
        array.push({
          title: e.type + (e.label ? ' (' + e.label + ')' : ''),
          key: e.id,
          children,
        });
      }
    }
    return array;
  }, [elements]);
};
