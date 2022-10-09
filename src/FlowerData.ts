/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import DaylilyImage from './resources/daylily.png';
import BellflowerImage from './resources/bellflower.png';
import SunflowerImage from './resources/sunflower.png';
import { FlowerType } from './types';
import i18n from './i18n/i18n';

export class FlowerData {
  static fetchSpread(name: string): number {
    switch (name) {
      case FlowerType.Bellflower:
        return 0.8;
      case FlowerType.Sunflower:
        return 1;
      default:
        return 1;
    }
  }

  static fetchHeight(name: string): number {
    switch (name) {
      case FlowerType.Bellflower:
        return 1;
      case FlowerType.Sunflower:
        return 2;
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
      default:
        textureImg = DaylilyImage;
    }
    return textureImg;
  }
}
