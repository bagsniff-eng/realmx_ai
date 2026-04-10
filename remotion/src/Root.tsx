import React from 'react';
import {Composition} from 'remotion';
import {RealmxCommercial} from './commercial/RealmxCommercial';
import {
  RealmxAtlasCommercial,
  RealmxObsidianCommercial,
  RealmxVelocityCommercial,
} from './commercial/RealmxAltCommercials';
import {RealmxFilm} from './commercial/RealmxFilm';
import {RealmxPremium} from './commercial/RealmxPremium';
import {RealmxPastel} from './commercial/RealmxPastel';
import {RealmxFlagship} from './commercial/RealmxFlagship';
import {RealmxFlagshipV2} from './commercial/RealmxFlagshipV2';
import {RealmxPastelV2} from './commercial/RealmxPastelV2';
import {RealmxPastelV3} from './commercial/RealmxPastelV3';
import {RealmxCommunity} from './commercial/RealmxCommunity';
import {RealmxKeynote} from './commercial/RealmxKeynote';
import {RealmxCollage} from './commercial/RealmxCollage';
import {RealmxClean} from './commercial/RealmxClean';
import {RealmxTerminal} from './commercial/RealmxTerminal';
import {RealmxIndigo} from './commercial/RealmxIndigo';
import {RealmxEditorial} from './commercial/RealmxEditorial';
import {RealmxPastelSpec} from './commercial/RealmxPastelSpec';
import {RealmxNodeFlow} from './commercial/RealmxNodeFlow';
import {RealmxGenesisFilm} from './commercial/RealmxGenesisFilm';
import {RealmxFlagshipStory} from './commercial/RealmxFlagshipStory';
import {RealmxClarity} from './commercial/RealmxClarity';
import {RealmxNarrative} from './commercial/RealmxNarrative';
import {RealmxMomentum} from './commercial/RealmxMomentum';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="REALMxAICommercial"
        component={RealmxCommercial}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={450}
        defaultProps={{variant: 'vertical'}}
      />
      <Composition
        id="REALMxAICommercialWide"
        component={RealmxCommercial}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={450}
        defaultProps={{variant: 'wide'}}
      />
      <Composition id="REALMxAIObsidian" component={RealmxObsidianCommercial} width={1920} height={1080} fps={30} durationInFrames={360} />
      <Composition id="REALMxAIVelocity" component={RealmxVelocityCommercial} width={1920} height={1080} fps={30} durationInFrames={360} />
      <Composition id="REALMxAIAtlas" component={RealmxAtlasCommercial} width={1920} height={1080} fps={30} durationInFrames={360} />
      <Composition id="REALMxAIFilm" component={RealmxFilm} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAIPremium" component={RealmxPremium} width={1920} height={1080} fps={30} durationInFrames={510} />
      <Composition id="REALMxAIPastel" component={RealmxPastel} width={1920} height={1080} fps={30} durationInFrames={450} />
      <Composition id="REALMxAIFlagship" component={RealmxFlagship} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAIFlagshipV2" component={RealmxFlagshipV2} width={1920} height={1080} fps={30} durationInFrames={600} />
      <Composition id="REALMxAIPastelV2" component={RealmxPastelV2} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAIPastelV3" component={RealmxPastelV3} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAICommunity" component={RealmxCommunity} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAIKeynote" component={RealmxKeynote} width={1920} height={1080} fps={30} durationInFrames={600} />
      <Composition id="REALMxAICollage" component={RealmxCollage} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAIClean" component={RealmxClean} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAITerminal" component={RealmxTerminal} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAIIndigo" component={RealmxIndigo} width={1920} height={1080} fps={30} durationInFrames={600} />
      <Composition id="REALMxAIEditorial" component={RealmxEditorial} width={1920} height={1080} fps={30} durationInFrames={540} />
      <Composition id="REALMxAIPastelSpec" component={RealmxPastelSpec} width={1920} height={1080} fps={30} durationInFrames={900} />
      <Composition id="REALMxAINodeFlow" component={RealmxNodeFlow} width={1920} height={1080} fps={30} durationInFrames={750} />
      <Composition id="REALMxAIGenesisFilm" component={RealmxGenesisFilm} width={1920} height={1080} fps={30} durationInFrames={1050} />
      <Composition id="REALMxAIFlagshipStory" component={RealmxFlagshipStory} width={1920} height={1080} fps={30} durationInFrames={1500} />
      <Composition id="REALMxAIClarity" component={RealmxClarity} width={1920} height={1080} fps={30} durationInFrames={1200} />
      <Composition id="REALMxAINarrative" component={RealmxNarrative} width={1920} height={1080} fps={30} durationInFrames={1950} />
      <Composition id="REALMxAIMomentum" component={RealmxMomentum} width={1920} height={1080} fps={30} durationInFrames={1260} />
    </>
  );
};
