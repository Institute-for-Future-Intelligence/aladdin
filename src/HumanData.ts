/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import JaahImage from './resources/jaah.png';
import JackImage from './resources/jack.png';
import JacobImage from './resources/jacob.png';
import JacquelineImage from './resources/jacqueline.png';
import JadeImage from './resources/jade.png';
import JameliaImage from './resources/jamelia.png';
import JamesImage from './resources/james.png';
import JaneImage from './resources/jane.png';
import JayaImage from './resources/jaya.png';
import JayeImage from './resources/jaye.png';
import JeanetteImage from './resources/jeanette.png';
import JediImage from './resources/jedi.png';
import JeffImage from './resources/jeff.png';
import JenaImage from './resources/jena.png';
import JenniferImage from './resources/jennifer.png';
import JessImage from './resources/jess.png';
import JettImage from './resources/jett.png';
import JillImage from './resources/jill.png';
import JiyaImage from './resources/jiya.png';
import JoanImage from './resources/joan.png';
import JocelynImage from './resources/jocelyn.png';
import JoelImage from './resources/joel.png';
import JoeyImage from './resources/joey.png';
import JohnImage from './resources/john.png';
import JonathonImage from './resources/jonathon.png';
import JoseImage from './resources/jose.png';
import JosephImage from './resources/joseph.png';
import JoshuaImage from './resources/joshua.png';
import JuddImage from './resources/judd.png';
import JudyImage from './resources/judy.png';
import JuliaImage from './resources/julia.png';
import JulioImage from './resources/julio.png';
import JumapiliImage from './resources/jumapili.png';
import JuneImage from './resources/june.png';
import JuroImage from './resources/juro.png';
import JustinImage from './resources/justin.png';

import { Gender, HumanName } from './types';
import i18n from './i18n/i18n';

export class HumanData {
  static fetchGender(name: string): Gender {
    switch (name) {
      case HumanName.Jaah:
        return Gender.Male;
      case HumanName.Jacqueline:
        return Gender.Female;
      case HumanName.Jade:
        return Gender.Female;
      case HumanName.Jamelia:
        return Gender.Female;
      case HumanName.James:
        return Gender.Male;
      case HumanName.Jane:
        return Gender.Female;
      case HumanName.Jaya:
        return Gender.Female;
      case HumanName.Jaye:
        return Gender.Male;
      case HumanName.Jeanette:
        return Gender.Female;
      case HumanName.Jedi:
        return Gender.Male;
      case HumanName.Jeff:
        return Gender.Male;
      case HumanName.Jena:
        return Gender.Female;
      case HumanName.Jennifer:
        return Gender.Female;
      case HumanName.Jess:
        return Gender.Female;
      case HumanName.Jett:
        return Gender.Male;
      case HumanName.Jill:
        return Gender.Female;
      case HumanName.Jiya:
        return Gender.Female;
      case HumanName.Joan:
        return Gender.Female;
      case HumanName.Jocelyn:
        return Gender.Female;
      case HumanName.Joel:
        return Gender.Male;
      case HumanName.Joey:
        return Gender.Female;
      case HumanName.John:
        return Gender.Male;
      case HumanName.Jonathon:
        return Gender.Male;
      case HumanName.Jose:
        return Gender.Male;
      case HumanName.Joseph:
        return Gender.Male;
      case HumanName.Joshua:
        return Gender.Male;
      case HumanName.Judd:
        return Gender.Male;
      case HumanName.Judy:
        return Gender.Female;
      case HumanName.Julia:
        return Gender.Female;
      case HumanName.Julio:
        return Gender.Male;
      case HumanName.Jumapili:
        return Gender.Female;
      case HumanName.June:
        return Gender.Female;
      case HumanName.Juro:
        return Gender.Male;
      case HumanName.Justin:
        return Gender.Male;
      default:
        return Gender.Male;
    }
  }

