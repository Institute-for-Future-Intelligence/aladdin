/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import CottonwoodImage from './resources/cottonwood.png';
import CottonwoodShedImage from './resources/cottonwood_shed.png';
import DogwoodImage from './resources/dogwood.png';
import DogwoodShedImage from './resources/dogwood_shed.png';
import ElmImage from './resources/elm.png';
import ElmShedImage from './resources/elm_shed.png';
import FanPalmImage from './resources/fan_palm.png';
import LindenImage from './resources/linden.png';
import LindenShedImage from './resources/linden_shed.png';
import MagnoliaSpringImage from './resources/magnolia_spring.png';
import MagnoliaSummerImage from './resources/magnolia_summer.png';
import MagnoliaFallImage from './resources/magnolia_fall.png';
import MagnoliaWinterImage from './resources/magnolia_winter.png';
import MapleImage from './resources/maple.png';
import MapleShedImage from './resources/maple_shed.png';
import OakImage from './resources/oak.png';
import OakShedImage from './resources/oak_shed.png';
import PineImage from './resources/pine.png';
import SpruceImage from './resources/spruce.png';
import { TreeType } from './types';
import i18n from './i18n/i18n';

export class TreeData {
  static isDeciduous(type: TreeType): boolean {
    return type !== TreeType.Pine && type !== TreeType.Spruce;
  }

  static fetchLabel(name: string, lang: {}): string {
    switch (name) {
      case TreeType.Cottonwood:
        return i18n.t('tree.Cottonwood', lang);
      case TreeType.Dogwood:
        return i18n.t('tree.Dogwood', lang);
      case TreeType.Elm:
        return i18n.t('tree.Elm', lang);
      case TreeType.FanPalm:
        return i18n.t('tree.FanPalm', lang);
      case TreeType.Linden:
        return i18n.t('tree.Linden', lang);
      case TreeType.Magnolia:
        return i18n.t('tree.Magnolia', lang);
      case TreeType.Maple:
        return i18n.t('tree.Maple', lang);
      case TreeType.Oak:
        return i18n.t('tree.Oak', lang);
      case TreeType.Spruce:
        return i18n.t('tree.Spruce', lang);
      default:
        return i18n.t('tree.Pine', lang);
    }
  }

  static fetchTheta(name: string): number {
    switch (name) {
      case TreeType.Elm:
        return 0.78 * Math.PI;
      case TreeType.Dogwood:
        return 0.6 * Math.PI;
      case TreeType.Magnolia:
        return 0.68 * Math.PI;
      case TreeType.Maple:
        return 0.65 * Math.PI;
      case TreeType.Oak:
        return 0.75 * Math.PI;
      case TreeType.FanPalm:
        return 0.5 * Math.PI;
      case TreeType.Spruce:
        return Math.PI;
      default:
        return Math.PI * 0.7;
    }
  }

  // month is from 1 to 12
  static fetchTextureImage(name: string, month: number, latitude: number) {
    let textureImg;
    switch (name) {
      case TreeType.Cottonwood:
        textureImg = (latitude > 0 ? month < 4 || month > 10 : month >= 4 && month <= 10)
          ? CottonwoodShedImage
          : CottonwoodImage;
        break;
      case TreeType.Dogwood:
        textureImg = (latitude > 0 ? month < 4 || month > 10 : month >= 4 && month <= 10)
          ? DogwoodShedImage
          : DogwoodImage;
        break;
      case TreeType.Elm:
        textureImg = (latitude > 0 ? month < 4 || month > 10 : month >= 4 && month <= 10) ? ElmShedImage : ElmImage;
        break;
      case TreeType.Linden:
        textureImg = (latitude > 0 ? month < 4 || month > 10 : month >= 4 && month <= 10)
          ? LindenShedImage
          : LindenImage;
        break;
      case TreeType.Magnolia:
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            textureImg = MagnoliaWinterImage;
          } else if (month > 3 && month <= 5) {
            textureImg = MagnoliaSpringImage;
          } else if (month > 5 && month <= 9) {
            textureImg = MagnoliaSummerImage;
          } else {
            // November
            textureImg = MagnoliaFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            textureImg = MagnoliaSummerImage;
          } else if (month > 3 && month <= 5) {
            textureImg = MagnoliaFallImage;
          } else if (month > 5 && month <= 9) {
            textureImg = MagnoliaWinterImage;
          } else {
            textureImg = MagnoliaSpringImage;
          }
        }
        break;
      case TreeType.Maple:
        textureImg = (latitude > 0 ? month < 4 || month > 10 : month >= 4 && month <= 10) ? MapleShedImage : MapleImage;
        break;
      case TreeType.Oak:
        textureImg = (latitude > 0 ? month < 4 || month > 10 : month >= 4 && month <= 10) ? OakShedImage : OakImage;
        break;
      case TreeType.FanPalm:
        textureImg = FanPalmImage;
        break;
      case TreeType.Spruce:
        textureImg = SpruceImage;
        break;
      default:
        textureImg = PineImage;
    }
    return textureImg;
  }
}
