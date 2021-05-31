/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import produce, {enableMapSet} from 'immer';
import {World} from "../models/world";
import {Foundation} from "../models/foundation";
import {Vector3} from "three";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;
    worlds: { [key: string]: World };
    createNewWorld: () => void;
    getWorld: (name: string) => World;
}

export const useStore = create<CommonStoreState>(devtools(persist((
    set,
    get,
    api,
) => {
    const immerSet: CommonStoreState['set'] = fn => set(produce(fn));
    return {

        set: immerSet,

        worlds: {},

        getWorld(name: string) {
            return get().worlds[name];
        },

        createNewWorld() {
            immerSet((state: CommonStoreState) => {
                const foundations: { [key: string]: Foundation } = {};
                const foundation1 = {cx: 0, cy: 0, lx: 2, ly: 4, height: 0.1, id: 'f1'};
                const foundation2 = {cx: 1, cy: 2, lx: 2, ly: 2, height: 0.5, id: 'f2'};
                foundations[foundation1.id] = foundation1;
                foundations[foundation2.id] = foundation2;
                const world = {
                    name: 'default',
                    foundations: foundations,
                    cameraPosition: new Vector3(0, 0, 5)
                };
                state.worlds[world.name] = world;
            })
        }
    };
}, {name: 'aladdin-storage'})));

