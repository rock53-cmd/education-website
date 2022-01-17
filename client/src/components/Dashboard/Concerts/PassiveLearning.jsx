import { useEffect } from "react";
import { Flex } from "@chakra-ui/layout";
import { useSelector, useDispatch } from "react-redux";

import SpaceImage from "../../../assets/space.jpg";
import passiveLearningDefaultAudio from "../../../assets/audios/passive-learning.mp3";

import { NEXT_WORD } from "../../../redux/actions/concertActions";

export default function PassiveLearning() {
  const { useDefaultAsset, assets, questions, currentIndex } = useSelector(
    (state) => state.concertReducer
  );
  const dispatch = useDispatch();

  /*
    First play the passive learning voice immediately
    then play it again after 3 seconds
    then wait until 1 second and navigate into the next word
  */
  function repeatAudios(index) {
    const passiveLearningAudio = new Audio(questions[index].passiveLearningVoice);

    passiveLearningAudio.currentTime = 0;
    passiveLearningAudio.play();

    passiveLearningAudio.onended = () => {
      setTimeout(() => {
        passiveLearningAudio.currentTime = 0;
        passiveLearningAudio.play();
        passiveLearningAudio.onended = () => {
          setTimeout(() => {
            dispatch(NEXT_WORD());
          }, 1000);
        };
      }, 3000);
    };
  }

  return (
    <Flex direction="column" w="full" h="full">
      <img
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        src={useDefaultAsset ? SpaceImage : assets.passiveLearningImage}
      />
      <audio
        src={questions[currentIndex].passiveLearningMaleVoice}
        onEnded={() => repeatAudios(currentIndex)}
        autoPlay
      />
      <audio
        onCanPlay={(e) => (e.target.volume = 0.2)}
        loop
        src={useDefaultAsset ? passiveLearningDefaultAudio : assets.passiveLearningBgAudio}
        autoPlay
      />
    </Flex>
  );
}