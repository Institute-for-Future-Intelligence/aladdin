/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import {BufferGeometry, Float32BufferAttribute, Vector3} from "three";

class ParabolicCylinderGeometry extends BufferGeometry {

  constructor( semiLatusRectum = 1, width = 2, length = 3, widthSegments = 8, lengthSegments = 1) {

    super();
    this.type = 'ParabolicCylinderGeometry';

    this.parameters = {
      semilatusRectum: semiLatusRectum,
      width: width,
      height: length,
      widthSegments: widthSegments,
      lengthSegments: lengthSegments,
    };

    const scope = this;
    widthSegments = Math.floor( widthSegments );
    lengthSegments = Math.floor( lengthSegments );

    // buffers
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // helper variables
    let index = 0;
    const indexArray = [];
    const halfHeight = length / 2;
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
      const u0 = -0.5;
      const du = 1 / widthSegments;

      // generate vertices, normals and uvs
      for ( let y = 0; y <= lengthSegments; y ++ ) {
        const indexRow = [];
        const v = y / lengthSegments;
        // current row
        for ( let x = 0; x <= widthSegments; x ++ ) {
          const u = u0 + x*du;
          const a = u*width;
          // vertex
          vertex.x = semiLatusRectum * a;
          vertex.y = - v * length + halfHeight;
          vertex.z = semiLatusRectum * a * a / 2;
          vertices.push( vertex.x, vertex.y, vertex.z );

          // normal vector: (-dy/du, dx/du), tangential vector: (dx/du, dy/du)
          normal.set( -semiLatusRectum*a, 0, semiLatusRectum ).normalize();
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
      for ( let x = 0; x < widthSegments; x ++ ) {
        for ( let y = 0; y < lengthSegments; y ++ ) {
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
    return new ParabolicCylinderGeometry( data.semiLatusRectum, data.width, data.height, data.widthSegments, data.lengthSegments );
  }

}

export { ParabolicCylinderGeometry, ParabolicCylinderGeometry as CylinderBufferGeometry };
