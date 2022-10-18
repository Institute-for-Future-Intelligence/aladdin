/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import AppleSpringImage from './resources/apple_spring.png';
import AppleSummerImage from './resources/apple_summer.png';
import AppleFallImage from './resources/apple_fall.png';
import AppleWinterImage from './resources/apple_winter.png';
import CoconutImage from './resources/coconut.png';
import DogwoodSpringImage from './resources/dogwood_spring.png';
import DogwoodSummerImage from './resources/dogwood_summer.png';
import DogwoodFallImage from './resources/dogwood_fall.png';
import DogwoodWinterImage from './resources/dogwood_winter.png';
import ElmSpringImage from './resources/elm_spring.png';
import ElmSummerImage from './resources/elm_summer.png';
import ElmFallImage from './resources/elm_fall.png';
import ElmWinterImage from './resources/elm_winter.png';
import FanPalmImage from './resources/fan_palm.png';
import LindenSpringImage from './resources/linden_spring.png';
import LindenSummerImage from './resources/linden_summer.png';
import LindenFallImage from './resources/linden_fall.png';
import LindenWinterImage from './resources/linden_winter.png';
import MagnoliaSpringImage from './resources/magnolia_spring.png';
import MagnoliaSummerImage from './resources/magnolia_summer.png';
import MagnoliaFallImage from './resources/magnolia_fall.png';
import MagnoliaWinterImage from './resources/magnolia_winter.png';
import MapleSpringImage from './resources/maple_spring.png';
import MapleSummerImage from './resources/maple_summer.png';
import MapleFallImage from './resources/maple_fall.png';
import MapleWinterImage from './resources/maple_winter.png';
import OakSpringImage from './resources/oak_spring.png';
import OakSummerImage from './resources/oak_summer.png';
import OakFallImage from './resources/oak_fall.png';
import OakWinterImage from './resources/oak_winter.png';
import PineImage from './resources/pine.png';
import SpruceImage from './resources/spruce.png';
import { TreeType } from './types';
import i18n from './i18n/i18n';

export class TreeData {
  static isEvergreen(type: TreeType): boolean {
    return type === TreeType.Spruce || type === TreeType.Pine || type === TreeType.FanPalm || type === TreeType.Coconut;
  }

  static isConic(type: TreeType): boolean {
    return type === TreeType.Spruce;
  }

  static fetchLabel(name: string, lang: {}): string {
    switch (name) {
      case TreeType.Apple:
        return i18n.t('tree.Apple', lang);
      case TreeType.Coconut:
        return i18n.t('tree.Coconut', lang);
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
      case TreeType.Apple:
        return 0.65 * Math.PI;
      case TreeType.Coconut:
        return 0.5 * Math.PI;
      case TreeType.Dogwood:
        return 0.65 * Math.PI;
      case TreeType.Elm:
        return 0.78 * Math.PI;
      case TreeType.FanPalm:
        return 0.52 * Math.PI;
      case TreeType.Linden:
        return 0.75 * Math.PI;
      case TreeType.Magnolia:
        return 0.68 * Math.PI;
      case TreeType.Maple:
        return 0.65 * Math.PI;
      case TreeType.Oak:
        return 0.75 * Math.PI;
      case TreeType.Spruce:
        return Math.PI;
      default:
        return Math.PI * 0.5;
    }
  }

  // month is from 1 to 12
  static fetchTextureImage(name: string, month: number, latitude: number) {
    let textureImg;
    switch (name) {
      case TreeType.Apple:
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            textureImg = AppleWinterImage;
          } else if (month > 3 && month <= 5) {
            textureImg = AppleSpringImage;
          } else if (month > 5 && month <= 9) {
            textureImg = AppleSummerImage;
          } else {
            textureImg = AppleFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            textureImg = AppleSummerImage;
          } else if (month > 3 && month <= 5) {
            textureImg = AppleFallImage;
          } else if (month > 5 && month <= 9) {
            textureImg = AppleWinterImage;
          } else {
            textureImg = AppleSpringImage;
          }
        }
        break;
      case TreeType.Coconut:
        textureImg = CoconutImage;
        break;
      case TreeType.Dogwood:
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            textureImg = DogwoodWinterImage;
          } else if (month > 3 && month <= 5) {
            textureImg = DogwoodSpringImage;
          } else if (month > 5 && month <= 9) {
            textureImg = DogwoodSummerImage;
          } else {
            textureImg = DogwoodFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            textureImg = DogwoodSummerImage;
          } else if (month > 3 && month <= 5) {
            textureImg = DogwoodFallImage;
          } else if (month > 5 && month <= 9) {
            textureImg = DogwoodWinterImage;
          } else {
            textureImg = DogwoodSpringImage;
          }
        }
        break;
      case TreeType.Elm:
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            textureImg = ElmWinterImage;
          } else if (month > 3 && month <= 5) {
            textureImg = ElmSpringImage;
          } else if (month > 5 && month <= 9) {
            textureImg = ElmSummerImage;
          } else {
            textureImg = ElmFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            textureImg = ElmSummerImage;
          } else if (month > 3 && month <= 5) {
            textureImg = ElmFallImage;
          } else if (month > 5 && month <= 9) {
            textureImg = ElmWinterImage;
          } else {
            textureImg = ElmSpringImage;
          }
        }
        break;
      case TreeType.FanPalm:
        textureImg = FanPalmImage;
        break;
      case TreeType.Linden:
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            textureImg = LindenWinterImage;
          } else if (month > 3 && month <= 5) {
            textureImg = LindenSpringImage;
          } else if (month > 5 && month <= 9) {
            textureImg = LindenSummerImage;
          } else {
            textureImg = LindenFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            textureImg = LindenSummerImage;
          } else if (month > 3 && month <= 5) {
            textureImg = LindenFallImage;
          } else if (month > 5 && month <= 9) {
            textureImg = LindenWinterImage;
          } else {
            textureImg = LindenSpringImage;
          }
        }
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
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            textureImg = MapleWinterImage;
          } else if (month > 3 && month <= 5) {
            textureImg = MapleSpringImage;
          } else if (month > 5 && month <= 9) {
            textureImg = MapleSummerImage;
          } else {
            textureImg = MapleFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            textureImg = MapleSummerImage;
          } else if (month > 3 && month <= 5) {
            textureImg = MapleFallImage;
          } else if (month > 5 && month <= 9) {
            textureImg = MapleWinterImage;
          } else {
            textureImg = MapleSpringImage;
          }
        }
        break;
      case TreeType.Oak:
        if (latitude > 0) {
          if (month >= 12 || month <= 3) {
            textureImg = OakWinterImage;
          } else if (month > 3 && month <= 5) {
            textureImg = OakSpringImage;
          } else if (month > 5 && month <= 9) {
            textureImg = OakSummerImage;
          } else {
            textureImg = OakFallImage;
          }
        } else {
          if (month >= 12 || month <= 3) {
            textureImg = OakSummerImage;
          } else if (month > 3 && month <= 5) {
            textureImg = OakFallImage;
          } else if (month > 5 && month <= 9) {
            textureImg = OakWinterImage;
          } else {
            textureImg = OakSpringImage;
          }
        }
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
