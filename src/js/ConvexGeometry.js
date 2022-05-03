/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import * as THREE from 'three';
import { Euler } from 'three';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';

class ConvexGeometry extends THREE.BufferGeometry {
  constructor(points, dirction, length) {
    super();

    const vertices = [];
    const normals = [];
    const uvs = [];
    const euler = new Euler(0, 0, dirction);

    const convexHull = new ConvexHull().setFromPoints(points);

    const faces = convexHull.faces;
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      let edge = face.edge;
      do {
        const point = edge.head().point;
        vertices.push(point.x, point.y, point.z);
        normals.push(face.normal.x, face.normal.y, face.normal.z);

        const p = point.clone().applyEuler(euler);

        const l2 = Math.sqrt(length * length + p.z * p.z);
        const y = p.y * l2 / length;
        uvs.push(p.x, y);

        edge = edge.next;
      } while (edge !== face.edge);
    }

    this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
}

export { ConvexGeometry };
