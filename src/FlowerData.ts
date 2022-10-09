/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import DaylilyImage from './resources/daylily.png';
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
        return 1;
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
        return 1;
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
      default:
        return i18n.t('flower.Daylily', lang);
    }
  }

  static fetchTextureImage(name: string, noLeaves: boolean) {
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
      default:
        textureImg = DaylilyImage;
    }
    return textureImg;
  }
}
