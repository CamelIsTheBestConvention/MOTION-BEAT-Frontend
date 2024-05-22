import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../styles/hitEffect.css";
import { useLocation } from "react-router-dom";
// import "../styles/ingame.css";
import WebCam from "../components/room/webCam";
import "../styles/songSheet.css";
import styled from "styled-components";
import Load from "../components/ingame/game/gameLoader.js";
import GameControllerTuto from "../components/ingame/game/gameControllerTuto"
import { setGameloadData } from "../redux/actions/saveActions.js";
import { Judge } from "../components/ingame/game/judgement";
import Input from "../utils/input";
import Output from "../utils/output";
import socket from "../server/server";
import GameResult from "../components/ingame/gameResult";
import SecondScore from "../components/ingame/secondScore.js";
import GameExitBtn from "components/common/atomic/room/gameExitBtn.js";
import { TriggerMyHitEffect } from "../components/ingame/game/judgement";
import { Parser } from "utils/parser";
import { useAudio } from "components/common/useSoundManager";

import IngameBg from "../img/ingameBg.png";
import beatFlow0 from "../img/beatflow0.png";
import beatFlow1 from "../img/beatflow1.png";

const staticColorsArray = ["250,0,255", "1,248,10", "0,248,203", "249,41,42"];
let myPosition = 0;

