/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import AppleSpringImage from './resources/apple_spring.png';
import AppleSummerImage from './resources/apple_summer.png';
import AppleFallImage from './resources/apple_fall.png';
import AppleWinterImage from './resources/apple_winter.png';
import BirchSpringImage from './resources/birch_spring.png';
import BirchSummerImage from './resources/birch_summer.png';
import BirchFallImage from './resources/birch_fall.png';
import BirchWinterImage from './resources/birch_winter.png';
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
      case TreeType.Birch:
        return i18n.t('tree.Birch', lang);
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
      case TreeType.Birch:
        return 0.72 * Math.PI;
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
  static fetchTextureImage(name: string, dayOfYear: number, latitude: number, leafOutDay: number, leafOffDay: number) {
    let textureImg;
    const lastDayOfSpring = leafOutDay + 30;
    const lastDayOfSummer = leafOffDay - 30;
    const northernHemisphere = latitude > 0;
    switch (name) {
      case TreeType.Apple:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? AppleWinterImage : AppleSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? AppleSpringImage : AppleFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? AppleSummerImage : AppleWinterImage;
        } else {
          textureImg = northernHemisphere ? AppleFallImage : AppleSpringImage;
        }
        break;
      case TreeType.Birch:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? BirchWinterImage : BirchSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? BirchSpringImage : BirchFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? BirchSummerImage : BirchWinterImage;
        } else {
          textureImg = northernHemisphere ? BirchFallImage : BirchSpringImage;
        }
        break;
      case TreeType.Coconut:
        textureImg = CoconutImage;
        break;
      case TreeType.Dogwood:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? DogwoodWinterImage : DogwoodSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? DogwoodSpringImage : DogwoodFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? DogwoodSummerImage : DogwoodWinterImage;
        } else {
          textureImg = northernHemisphere ? DogwoodFallImage : DogwoodSpringImage;
        }
        break;
      case TreeType.Elm:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? ElmWinterImage : ElmSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? ElmSpringImage : ElmFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? ElmSummerImage : ElmWinterImage;
        } else {
          textureImg = northernHemisphere ? ElmFallImage : ElmSpringImage;
        }
        break;
      case TreeType.FanPalm:
        textureImg = FanPalmImage;
        break;
      case TreeType.Linden:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? LindenWinterImage : LindenSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? LindenSpringImage : LindenFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? LindenSummerImage : LindenWinterImage;
        } else {
          textureImg = northernHemisphere ? LindenFallImage : LindenSpringImage;
        }
        break;
      case TreeType.Magnolia:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? MagnoliaWinterImage : MagnoliaSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? MagnoliaSpringImage : MagnoliaFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? MagnoliaSummerImage : MagnoliaWinterImage;
        } else {
          textureImg = northernHemisphere ? MagnoliaFallImage : MagnoliaSpringImage;
        }
        break;
      case TreeType.Maple:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? MapleWinterImage : MapleSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? MapleSpringImage : MapleFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? MapleSummerImage : MapleWinterImage;
        } else {
          textureImg = northernHemisphere ? MapleFallImage : MapleSpringImage;
        }
        break;
      case TreeType.Oak:
        if (dayOfYear >= leafOffDay || dayOfYear <= leafOutDay) {
          textureImg = northernHemisphere ? OakWinterImage : OakSummerImage;
        } else if (dayOfYear > leafOutDay && dayOfYear <= lastDayOfSpring) {
          textureImg = northernHemisphere ? OakSpringImage : OakFallImage;
        } else if (dayOfYear > lastDayOfSpring && dayOfYear <= lastDayOfSummer) {
          textureImg = northernHemisphere ? OakSummerImage : OakWinterImage;
        } else {
          textureImg = northernHemisphere ? OakFallImage : OakSpringImage;
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
