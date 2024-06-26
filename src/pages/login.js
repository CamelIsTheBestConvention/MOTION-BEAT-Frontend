import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckLoginValidate } from "../utils/checkValidate";
import { KakaoLoginButton } from "../apis/kko";
import { GoogleLoginButton } from "../apis/ggl";
import socket from "../server/server.js";
import { login } from "../server/socketEvents.js";
import BackArrow from "../img/backArrow.png";
import emailIcon from "../img/emailIcon.png";
import pwIcon from "../img/pwIcon.png";
import MoveBg from "../components/common/atomic/movebg.js";
import "../styles/login.scss";
// import { useAudio } from "../components/common/useSoundManager.js";

const Login = () => {
  const backendUrl = process.env.REACT_APP_BACK_API_URL;
  const emailRef = useRef(null); // 이메일
  const pwRef = useRef(null); // 비번
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // const { playBGM } = useAudio(); // 음악 재생
  /* Navi */
  const navigate = useNavigate();
  /* Popup */
  const [popupClosedByUser, setPopupClosedByUser] = useState(false);
  // const audioRef = useRef(null);

  // useEffect(() => {
  //   playBGM('loginBGM', { loop: true, volume: 1 });
  // }, [playBGM]);

  // 노래 재생
  // useEffect(() => {
  //   const handlePlay = () => {
  //     const audio = audioRef.current;
  //     if (audio) {
  //       audio.play().catch((error) => {
  //         console.error("Error playing audio:", error);
  //       });
  //     }
  //   };

  //   const handleUserInteraction = () => {
  //     handlePlay();
  //     document.removeEventListener("click", handleUserInteraction);
  //     document.removeEventListener("keydown", handleUserInteraction);
  //   };

  //   document.addEventListener("click", handleUserInteraction);
  //   document.addEventListener("keydown", handleUserInteraction);

  //   return () => {
  //     document.removeEventListener("click", handleUserInteraction);
  //     document.removeEventListener("keydown", handleUserInteraction);
  //   };
  // }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsLoading(true);

    /* input 값 추출 */
    const formData = {
      email: emailRef.current.value.toLowerCase(),
      pw: pwRef.current.value,
    };

    /* 값 유효성 검사 */
    const validationErrors = await CheckLoginValidate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // console.log("유효성 에러 : ");
      // console.log(validationErrors);
      return;
    }

    try {
      // console.log("Try to enter : " + backendUrl);
      const response = await axios.post(
        `${backendUrl}/api/users/login`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      sessionStorage.setItem("userToken", response.data.jwtoken); // 로그인 성공 시 토큰 저장
      sessionStorage.setItem("userId", response.data.userId); // 사용자 ID 저장
      sessionStorage.setItem("nickname", response.data.nickname); // 사용자 ID 저장
      sessionStorage.setItem("socketId", socket.id); // 소켓 id 저장
      // alert('로그인에 성공하였습니다.');

      const nickname = sessionStorage.getItem("nickname");

      login(nickname);
      // socket.emit("login", nickname, (res) => {
      //   if (res?.ok) {
      //     console.log(nickname);
      //   }
      // });

      navigate("/main");
    } catch (error) {
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        const message =
          error.response.data?.message ||
          "없는 계정이거나 비밀번호가 틀렸습니다. 다시 시도해주세요.";
        alert(message);
      } else {
        alert("네트워크 오류가 발생했습니다.");
      }
    }
  };

  const handleForgot = () => {
    navigate("/forgotPw");
  };
  const handleSignup = () => {
    navigate("/signup");
  };

  return (
    <>
      {/* <h1 className="login-title">MOTION BEAT</h1> */}
      <MoveBg />
      {/* <audio ref={audioRef} src={"/bgm/littleChalie.mp3"} loop /> */}
      <div className="loginWrapper">
        <div className="loginForm">
          <div className="loginHeader">
            <div className="loginBackArrow">
              <img src={BackArrow} alt="뒤로가기" />
            </div>
            <div className="loginTitle">LOGIN</div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="formInputWrapper">
              <p>ID</p>
              <div className="inputBox">
                <img src={emailIcon} alt="이메일아이콘" />
                <input
                  type="text"
                  placeholder="motion@gmail.com"
                  ref={emailRef}
                />
              </div>
              {errors.email && (
                <p style={{ color: "red" }}>{errors.email[0]}</p>
              )}
            </div>
            <div className="formInputWrapper">
              <p>Password</p>
              <div className="inputBox">
                <img src={pwIcon} alt="비번아이콘" />
                <input type="password" placeholder="********" ref={pwRef} />
              </div>
              {errors.pw && <p style={{ color: "red" }}>{errors.pw[0]}</p>}
            </div>
            <div className="subFuncBox">
              <div>
                <input type="checkbox" />
                <p>아이디 저장</p>
              </div>
              <p onClick={handleForgot}>비밀번호 찾기</p>
            </div>
            <div className="loginBtnBox">
              <button type="submit">LOGIN</button>
            </div>
            <div className="socialLogin">
              <KakaoLoginButton setEvent={setPopupClosedByUser}>
                Login With Kakao
              </KakaoLoginButton>
              {/* <div className="dummy"></div> */}
              <GoogleLoginButton setEvent={setPopupClosedByUser}>
                Login with Google
              </GoogleLoginButton>
            </div>
            {/* {popupClosedByUser && <p>로그인 창이 닫혔습니다. 다시 시도해 주세요.</p>} */}
            <div className="signupBox">
              <p onClick={handleSignup}>
                아직 회원이 아니신가요?<span>회원가입</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default Login;
