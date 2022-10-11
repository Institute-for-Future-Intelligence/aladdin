/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import NoLeafFlowerImage from './resources/no_leaf_flower.png';
import NoLeafShrubImage from './resources/no_leaf_shrub.png';
import BellflowerImage from './resources/bellflower.png';
import BoxwoodImage from './resources/boxwood.png';
import HibiscusImage from './resources/hibiscus.png';
import HydrangeaImage from './resources/hydrangea.png';
import HostaImage from './resources/hosta.png';
import PeonyImage from './resources/peony.png';
import RedRoseImage from './resources/red_rose.png';
import SunflowerImage from './resources/sunflower.png';
import TallBushImage from './resources/tall_bush.png';
import TulipImage from './resources/tulip.png';
import WhiteFlowerImage from './resources/white_flower.png';
import { FlowerType } from './types';
import i18n from './i18n/i18n';

export class FlowerData {
  static fetchSpread(name: string): number {
    switch (name) {
      case FlowerType.Bellflower:
        return 0.4;
      case FlowerType.Boxwood:
        return 1.6;
      case FlowerType.Hosta:
        return 1;
      case FlowerType.Hibiscus:
        return 2;
      case FlowerType.Hydrangea:
        return 2;
      case FlowerType.Peony:
        return 1.5;
      case FlowerType.RedRose:
        return 0.5;
      case FlowerType.Sunflower:
        return 1;
      case FlowerType.TallBush:
        return 1;
      case FlowerType.Tulip:
        return 0.4;
      default:
        return 0.8;
    }
  }

  static fetchHeight(name: string): number {
    switch (name) {
      case FlowerType.Bellflower:
        return 0.8;
      case FlowerType.Boxwood:
        return 1.44;
      case FlowerType.Hosta:
        return 0.7;
      case FlowerType.Hibiscus:
        return 1.7;
      case FlowerType.Hydrangea:
        return 1.5;
      case FlowerType.Peony:
        return 1;
      case FlowerType.RedRose:
        return 0.8;
      case FlowerType.Sunflower:
        return 2;
      case FlowerType.TallBush:
        return 2;
      case FlowerType.Tulip:
        return 0.7;
      default:
        return 0.5;
    }
  }

  static fetchLabel(name: string, lang: {}): string {
    switch (name) {
      case FlowerType.Bellflower:
        return i18n.t('flower.Bellflower', lang);
      case FlowerType.Boxwood:
        return i18n.t('flower.Boxwood', lang);
      case FlowerType.Hibiscus:
        return i18n.t('flower.Hibiscus', lang);
      case FlowerType.Hydrangea:
        return i18n.t('flower.Hydrangea', lang);
      case FlowerType.Hosta:
        return i18n.t('flower.Hosta', lang);
      case FlowerType.Peony:
        return i18n.t('flower.Peony', lang);
      case FlowerType.RedRose:
        return i18n.t('flower.RedRose', lang);
      case FlowerType.Sunflower:
        return i18n.t('flower.Sunflower', lang);
      case FlowerType.TallBush:
        return i18n.t('flower.TallBush', lang);
      case FlowerType.Tulip:
        return i18n.t('flower.Tulip', lang);
      default:
        return i18n.t('flower.WhiteFlower', lang);
    }
  }

  static fetchTextureImage(name: string, noLeaves: boolean) {
    if (noLeaves) {
      if (name === FlowerType.Hibiscus || name === FlowerType.Hydrangea) {
        return NoLeafShrubImage;
      }
      if (name === FlowerType.Boxwood) {
        return BoxwoodImage;
      }
      if (name === FlowerType.TallBush) {
        return TallBushImage;
      }
      return NoLeafFlowerImage;
    }
    let textureImg;
    switch (name) {
      case FlowerType.Bellflower:
        textureImg = BellflowerImage;
        break;
      case FlowerType.Boxwood:
        textureImg = BoxwoodImage;
        break;
      case FlowerType.Hibiscus:
        textureImg = HibiscusImage;
        break;
      case FlowerType.Hydrangea:
        textureImg = HydrangeaImage;
        break;
      case FlowerType.Hosta:
        textureImg = HostaImage;
        break;
      case FlowerType.Peony:
        textureImg = PeonyImage;
        break;
      case FlowerType.RedRose:
        textureImg = RedRoseImage;
        break;
      case FlowerType.Sunflower:
        textureImg = SunflowerImage;
        break;
      case FlowerType.TallBush:
        textureImg = TallBushImage;
        break;
      case FlowerType.Tulip:
        textureImg = TulipImage;
        break;
      default:
        textureImg = WhiteFlowerImage;
    }
    return textureImg;
  }
}
