/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import {BufferGeometry, Float32BufferAttribute, Vector3} from "three";

class ParabolicCylinderGeometry extends BufferGeometry {

  constructor( semilatusRectum = 1, width = 2, height = 3, radialSegments = 8, heightSegments = 1) {

    super();
    this.type = 'ParabolicCylinderGeometry';

    this.parameters = {
      semilatusRectum: semilatusRectum,
      width: width,
      height: height,
      radialSegments: radialSegments,
      heightSegments: heightSegments,
    };

    const scope = this;

    radialSegments = Math.floor( radialSegments );
    heightSegments = Math.floor( heightSegments );

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // helper variables

    let index = 0;
    const indexArray = [];
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    let groupStart = 0;

    // generate geometry

    generateTorso();

    // build geometry

    this.setIndex( indices );
    this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
    this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

    function generateTorso() {

      const normal = new Vector3();
      const vertex = new Vector3();

      let groupCount = 0;
      const tmin = -halfWidth / semilatusRectum;
      const delta = width / (radialSegments * semilatusRectum);

      // generate vertices, normals and uvs

      for ( let y = 0; y <= heightSegments; y ++ ) {

        const indexRow = [];

        const v = y / heightSegments;

        // current row

        for ( let x = 0; x <= radialSegments; x ++ ) {

          const u = x * delta + tmin;

          // vertex

          vertex.x = semilatusRectum * u;
          vertex.y = - v * height + halfHeight;
          vertex.z = semilatusRectum * u*u/2;
          vertices.push( vertex.x, vertex.y, vertex.z );

          // normal

          normal.set( semilatusRectum*u, 0,semilatusRectum ).normalize();
          normals.push( normal.x, normal.y, normal.z );

          // uv

          uvs.push( u, 1 - v );

          // save index of vertex in respective row

          indexRow.push( index ++ );

        }

        // now save vertices of the row in our index array

        indexArray.push( indexRow );

      }

      // generate indices

      for ( let x = 0; x < radialSegments; x ++ ) {

        for ( let y = 0; y < heightSegments; y ++ ) {

          // we use the index array to access the correct indices

          const a = indexArray[ y ][ x ];
          const b = indexArray[ y + 1 ][ x ];
          const c = indexArray[ y + 1 ][ x + 1 ];
          const d = indexArray[ y ][ x + 1 ];

          // faces

          indices.push( a, b, d );
          indices.push( b, c, d );

          // update group counter

          groupCount += 6;

        }

      }

      // add a group to the geometry. this will ensure multi material support

      scope.addGroup( groupStart, groupCount, 0 );

      // calculate new start value for groups

      groupStart += groupCount;

    }

  }

  static fromJSON( data ) {
    return new ParabolicCylinderGeometry( data.radius, data.height, data.radialSegments, data.heightSegments );
  }

}


export { ParabolicCylinderGeometry, ParabolicCylinderGeometry as CylinderBufferGeometry };
