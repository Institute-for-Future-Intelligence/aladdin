import {Foundation} from "./foundation";

export interface World {

    name: string;
    foundations: { [key: string]: Foundation };

}