const Ingame = () => {
  /* Router */
  const location = useLocation(); // 이전 페이지에서 데이터 가져오기
  const gameState = location.state || {}; // 가져온 데이터 넣기
  const { playMotionSFX } = useAudio();

  /* Redux */
  const dispatch = useDispatch();
  const loadedData = useSelector((state) => state.gameloadData);

  /* State */
  const [gameEnded, setGameEnded] = useState(false);
  const [gameData, setGameData] = useState(gameState.game);
  const [startGameProps, setStartGameProps] = useState(null);
  const [isGameReady, setGameReady] = useState(false);

  let playerNumber = 1;
  const [modalStatus, setModalStatus] = useState("NotReady");

  /* Storage */
  const myNickname = sessionStorage.getItem("nickname");

  /* Ref */
  const railRefs = useRef([]);

  /* I/O 처리 */
  const handleEnterDown = useCallback(
    (event) => {
      const sendData = {
        nickname: myNickname,
        code: gameData.code,
      };

      if (event.key === "Enter") {
        socket.emit(`playerLoaded`, sendData);

        setModalStatus("Ready");
        window.removeEventListener("keydown", handleEnterDown);

        const waitForAllPlayers = new Promise((resolve) => {
          socket.on(`allPlayersLoaded${sendData.code}`, (data) => {
            resolve(data);
          });
        });

        waitForAllPlayers
          .then((data) => {
            const synchedStartTime = WhenSocketOn(data);

            // StartGame 컴포넌트를 렌더링합니다.
            setStartGameProps({
              stime: synchedStartTime,
              data: loadedData,
              railRefs: railRefs.current,
              roomCode: gameData.code,
              song: gameData.song,
            });
            setGameReady(true);
          })
          .catch((err) => {
            console.error("Error", err);
          });
      }
    },
    [myNickname, railRefs.current, gameData.code, gameData.song, loadedData]
  );

  /* useEffect 순서를 변경하지 마세요*/
  useEffect(() => {
    if (loadedData) {
      window.addEventListener("keydown", handleEnterDown);
      ShowModal("NotReady");
    }
  }, [handleEnterDown, loadedData]);

  /* 네트워크 */
  useEffect(() => {
    // console.log(gameData);
    myPosition = 0;

    // 방에서 나갈 때 상태 업데이트
    const updatePlayersAfterLeave = (updatedPlayers) => {
      setGameData((prevRoom) => ({
        ...prevRoom,
        players: updatedPlayers,
      }));
    };

    socket.on(`allPlayersEnded${gameData.code}`, () => {
      // console.log("전체 플레이어 게임 끝");
      setGameEnded(true);
    });

    return () => {
      // currentAudio.removeEventListener("ended", handleAudioEnd);
      socket.off(`leftRoom${gameData.code}`, updatePlayersAfterLeave);
    };
  }, [gameData, myNickname]);

  useEffect(() => {
    // 게임 리소스 로딩
    const init = async () => {
      try {
        // console.log("게임데이터:", gameData);
        // console.log("myPosition", myPosition);
        // console.log("게임데이터 ", gameData.players);
        // console.log("TEST", gameData.players[myPosition].instrument)
        const loadedData = await Load(
          gameData.song,
          gameData.players,
          gameData.players[myPosition].instrument
        );

        // console.log("게임 리소스 로드 완료: " + loadedData);
        // console.log(loadedData);
        dispatch(setGameloadData(loadedData));
      } catch (error) {
        console.error("Loading failed:", error);
      }
    };
    init();
  }, []);

  const WhenSocketOn = (serverTime) => {
    // 여기에는 시작시간 딜레이가 포함됨
    const timeDiff = serverTime - Date.now();

    setModalStatus("Hide");

    return timeDiff;
  };

  // 재생 상태 변경
  useEffect(() => {
    if (playerNumber !== railRefs.current.length) {
      // playerNumber 길이만큼 ref를 생성
      railRefs.current = Array.from({ length: playerNumber }, (_, index) =>
        railRefs.current[index] || React.createRef()
      );
    }
    // console.log("TEST", playerNumber);
    // console.log("TEST", railRefs.current);

  }, [loadedData, playerNumber]);

  if (!staticColorsArray) {
    return <p>Loading...</p>;
  }

  const SongSheet = ({ railRefs, myPosition }) => {
    const [isActive, setIsActive] = useState(false);

    const handleKeyUp = useCallback(() => {
      /* 반응성 향상 */
      setTimeout(() => {
        setIsActive(false);
      }, 50);
    }, []);

    const handleKeyDown = useCallback(
      (key, time) => {
        setIsActive(true);

        const result = JudgeTuto(
          key,
          time,
          "drum1",
          myPosition,
          railRefs.current[myPosition]
        );

        if (result === true) {
          playMotionSFX("drum1", Parser(key), { volume: 2 });
        }
        /* 반응성 향상 */
        handleKeyUp();
      },
      [handleKeyUp, myPosition, railRefs]
    );

    return (
      <div className="background-songSheet">
        <div className="hitLine">{/* <div className="test"></div> */}</div>
        <Output />
        {gameData.players.map((player, index) => {
          if (!railRefs?.current[index]) {
            return null;
          }

          return (
            <VerticalRail
              ref={railRefs.current[index]}
              color={`rgba(${staticColorsArray[index]}, ${index === myPosition ? 1 : 0.4
                })`}
              top={`${(100 / gameData.players.length) * index}%`}
              data-instrument={gameData.players[index].instrument}
              key={index}
            >
              <Indicator />
              <JudgeBox isactive={isActive} key={index}>
                <div
                  id={`player${myPosition}HitEffect`}
                  className="hit-effect"
                  key={myPosition}
                />
              </JudgeBox>
              <Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />

            </VerticalRail>
          );
        })}
      </div>
    );
  };

  const ShowModal = (strings) => {
    switch (strings) {
      case "Hide":
        return null;
      case "NotReady":
        return (
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              height: "100vh",
              width: "100vw",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: "5000",
              backgroundImage: `url(${IngameBg})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            <p style={{ color: "white", fontSize: "100px" }}>Press "Enter"</p>
          </div>
        );
      case "Ready":
        return (
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              height: "100vh",
              width: "100vw",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: "5000",
              backgroundImage: `url(${IngameBg})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          >
            <div style={{ position: "relative" }}>
              <img
                style={{ position: "absolute", top: "-300%", left: "-70%" }}
                src={beatFlow0}
                alt="loadingImg0"
              ></img>
              <img
                style={{ position: "absolute", top: "-280%", left: "-68%" }}
                src={beatFlow1}
                alt="loadingImg1"
              ></img>
              <p style={{ color: "white", fontSize: "100px" }}>Loading...</p>
            </div>
          </div>
        );
      default:
        return <>Error</>;
    }
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          backgroundImage: `url(${IngameBg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          width: "100vw",
          height: "100vh",
          backgroundClip: "padding-box",
          paddingTop: "5%",
          overflowX: "hidden"
        }}
      >
        <GameExitBtn roomCode={gameData.code} />
        <SongSheet railRefs={railRefs} myPosition={myPosition}></SongSheet>
        <div style={{ display: "inline", position: "relative" }}>
          {/* <WebCamFrame myColor={myColor} roomCode={gameData.code} style={{visibility:"hidden"}} /> */}
          {/* <SecondScore
                gameData={gameData}
                railRefs={railRefs}
                myPosition={myPosition}
              /> */}
          <WebCam
            players={gameData.players}
            roomCode={gameData.code}
            gameData={gameData}
            railRefs={railRefs}
            myPosition={myPosition}
          />
        </div>
      </div>
      {ShowModal(modalStatus)}
      {isGameReady && <GameControllerTuto {...startGameProps} myPosition={myPosition} />}
    </>
  );
};

export default Ingame;

const VerticalRail = styled.div`
  display: block;
  position: relative;
  top: ${({ top }) => `calc(${top} + 11%)`};
  width: 100%;
  height: 3%;
  border: 20px;
  background: ${({ color }) => color};
  box-shadow: 3px 3px 3px rgba(255, 255, 255, 0.3);
`;

const Indicator = styled.div`
  position: absolute;
  top: 0%;
  height: 100%;
  width: 5px;
  margin-left: 7%;
  background-color: white;
`;

const JudgeBox = styled.div`
  position: absolute;
  top: 0%;
  height: 100%;
  width: 20px;
  background-color: ${({ isactive }) =>
    isactive ? "yellow" : "rgba(0,0,0,1)"};
  box-shadow: ${({ isactive }) => (isactive ? "0 0 10px 5px yellow" : "none")};
  margin-left: 2%;
  transition: ${({ isactive }) =>
    isactive
      ? "none"
      : "background-color 0.5s ease-out, box-shadow 0.5s ease-out"};
`;

const JudgeTuto = (key, time, instrument, myPosition, myRailRef) => {
  let result = "ignore";

  const notes = document.querySelectorAll(
    `.Note[data-instrument="${instrument}"]`
  );
  let closestNote = null;
  let minIndex = Infinity;

  notes.forEach((note) => {
    const index = parseInt(note.getAttribute("data-index"), 10);
    if (!isNaN(index) && index < minIndex) {
      minIndex = index;
      closestNote = note;
    }
  });

  if (!closestNote) {
    return result;
  }

  const noteTime = parseInt(closestNote.getAttribute("data-time"), 10);

  const timeDiff = noteTime - time;

  let currentMotion = Parser(key);

  if (
    timeDiff >= -100 &&
    timeDiff <= 450 &&
    closestNote.getAttribute("data-motion") === currentMotion
  ) {
    result = "hit";
    sessionStorage.setItem("instrument", instrument);
    sessionStorage.setItem("motionType", currentMotion);


    TriggerMyHitEffect(`player${0}`, myRailRef, closestNote);

    return true;
  }

  if (timeDiff < -100) {
    closestNote.setAttribute("data-index", minIndex + 100);
    return false;
  }
};