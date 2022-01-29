import { useRef, useState } from "react";
import { Flex } from "@chakra-ui/layout";
import { useSelector, useDispatch } from "react-redux";
import { FiPlay, FiPause } from "react-icons/fi";
import { motion } from "framer-motion";
import { IconButton } from "@chakra-ui/button";

import { NEXT_WORD } from "../../../redux/actions/concertActions";

export default function PassiveLearning() {
  const { assets, questions, currentIndex } = useSelector((state) => state.concertReducer);
  const [playing, setPlaying] = useState(true);
  const [wasPlaying, setWasPlaying] = useState();
  const dispatch = useDispatch();
  const backgroundAudioRef = useRef();
  const learningAudioRef = useRef();
  const learningMaleAudioRef = useRef();

  function fadeBgSound(start) {
    if (start) {
      backgroundAudioRef.current.volume = 0.2;
      setTimeout(() => {
        backgroundAudioRef.current.volume = 0.3;
        setTimeout(() => {
          backgroundAudioRef.current.volume = 0.4;
          setTimeout(() => {
            backgroundAudioRef.current.volume = 0.5;
          });
        }, 100);
      }, 100);
    } else {
      backgroundAudioRef.current.volume = 0.4;
      setTimeout(() => {
        backgroundAudioRef.current.volume = 0.3;
        setTimeout(() => {
          backgroundAudioRef.current.volume = 0.2;
          setTimeout(() => {
            backgroundAudioRef.current.volume = 0.1;
          }, 100);
        }, 100);
      }, 100);
    }
  }

  /*
    First play the passive learning voice immediately
    then play it again after 3 seconds
    then wait until 1 second and navigate into the next word
  */
  /* function repeatAudios(index) {
    const passiveLearningAudio = new Audio(questions[index].passiveLearningVoice);

    passiveLearningAudio.currentTime = 0;
    passiveLearningAudio.play();

    passiveLearningAudio.onended = () => {
      fadeBgSound(true);
      setTimeout(() => {
        fadeBgSound(false);
        passiveLearningAudio.currentTime = 0;
        passiveLearningAudio.play();
        passiveLearningAudio.onended = () => {
          fadeBgSound(true);
          setTimeout(() => {
            dispatch(NEXT_WORD());
          }, 1000);
        };
      }, 3000);
    };
  } */

  function handleMaleAudioEnd() {
    const learningAudio = learningAudioRef.current;

    learningAudio.play();

    learningAudio.onended = () => {
      fadeBgSound(true);
      setTimeout(() => {
        learningAudio.play();
        learningAudio.onended = () => {
          fadeBgSound(true);
          setTimeout(() => {
            dispatch(NEXT_WORD());
          }, 1000);
        };
      }, 3000);
    };
  }

  function handleControlClick() {
    const bgAudio = backgroundAudioRef.current;
    const learningAudio = learningAudioRef.current;
    const maleAudio = learningMaleAudioRef.current;

    if (bgAudio.paused) {
      bgAudio.play();
      if (wasPlaying) {
        wasPlaying.play();
      }
      setPlaying(true);
    } else {
      bgAudio.pause();
      learningAudio.pause();
      maleAudio.pause();
      setPlaying(false);
    }
  }

  return (
    <Flex position="relative" direction="column" w="full" h="full">
      <motion.div
        whileHover={{ opacity: 1, transition: { duration: 0.2 } }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "#00000095",
          opacity: 0,
        }}
      >
        <IconButton
          icon={playing ? <FiPause /> : <FiPlay />}
          colorScheme="secondary"
          color="black"
          size="lg"
          rounded={100}
          onClick={handleControlClick}
        />
      </motion.div>

      {assets.passiveLearningImage && (
        <img
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          src={assets.passiveLearningImage}
        />
      )}

      <audio
        src={questions[currentIndex].passiveLearningMaleVoice}
        onPlay={(e) => {
          setWasPlaying(e.target);
          fadeBgSound(false);
        }}
        onEnded={handleMaleAudioEnd}
        autoPlay
        ref={learningMaleAudioRef}
      />
      <audio
        src={questions[currentIndex].passiveLearningVoice}
        onPlay={(e) => {
          setWasPlaying(e.target);
          fadeBgSound(false);
        }}
        ref={learningAudioRef}
      />

      {assets.passiveLearningBgAudio && (
        <audio
          onCanPlay={(e) => (e.target.volume = 0.5)}
          loop
          src={assets.passiveLearningBgAudio}
          autoPlay
          ref={backgroundAudioRef}
        />
      )}
    </Flex>
  );
}
