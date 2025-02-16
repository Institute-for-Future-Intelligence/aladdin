/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { GetRef, Tree, TreeDataNode } from 'antd';
import { usePrimitiveStore } from './stores/commonPrimitive';
import { useModelTree } from './hooks';

const ModelTree = React.memo(() => {
  const modelTreeExpandedKeys = usePrimitiveStore(Selector.modelTreeExpandedKeys);
  const selectElement = useStore(Selector.selectElement);

  const modelTreeRef = useRef<GetRef<typeof Tree>>(null);

  const modelTree: TreeDataNode[] = useModelTree();

  useEffect(() => {
    if (modelTreeRef.current && modelTreeExpandedKeys.length > 0) {
      modelTreeRef.current?.scrollTo({ key: modelTreeExpandedKeys[modelTreeExpandedKeys.length - 1] });
    }
  }, [modelTreeExpandedKeys]);

  return (
    <Tree
      ref={modelTreeRef}
      virtual={false}
      checkable={false}
      defaultExpandAll
      autoExpandParent
      showLine
      showIcon
      expandedKeys={modelTreeExpandedKeys}
      selectedKeys={modelTreeExpandedKeys}
      // checkedKeys={[]}
      onCheck={() => {}}
      onSelect={(keys) => {
        const key = (keys as string[])[0];
        // we use a space after the UID of an element for the keys of its properties
        if (key && !key.includes(' ')) selectElement(key);
      }}
      onExpand={(keys, node) => {
        if (node.expanded) {
          selectElement((keys as string[])[0], true);
        } else {
          selectElement('none');
        }
        usePrimitiveStore.getState().set((state) => {
          state.modelTreeExpandedKeys = [...keys] as string[];
        });
      }}
      treeData={modelTree}
      onContextMenu={(e) => {
        // do not invoke the context menu from the canvas if any
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
});

export default ModelTree;