  static fetchLabel(name: string, lang: { lng: string }): string {
    switch (name) {
      case HumanName.Jaah:
        return i18n.t('people.Jaah', lang);
      case HumanName.Jacob:
        return i18n.t('people.Jacob', lang);
      case HumanName.Jacqueline:
        return i18n.t('people.Jacqueline', lang);
      case HumanName.Jade:
        return i18n.t('people.Jade', lang);
      case HumanName.Jamelia:
        return i18n.t('people.Jamelia', lang);
      case HumanName.James:
        return i18n.t('people.James', lang);
      case HumanName.Jane:
        return i18n.t('people.Jane', lang);
      case HumanName.Jaya:
        return i18n.t('people.Jaya', lang);
      case HumanName.Jaye:
        return i18n.t('people.Jaye', lang);
      case HumanName.Jeanette:
        return i18n.t('people.Jeanette', lang);
      case HumanName.Jedi:
        return i18n.t('people.Jedi', lang);
      case HumanName.Jeff:
        return i18n.t('people.Jeff', lang);
      case HumanName.Jena:
        return i18n.t('people.Jena', lang);
      case HumanName.Jennifer:
        return i18n.t('people.Jennifer', lang);
      case HumanName.Jess:
        return i18n.t('people.Jess', lang);
      case HumanName.Jett:
        return i18n.t('people.Jett', lang);
      case HumanName.Jill:
        return i18n.t('people.Jill', lang);
      case HumanName.Jiya:
        return i18n.t('people.Jiya', lang);
      case HumanName.Joan:
        return i18n.t('people.Joan', lang);
      case HumanName.Jocelyn:
        return i18n.t('people.Jocelyn', lang);
      case HumanName.Joel:
        return i18n.t('people.Joel', lang);
      case HumanName.Joey:
        return i18n.t('people.Joey', lang);
      case HumanName.John:
        return i18n.t('people.John', lang);
      case HumanName.Jonathon:
        return i18n.t('people.Jonathon', lang);
      case HumanName.Jose:
        return i18n.t('people.Jose', lang);
      case HumanName.Joseph:
        return i18n.t('people.Joseph', lang);
      case HumanName.Joshua:
        return i18n.t('people.Joshua', lang);
      case HumanName.Judd:
        return i18n.t('people.Judd', lang);
      case HumanName.Judy:
        return i18n.t('people.Judy', lang);
      case HumanName.Julia:
        return i18n.t('people.Julia', lang);
      case HumanName.Julio:
        return i18n.t('people.Julio', lang);
      case HumanName.Jumapili:
        return i18n.t('people.Jumapili', lang);
      case HumanName.June:
        return i18n.t('people.June', lang);
      case HumanName.Juro:
        return i18n.t('people.Juro', lang);
      case HumanName.Justin:
        return i18n.t('people.Justin', lang);
      default:
        return i18n.t('people.Jack', lang);
    }
  }

  static fetchHatOffsetY(name: string): number {
    switch (name) {
      case HumanName.Jonathon:
        return -0.22;
    }
    return 0;
  }

