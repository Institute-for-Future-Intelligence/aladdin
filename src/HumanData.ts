/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import JaahImage from './resources/jaah.png';
import JackImage from './resources/jack.png';
import JadeImage from './resources/jade.png';
import JaneImage from './resources/jane.png';
import JayeImage from './resources/jaye.png';
import JeanImage from './resources/jean.png';
import JediImage from './resources/jedi.png';
import JeffImage from './resources/jeff.png';
import JenaImage from './resources/jena.png';
import JeniImage from './resources/jeni.png';
import JessImage from './resources/jess.png';
import JettImage from './resources/jett.png';
import JillImage from './resources/jill.png';
import JoanImage from './resources/joan.png';
import JoelImage from './resources/joel.png';
import JoeyImage from './resources/joey.png';
import JohnImage from './resources/john.png';
import JoseImage from './resources/jose.png';
import JuddImage from './resources/judd.png';
import JudyImage from './resources/judy.png';
import JuneImage from './resources/june.png';
import JuroImage from './resources/juro.png';
import XiaoliImage from './resources/xiaoli.png';
import XiaomingImage from './resources/xiaoming.png';
import { Gender, HumanName } from './types';
import i18n from './i18n/i18n';

export class HumanData {
  static fetchGender(name: string): Gender {
    switch (name) {
      case HumanName.Jaah:
        return Gender.Male;
      case HumanName.Jade:
        return Gender.Female;
      case HumanName.Jane:
        return Gender.Female;
      case HumanName.Jaye:
        return Gender.Male;
      case HumanName.Jean:
        return Gender.Female;
      case HumanName.Jedi:
        return Gender.Male;
      case HumanName.Jeff:
        return Gender.Male;
      case HumanName.Jena:
        return Gender.Female;
      case HumanName.Jeni:
        return Gender.Female;
      case HumanName.Jess:
        return Gender.Female;
      case HumanName.Jett:
        return Gender.Male;
      case HumanName.Jill:
        return Gender.Female;
      case HumanName.Joan:
        return Gender.Female;
      case HumanName.Joel:
        return Gender.Male;
      case HumanName.Joey:
        return Gender.Female;
      case HumanName.John:
        return Gender.Male;
      case HumanName.Jose:
        return Gender.Male;
      case HumanName.Judd:
        return Gender.Male;
      case HumanName.Judy:
        return Gender.Female;
      case HumanName.June:
        return Gender.Female;
      case HumanName.Juro:
        return Gender.Male;
      case HumanName.Xiaoming:
        return Gender.Male;
      case HumanName.Xiaoli:
        return Gender.Female;
      default:
        return Gender.Male;
    }
  }

  static fetchLabel(name: string, lang: {}): string {
    switch (name) {
      case HumanName.Jaah:
        return i18n.t('people.Jaah', lang);
      case HumanName.Jade:
        return i18n.t('people.Jade', lang);
      case HumanName.Jane:
        return i18n.t('people.Jane', lang);
      case HumanName.Jaye:
        return i18n.t('people.Jaye', lang);
      case HumanName.Jean:
        return i18n.t('people.Jean', lang);
      case HumanName.Jedi:
        return i18n.t('people.Jedi', lang);
      case HumanName.Jeff:
        return i18n.t('people.Jeff', lang);
      case HumanName.Jena:
        return i18n.t('people.Jena', lang);
      case HumanName.Jeni:
        return i18n.t('people.Jeni', lang);
      case HumanName.Jess:
        return i18n.t('people.Jess', lang);
      case HumanName.Jett:
        return i18n.t('people.Jett', lang);
      case HumanName.Jill:
        return i18n.t('people.Jill', lang);
      case HumanName.Joan:
        return i18n.t('people.Joan', lang);
      case HumanName.Joel:
        return i18n.t('people.Joel', lang);
      case HumanName.Joey:
        return i18n.t('people.Joey', lang);
      case HumanName.John:
        return i18n.t('people.John', lang);
      case HumanName.Jose:
        return i18n.t('people.Jose', lang);
      case HumanName.Judd:
        return i18n.t('people.Judd', lang);
      case HumanName.Judy:
        return i18n.t('people.Judy', lang);
      case HumanName.June:
        return i18n.t('people.June', lang);
      case HumanName.Juro:
        return i18n.t('people.Juro', lang);
      case HumanName.Xiaoming:
        return i18n.t('people.Xiaoming', lang);
      case HumanName.Xiaoli:
        return i18n.t('people.Xiaoli', lang);
      default:
        return i18n.t('people.Jack', lang);
    }
  }

