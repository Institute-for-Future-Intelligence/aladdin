import { Bloom, EffectComposer } from '@react-three/postprocessing';

const BloomEffect = () => {
  return (
    <EffectComposer>
      <Bloom mipmapBlur={true} luminanceThreshold={10} intensity={0.05} radius={0.1} />
    </EffectComposer>
  );
};

export default BloomEffect;
