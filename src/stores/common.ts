/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import produce, {enableMapSet} from 'immer';
import {World} from "../models/world";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;
    worlds: { [key: string]: World };
    createNewWorld: (world: World) => void;
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
        createNewWorld(world: World) {
            immerSet((state: CommonStoreState) => {
                state.worlds[world.name] = world;
            })
        }
    };
}, {name: 'aladdin-storage'})));