  static fetchHatOffsetX(name: string): number {
    switch (name) {
      case HumanName.Jaah:
        return -0.05;
      case HumanName.Jack:
        return -0.05;
      case HumanName.Jacob:
        return 0.09;
      case HumanName.Jade:
        return -0.04;
      case HumanName.Jaya:
        return 0.04;
      case HumanName.Jaye:
        return 0;
      case HumanName.Jamelia:
        return 0.05;
      case HumanName.Jane:
        return 0.02;
      case HumanName.Jeanette:
        return 0.08;
      case HumanName.Jedi:
        return -0.02;
      case HumanName.Jeff:
        return -0.05;
      case HumanName.Jena:
        return 0.05;
      case HumanName.Jennifer:
        return 0.02;
      case HumanName.Jess:
        return 0.01;
      case HumanName.Jett:
        return -0.04;
      case HumanName.Jill:
        return -0.03;
      case HumanName.Jiya:
        return -0.03;
      case HumanName.Joan:
        return -0.45;
      case HumanName.Jocelyn:
        return -0.01;
      case HumanName.Joel:
        return -0.48;
      case HumanName.Joey:
        return 0.01;
      case HumanName.John:
        return 0.01;
      case HumanName.Jonathon:
        return 0.02;
      case HumanName.Jose:
        return 0.05;
      case HumanName.Joseph:
        return 0.05;
      case HumanName.Joshua:
        return -0.01;
      case HumanName.Judy:
        return 0.02;
      case HumanName.Julia:
        return -0.02;
      case HumanName.Jumapili:
        return -0.04;
      case HumanName.June:
        return -0.1;
      case HumanName.Juro:
        return -0.08;
      case HumanName.Justin:
        return -0.06;
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
      case HumanName.Jacob:
        return 1.82;
      case HumanName.Jacqueline:
        return 1.78;
      case HumanName.Jade:
        return 1.6;
      case HumanName.James:
        return 1.75;
      case HumanName.Jane:
        return 1.67;
      case HumanName.Jaya:
        return 1.55;
      case HumanName.Jaye:
        return 1.65;
      case HumanName.Jamelia:
        return 1.8;
      case HumanName.Jeanette:
        return 1.62;
      case HumanName.Jedi:
        return 1.75;
      case HumanName.Jeff:
        return 1.65;
      case HumanName.Jena:
        return 1.6;
      case HumanName.Jennifer:
        return 1.7;
      case HumanName.Jess:
        return 1.5;
      case HumanName.Jett:
        return 1.85;
      case HumanName.Jill:
        return 1.71;
      case HumanName.Jiya:
        return 1.74;
      case HumanName.Joan:
        return 1.68;
      case HumanName.Jocelyn:
        return 1.72;
      case HumanName.Joel:
        return 1.75;
      case HumanName.Joey:
        return 1.72;
      case HumanName.John:
        return 1.85;
      case HumanName.Jonathon:
        return 1.9;
      case HumanName.Jose:
        return 1.6;
      case HumanName.Joseph:
        return 1.88;
      case HumanName.Joshua:
        return 1.79;
      case HumanName.Judd:
        return 1.68;
      case HumanName.Judy:
        return 1.75;
      case HumanName.Julia:
        return 1.71;
      case HumanName.Julio:
        return 1.76;
      case HumanName.Jumapili:
        return 1.65;
      case HumanName.June:
        return 1.85;
      case HumanName.Juro:
        return 1.72;
      case HumanName.Justin:
        return 1.755;
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
      case HumanName.Jacqueline:
        return 0.43;
      case HumanName.Jacob:
        return 0.8;
      case HumanName.Jade:
        return 0.48;
      case HumanName.James:
        return 0.472;
      case HumanName.Jane:
        return 0.4;
      case HumanName.Jaya:
        return 0.6;
      case HumanName.Jaye:
        return 0.55;
      case HumanName.Jamelia:
        return 0.65;
      case HumanName.Jeanette:
        return 0.4;
      case HumanName.Jedi:
        return 0.56;
      case HumanName.Jena:
        return 0.695;
      case HumanName.Jennifer:
        return 0.45;
      case HumanName.Jess:
        return 0.43;
      case HumanName.Jill:
        return 0.42;
      case HumanName.Joan:
        return 1.7;
      case HumanName.Jocelyn:
        return 0.4;
      case HumanName.Joel:
        return 1.8;
      case HumanName.Joey:
        return 0.462;
      case HumanName.John:
        return 0.6;
      case HumanName.Jonathon:
        return 0.6;
      case HumanName.Jose:
        return 2;
      case HumanName.Joseph:
        return 0.6;
      case HumanName.Joshua:
        return 0.5;
      case HumanName.Judd:
        return 0.544;
      case HumanName.Judy:
        return 0.41;
      case HumanName.Julia:
        return 0.43;
      case HumanName.Julio:
        return 0.5;
      case HumanName.Jumapili:
        return 0.75;
      case HumanName.June:
        return 0.65;
      case HumanName.Juro:
        return 0.494;
      case HumanName.Justin:
        return 0.6;
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
      case HumanName.Jacob:
        textureImg = JacobImage;
        break;
      case HumanName.Jacqueline:
        textureImg = JacquelineImage;
        break;
      case HumanName.Jade:
        textureImg = JadeImage;
        break;
      case HumanName.Jamelia:
        textureImg = JameliaImage;
        break;
      case HumanName.James:
        textureImg = JamesImage;
        break;
      case HumanName.Jane:
        textureImg = JaneImage;
        break;
      case HumanName.Jaya:
        textureImg = JayaImage;
        break;
      case HumanName.Jaye:
        textureImg = JayeImage;
        break;
      case HumanName.Jeanette:
        textureImg = JeanetteImage;
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
      case HumanName.Jennifer:
        textureImg = JenniferImage;
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
      case HumanName.Jiya:
        textureImg = JiyaImage;
        break;
      case HumanName.Joan:
        textureImg = JoanImage;
        break;
      case HumanName.Jocelyn:
        textureImg = JocelynImage;
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
      case HumanName.Jonathon:
        textureImg = JonathonImage;
        break;
      case HumanName.Jose:
        textureImg = JoseImage;
        break;
      case HumanName.Joseph:
        textureImg = JosephImage;
        break;
      case HumanName.Joshua:
        textureImg = JoshuaImage;
        break;
      case HumanName.Judd:
        textureImg = JuddImage;
        break;
      case HumanName.Judy:
        textureImg = JudyImage;
        break;
      case HumanName.Julia:
        textureImg = JuliaImage;
        break;
      case HumanName.Julio:
        textureImg = JulioImage;
        break;
      case HumanName.Jumapili:
        textureImg = JumapiliImage;
        break;
      case HumanName.June:
        textureImg = JuneImage;
        break;
      case HumanName.Juro:
        textureImg = JuroImage;
        break;
      case HumanName.Justin:
        textureImg = JustinImage;
        break;
      default:
        textureImg = JackImage;
    }
    return textureImg;
  }
}
