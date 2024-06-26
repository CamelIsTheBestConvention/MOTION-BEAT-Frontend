import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "../../server/server.js";
import { useNavigate } from "react-router-dom";
import MainHeader from "../common/atomic/main/mainHeader.js";
import randomPlay from "../../img/randomPlay.png";
import friendPlay from "../../img/friendPlay.png";
import { useAudio } from "../../components/common/useSoundManager.js";

const Playtype = () => {
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACK_API_URL;
  const [code, setCode] = useState(""); // 방 코드 받아올 때 사용
  // const [showModal, setShowModal] = useState(false); // 친구와 함께하기 클릭 시 모달창
  const myNickname = sessionStorage.getItem("nickname");
  const [playFriends, setPlayFriends] = useState(true);
  const [isRoomAvailable, setIsRoomAvaliable] = useState(true); // for TEST
  const { playNormalSFX } = useAudio();

  const handleClickSound = () => {
    playNormalSFX("start.mp3", { volume: 1 });
  };

  /* 랜덤 룸으로 이동 */
  const handleMatchingClick = async () => {
    handleClickSound();
    try {
      const response = await axios.post(
        `${backendUrl}/api/rooms/match`,
        {
          type: "match",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
            UserId: sessionStorage.getItem("userId"),
            Nickname: sessionStorage.getItem("nickname"),
          },
        }
      );

      const joinRoomData = {
        nickname: myNickname,
        code: response.data.code,
      };

      socket.emit(`joinRoom`, joinRoomData, (res) => {
        // console.log("joinRoom res", res);
      });

      navigate("/room", { state: { roomData: response.data } });
    } catch (error) {
      console.error("Error random room", error);
    }
  };

  const handlePlayFriendsClick = () => {
    setPlayFriends(!playFriends);
  };

  const handleDevClick = () => {
    setIsRoomAvaliable(!isRoomAvailable);
  };

  // 방을 생성할 때
  const inRoom = async () => {
    handleClickSound();
    try {
      const response = await axios.post(
        `${backendUrl}/api/rooms/create`,
        {
          type: "codeGame",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
            UserId: sessionStorage.getItem("userId"),
            Nickname: sessionStorage.getItem("nickname"),
          },
        }
      );

      // console.log("방 들어옴");

      const joinRoomData = {
        nickname: myNickname,
        code: response.data.code,
      };

      socket.emit("joinRoom", joinRoomData, (res) => {
        // console.log("joinRoom res", res);
      });

      navigate("/room", { state: { roomData: response.data } });
    } catch (error) {
      console.error("Error in Room:", error);
    }
  };

  // 방에 참가할 때
  const goRoom = async (e) => {
    e.preventDefault();
    handleClickSound();
    try {
      const response = await axios.patch(
        `${backendUrl}/api/rooms/join/${code}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
            UserId: sessionStorage.getItem("userId"),
            Nickname: sessionStorage.getItem("nickname"),
          },
        }
      );

      const joinRoomData = {
        nickname: myNickname,
        code: response.data.code,
      };

      socket.emit("joinRoom", joinRoomData, (res) => {
        // console.log("joinRoom res", res);
      });

      navigate("/room", { state: { roomData: response.data } });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data?.message;
        alert(message);
      } else {
        console.error("Error go Room:", error);
      }
    }
  };

  return (
    <>
      <MainHeader roomName="PLAY" />
      {playFriends ? (
        <div className="gameTypeBox">
          <div className="gameType" onClick={handleMatchingClick}>
            <h1>랜덤 매칭</h1>
            <div>
              <img src={randomPlay} alt="랜덤 매칭" />
            </div>
          </div>
          <div className="gameType" onClick={handlePlayFriendsClick}>
            <h1>친구와 함께하기</h1>
            <div>
              <img src={friendPlay} alt="친구와 함께하기" />
            </div>
          </div>
        </div>
      ) : (
        <div className="gameTypeBox">
          <div className="gameType">
            <h1>방 만들기</h1>
            <button className="btnbtn" onClick={inRoom}>
              생성
            </button>
          </div>
          <div className="roomType">
            <h1>방 참여하기</h1>
            <form onSubmit={goRoom}>
              <div className="joinCode">
                <input
                  type="text"
                  placeholder="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <button className="btnbtn" type="submit">
                입장
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
export default Playtype;
