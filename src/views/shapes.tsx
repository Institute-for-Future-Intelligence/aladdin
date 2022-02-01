/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import * as React from 'react';
import { Mesh } from 'three';
import { ParabolicCylinderGeometry } from '../js/ParabolicCylinderGeometry';

export type Args<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T;
export type ShapeProps<T> = Omit<JSX.IntrinsicElements['mesh'], 'args'> & {
  args?: Args<T>;
  children?: React.ReactNode;
};

function create<T>(type: string) {
  const El: any = type + 'Geometry';
  return React.forwardRef(({ args, children, ...props }: ShapeProps<T>, ref) => (
    <mesh ref={ref as React.MutableRefObject<Mesh>} {...props}>
      <El attach="geometry" args={args} />
      {children}
    </mesh>
  ));
}

export const ParabolicCylinder = create<typeof ParabolicCylinderGeometry>('ParabolicCylinder');
