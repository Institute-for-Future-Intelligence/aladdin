import { RulerModel, RulerType } from 'src/models/RulerModel';
import HorizontalRuler from './horizontalRuler';
import VerticalRuler from './verticalRuler';

const RulerWrapper = (ruler: RulerModel) => {
  const { rulerType = RulerType.Horizontal } = ruler;

  switch (rulerType) {
    case RulerType.Horizontal:
      return <HorizontalRuler {...ruler} />;
    case RulerType.Vertical:
      return <VerticalRuler {...ruler} />;
    default:
      return null;
  }
};

export default RulerWrapper;