  static fetchHatOffset(name: string): number {
    switch (name) {
      case HumanName.Jaah:
        return -0.05;
      case HumanName.Jack:
        return -0.05;
      case HumanName.Jade:
        return -0.04;
      case HumanName.Jane:
        return 0.04;
      case HumanName.Jaye:
        return 0;
      case HumanName.Jean:
        return 0.05;
      case HumanName.Jedi:
        return -0.02;
      case HumanName.Jeff:
        return -0.05;
      case HumanName.Jena:
        return 0.05;
      case HumanName.Jeni:
        return 0.02;
      case HumanName.Jess:
        return 0.09;
      case HumanName.Jett:
        return -0.04;
      case HumanName.Jill:
        return -0.03;
      case HumanName.Joan:
        return -0.45;
      case HumanName.Joel:
        return -0.48;
      case HumanName.Joey:
        return 0.01;
      case HumanName.John:
        return 0.01;
      case HumanName.Jose:
        return 0.05;
      case HumanName.Judy:
        return -0.04;
      case HumanName.June:
        return -0.04;
      case HumanName.Juro:
        return -0.08;
      default:
        return 0;
    }
  }

  static fetchHeight(name: string): number {
    switch (name) {
      case HumanName.Jaah:
        return 1.78;
      case HumanName.Jack:
        return 1.8;
      case HumanName.Jade:
        return 1.6;
      case HumanName.Jane:
        return 1.55;
      case HumanName.Jaye:
        return 1.65;
      case HumanName.Jean:
        return 1.8;
      case HumanName.Jedi:
        return 1.75;
      case HumanName.Jeff:
        return 1.65;
      case HumanName.Jena:
        return 1.6;
      case HumanName.Jeni:
        return 1.7;
      case HumanName.Jess:
        return 1.5;
      case HumanName.Jett:
        return 1.85;
      case HumanName.Jill:
        return 1.74;
      case HumanName.Joan:
        return 1.68;
      case HumanName.Joel:
        return 1.75;
      case HumanName.Joey:
        return 1.72;
      case HumanName.John:
        return 1.85;
      case HumanName.Jose:
        return 1.6;
      case HumanName.Judd:
        return 1.68;
      case HumanName.Judy:
        return 1.65;
      case HumanName.June:
        return 1.85;
      case HumanName.Juro:
        return 1.72;
      case HumanName.Xiaoming:
        return 1.75;
      case HumanName.Xiaoli:
        return 1.65;
      default:
        return 1.8;
    }
  }

  static fetchWidth(name: string): number {
    switch (name) {
      case HumanName.Jaah:
        return 0.74;
      case HumanName.Jack:
        return 0.42;
      case HumanName.Jade:
        return 0.48;
      case HumanName.Jane:
        return 0.6;
      case HumanName.Jaye:
        return 0.55;
      case HumanName.Jean:
        return 0.65;
      case HumanName.Jedi:
        return 0.56;
      case HumanName.Jena:
        return 0.695;
      case HumanName.Jeni:
        return 0.45;
      case HumanName.Jess:
        return 0.43;
      case HumanName.Joan:
        return 1.7;
      case HumanName.Joel:
        return 1.8;
      case HumanName.Joey:
        return 0.462;
      case HumanName.John:
        return 0.6;
      case HumanName.Jose:
        return 2;
      case HumanName.Judd:
        return 0.544;
      case HumanName.Judy:
        return 0.75;
      case HumanName.June:
        return 0.65;
      case HumanName.Juro:
        return 0.494;
      case HumanName.Xiaoli:
        return 0.43;
      case HumanName.Xiaoming:
        return 0.472;
      default:
        return 0.6;
    }
  }

  static fetchTextureImage(name: string) {
    let textureImg;
    switch (name) {
      case HumanName.Jaah:
        textureImg = JaahImage;
        break;
      case HumanName.Jade:
        textureImg = JadeImage;
        break;
      case HumanName.Jane:
        textureImg = JaneImage;
        break;
      case HumanName.Jaye:
        textureImg = JayeImage;
        break;
      case HumanName.Jean:
        textureImg = JeanImage;
        break;
      case HumanName.Jedi:
        textureImg = JediImage;
        break;
      case HumanName.Jeff:
        textureImg = JeffImage;
        break;
      case HumanName.Jena:
        textureImg = JenaImage;
        break;
      case HumanName.Jeni:
        textureImg = JeniImage;
        break;
      case HumanName.Jess:
        textureImg = JessImage;
        break;
      case HumanName.Jett:
        textureImg = JettImage;
        break;
      case HumanName.Jill:
        textureImg = JillImage;
        break;
      case HumanName.Joan:
        textureImg = JoanImage;
        break;
      case HumanName.Joel:
        textureImg = JoelImage;
        break;
      case HumanName.Joey:
        textureImg = JoeyImage;
        break;
      case HumanName.John:
        textureImg = JohnImage;
        break;
      case HumanName.Jose:
        textureImg = JoseImage;
        break;
      case HumanName.Judd:
        textureImg = JuddImage;
        break;
      case HumanName.Judy:
        textureImg = JudyImage;
        break;
      case HumanName.June:
        textureImg = JuneImage;
        break;
      case HumanName.Juro:
        textureImg = JuroImage;
        break;
      case HumanName.Xiaoming:
        textureImg = XiaomingImage;
        break;
      case HumanName.Xiaoli:
        textureImg = XiaoliImage;
        break;
      default:
        textureImg = JackImage;
    }
    return textureImg;
  }
}
