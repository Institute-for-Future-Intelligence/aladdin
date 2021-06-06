/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {Plane} from "@react-three/drei";
import {useStore} from "../stores/common";
import {DoubleSide} from "three";

const Ground = () => {

    const set = useStore(state => state.set);
    const groundColor = useStore(state => state.groundColor);
    const planeRef = useRef();

    const selectNone = () => {
        set((state) => {
            const w = state.worlds['default'];
            if (w) {
                for (const e of w.elements) {
                    e.selected = false;
                }
            }
        });
    };

    return (
        <Plane receiveShadow
               ref={planeRef}
               name={'Ground'}
               onClick={(e) => {
                   if (e.intersections.length > 0) {
                       const groundClicked = e.intersections[0].object === planeRef.current;
                       if (groundClicked) {
                           selectNone();
                       }
                   }
               }}
               rotation={[-Math.PI / 2, 0, 0]}
               position={[0, 0, 1]}
               args={[10000, 10000]}>
            <meshStandardMaterial side={DoubleSide}
                                  attach="material"
                                  color={groundColor}/>
        </Plane>
    )
};

export default Ground;
