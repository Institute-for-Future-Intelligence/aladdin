/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */
import React from 'react';
import * as Selector from '../../stores/selector';
import { useStore } from 'src/stores/common';
import { Box } from '@react-three/drei';

interface Props {
  onPointerOver: () => void;
  onPointerOut: () => void;
  children?: React.ReactNode;
}
const PanelBox = React.memo(({ children, onPointerOut, onPointerOver }: Props) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  return (
    <Box
      name="Box_Mesh"
      receiveShadow={shadowEnabled}
      castShadow={shadowEnabled}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {children}
    </Box>
  );
});

export default PanelBox;
