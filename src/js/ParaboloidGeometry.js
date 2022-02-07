/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import {BufferGeometry, Float32BufferAttribute, Vector3} from "three";

class ParaboloidGeometry extends BufferGeometry {

  constructor( radius = 1, widthSegments = 32, heightSegments = 16, thetaStart = 0, thetaLength = Math.PI ) {

    super();
    this.type = 'ParaboloidGeometry';

    this.parameters = {
      radius: radius,
      widthSegments: widthSegments,
      heightSegments: heightSegments,
      thetaStart: thetaStart,
      thetaLength: thetaLength
    };

    widthSegments = Math.max( 3, Math.floor( widthSegments ) );
    heightSegments = Math.max( 2, Math.floor( heightSegments ) );

    const thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

    let index = 0;
    const grid = [];

    const vertex = new Vector3();
    const normal = new Vector3();

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    // generate vertices, normals and uvs

    for ( let iy = 0; iy <= heightSegments; iy ++ ) {

      const verticesRow = [];

      const v = iy / heightSegments;

      // special case for the poles

      let uOffset = 0;

      if ( iy === 0 && thetaStart === 0 ) {

        uOffset = 0.5 / widthSegments;

      } else if ( iy === heightSegments && thetaEnd === Math.PI ) {

        uOffset = - 0.5 / widthSegments;

      }

      const TWO_PI = Math.PI*2;

      for ( let ix = 0; ix <= widthSegments; ix ++ ) {

        const u = ix / widthSegments;

        // vertex

        vertex.x = - radius * Math.cos( u * TWO_PI ) * Math.sin( thetaStart + v * thetaLength );
        vertex.y = radius * Math.cos( thetaStart + v * thetaLength );
        vertex.z = radius * Math.sin( u * TWO_PI ) * Math.sin( thetaStart + v * thetaLength );

        vertices.push( vertex.x, vertex.y, vertex.z );

        // normal

        normal.copy( vertex ).normalize();
        normals.push( normal.x, normal.y, normal.z );

        // uv

        uvs.push( u + uOffset, 1 - v );

        verticesRow.push( index ++ );

      }

      grid.push( verticesRow );

    }

    // indices

    for ( let iy = 0; iy < heightSegments; iy ++ ) {

      for ( let ix = 0; ix < widthSegments; ix ++ ) {

        const a = grid[ iy ][ ix + 1 ];
        const b = grid[ iy ][ ix ];
        const c = grid[ iy + 1 ][ ix ];
        const d = grid[ iy + 1 ][ ix + 1 ];

        if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
        if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );

      }

    }

    // build geometry

    this.setIndex( indices );
    this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
    this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

  }

  static fromJSON( data ) {

    return new ParaboloidGeometry( data.radius, data.widthSegments, data.heightSegments, data.thetaStart, data.thetaLength );

  }

}

export { ParaboloidGeometry };
