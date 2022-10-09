/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import NoLeafFlowerImage from './resources/no_leaf_flower.png';
import WhiteFlowerImage from './resources/white_flower.png';
import YellowFlowerImage from './resources/yellow_flower.png';
import TulipImage from './resources/tulip.png';
import BellflowerImage from './resources/bellflower.png';
import SunflowerImage from './resources/sunflower.png';
import { FlowerType } from './types';
import i18n from './i18n/i18n';

export class FlowerData {
  static fetchSpread(name: string): number {
    switch (name) {
      case FlowerType.Bellflower:
        return 0.4;
      case FlowerType.Sunflower:
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
      case FlowerType.Sunflower:
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
      case FlowerType.Sunflower:
        return i18n.t('flower.Sunflower', lang);
      case FlowerType.Tulip:
        return i18n.t('flower.Tulip', lang);
      case FlowerType.YellowFlower:
        return i18n.t('flower.YellowFlower', lang);
      default:
        return i18n.t('flower.WhiteFlower', lang);
    }
  }

  static fetchTextureImage(name: string, noLeaves: boolean) {
    if (noLeaves) return NoLeafFlowerImage;
    let textureImg;
    switch (name) {
      case FlowerType.Bellflower:
        textureImg = BellflowerImage;
        break;
      case FlowerType.Sunflower:
        textureImg = SunflowerImage;
        break;
      case FlowerType.Tulip:
        textureImg = TulipImage;
        break;
      case FlowerType.YellowFlower:
        textureImg = YellowFlowerImage;
        break;
      default:
        textureImg = WhiteFlowerImage;
    }
    return textureImg;
  }
}
