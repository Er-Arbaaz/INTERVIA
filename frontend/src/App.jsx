import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import "./App.css";

const API = "http://127.0.0.1:8000";

/* =========================================================
   AUTHENTICATION VIEW
========================================================= */

function AuthView({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    try {
      setLoading(true);

      let response;

      if (mode === "signup") {
        response = await axios.post(`${API}/auth/signup`, {
          name: name.trim(),
          email: email.trim(),
          password,
        });
      } else {
        response = await axios.post(`${API}/auth/login`, {
          email: email.trim(),
          password,
        });
      }

      const user = {
        id: response.data?.id,
        name: response.data?.name,
        email: response.data?.email,
      };

      localStorage.setItem("authUser", JSON.stringify(user));

      onLoginSuccess(user);
    } catch (error) {
      console.error("Authentication error:", error);

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map((item) => item?.msg || "Validation error")
            .join(", ")
        );
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else if (error.response) {
        setMessage(
          `Authentication failed. Server returned ${error.response.status}.`
        );
      } else {
        setMessage("Unable to connect to the FastAPI backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-content">
      <section className="hero-section">
        <div className="hero-badge">
          <span className="pulse-dot"></span>
          AI-POWERED INTERVIEW PLATFORM
        </div>

        <h1 className="hero-title">
          Welcome to Your
          <span>{" "}AI Interview.</span>
        </h1>

        <p className="hero-description">
          Sign in to your interview workspace or create
          a new account to begin your technical
          assessment journey.
        </p>
      </section>

      <section className="registration-card">
        <div className="card-top">
          <div>
            <div className="step-number">01</div>

            <div className="step-label">
              {mode === "login"
                ? "SECURE LOGIN"
                : "CREATE ACCOUNT"}
            </div>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            SYSTEM READY
          </div>
        </div>

        <h2>
          {mode === "login"
            ? "Welcome Back"
            : "Create Your Account"}
        </h2>

        <p className="card-description">
          {mode === "login"
            ? "Sign in to continue to your AI-powered interview workspace."
            : "Create your account to access personalized AI mock interviews."}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="auth-name">FULL NAME</label>

              <div className="input-wrapper">
                <span className="input-icon">◇</span>

                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  spellCheck="false"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">EMAIL ADDRESS</label>

            <div className="input-wrapper">
              <span className="input-icon">@</span>

              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                spellCheck="false"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">PASSWORD</label>

            <div className="input-wrapper">
              <span className="input-icon">◈</span>

              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                disabled={loading}
              />
            </div>
          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "SIGNING IN..."
                : "CREATING ACCOUNT..."
              : mode === "login"
              ? "LOGIN →"
              : "CREATE ACCOUNT →"}
          </button>
        </form>

        {message && (
          <div className="message-box">
            {message}
          </div>
        )}

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              <span>Don't have an account?</span>

              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMessage("");
                  setMode("signup");
                }}
                disabled={loading}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>

              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMessage("");
                  setMode("login");
                }}
                disabled={loading}
              >
                Login
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   MAIN APPLICATION
========================================================= */

function App() {
  /* =======================================================
     REFS
  ======================================================= */

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const answerRef = useRef("");
  const submitAnswerRef = useRef(null);

  const isSubmittingRef = useRef(false);
  const interviewCompletedRef = useRef(false);

  const suppressRecognitionAutoSubmitRef = useRef(false);

  const speechSilenceTimeoutRef = useRef(null);
  const speechStartTimeoutRef = useRef(null);

  const recognitionSessionIdRef = useRef(0);
  const questionTimerRef = useRef(null);

  /* =======================================================
     AUTH STATE
  ======================================================= */

  const [authUser, setAuthUser] = useState(() => {
    const savedUser = localStorage.getItem("authUser");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("authUser");
      return null;
    }
  });

  /* =======================================================
     CANDIDATE DATA
  ======================================================= */

  const [name, setName] = useState(
    localStorage.getItem("candidateName") || ""
  );

  const [skill, setSkill] = useState(
    localStorage.getItem("candidateSkill") || ""
  );

  const [candidateId, setCandidateId] = useState(
    localStorage.getItem("candidateId") || ""
  );

  /* =======================================================
     RESUME INTELLIGENCE DATA
  ======================================================= */

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeName, setResumeName] = useState("");

  /* =======================================================
     INTERVIEW DATA
  ======================================================= */

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState([]);

  const [sessionId, setSessionId] = useState(
    localStorage.getItem("sessionId") || ""
  );

  /* =======================================================
     UI STATE
  ======================================================= */

  const [page, setPage] = useState("home");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [interviewStarted, setInterviewStarted] =
    useState(false);

  /*
   * IMPORTANT:
   *
   * This state is used only for rendering.
   * The ref is still used by asynchronous callbacks.
   *
   * This fixes:
   * "Cannot access refs during render"
   */
  const [interviewCompleted, setInterviewCompleted] =
    useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const TOTAL_INTERVIEW_TIME_SECONDS = 20 * 60;
  const QUESTION_TIME_SECONDS = 60;

  const [timeLeft, setTimeLeft] = useState(TOTAL_INTERVIEW_TIME_SECONDS);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_SECONDS);

  /* =======================================================
     INTERVIEW COMPLETION HELPER
  ======================================================= */

  const markInterviewCompleted = useCallback((value) => {
    interviewCompletedRef.current = value;
    setInterviewCompleted(value);
  }, []);

  /* =======================================================
     SAVE LOCAL STORAGE DATA
  ======================================================= */

  useEffect(() => {
    if (name) {
      localStorage.setItem("candidateName", name);
    }
  }, [name]);

  useEffect(() => {
    if (skill) {
      localStorage.setItem("candidateSkill", skill);
    }
  }, [skill]);

  useEffect(() => {
    if (candidateId) {
      localStorage.setItem(
        "candidateId",
        String(candidateId)
      );
    }
  }, [candidateId]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(
        "sessionId",
        String(sessionId)
      );
    }
  }, [sessionId]);

  /* =======================================================
     FORMAT TIMER
  ======================================================= */

  const formatTime = useCallback((seconds) => {
    const safeSeconds = Math.max(0, seconds);

    const minutes = Math.floor(
      safeSeconds / 60
    );

    const remainingSeconds =
      safeSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  }, []);

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (
      !interviewStarted ||
      timeLeft <= 0
    ) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          const submit = submitAnswerRef.current;

          if (
            submit &&
            !interviewCompletedRef.current &&
            !isSubmittingRef.current
          ) {
            setMessage(
              "⏱️ The 20-minute interview limit has been reached. Finalizing the interview..."
            );
            suppressRecognitionAutoSubmitRef.current = true;
            submit({
              preventDefault: () => {},
              timedOut: true,
              overallTimedOut: true,
            });
          } else {
            setInterviewStarted(false);
          }

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    interviewStarted,
    timeLeft,
  ]);

  /* =======================================================
     QUESTION TEXT
  ======================================================= */

  const getQuestionText = useCallback(
    (question) => {
      if (typeof question === "string") {
        return question;
      }

      if (question?.question) {
        return question.question;
      }

      if (question?.question_text) {
        return question.question_text;
      }

      return "Question unavailable";
    },
    []
  );

  /* =======================================================
     PER-QUESTION 60-SECOND TIMER
  ======================================================= */

  useEffect(() => {
    if (
      !interviewStarted ||
      page !== "interview" ||
      interviewCompletedRef.current ||
      questions.length === 0 ||
      !questions[currentQuestion]
    ) {
      return undefined;
    }

    setQuestionTimeLeft(QUESTION_TIME_SECONDS);

    const timer = window.setInterval(() => {
      setQuestionTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);

          if (
            !interviewCompletedRef.current &&
            !isSubmittingRef.current &&
            interviewStarted
          ) {
            const submit = submitAnswerRef.current;
            if (submit) {
              setMessage(
                "⏱️ 60 seconds are over. Submitting this question..."
              );
              suppressRecognitionAutoSubmitRef.current = true;
              submit({
                preventDefault: () => {},
                timedOut: true,
              });
            }
          }

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    interviewStarted,
    page,
    currentQuestion,
    questions,
  ]);

  /* =======================================================
     CLEAR SPEECH TIMEOUTS
  ======================================================= */

  const clearSpeechTimeouts =
    useCallback(() => {
      if (
        speechSilenceTimeoutRef.current
      ) {
        window.clearTimeout(
          speechSilenceTimeoutRef.current
        );

        speechSilenceTimeoutRef.current =
          null;
      }

      if (
        speechStartTimeoutRef.current
      ) {
        window.clearTimeout(
          speechStartTimeoutRef.current
        );

        speechStartTimeoutRef.current =
          null;
      }
    }, []);

  /* =======================================================
     STOP SPEECH RECOGNITION
  ======================================================= */

  const stopListening = useCallback(() => {
    clearSpeechTimeouts();

    recognitionSessionIdRef.current += 1;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already have stopped.
      }

      recognitionRef.current = null;
    }

    setIsListening(false);
  }, [clearSpeechTimeouts]);

  /* =======================================================
     STOP CAMERA
  ======================================================= */

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    setCameraOn(false);
  }, []);

  /* =======================================================
     START CAMERA
  ======================================================= */

  const startCamera = useCallback(async () => {
    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      setMessage(
        "Camera access is not supported by this browser."
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: false,
          }
        );

      streamRef.current = stream;

      setCameraOn(true);
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setCameraOn(false);

      setMessage(
        "Camera permission is required for the live interview."
      );
    }
  }, []);

  /* =======================================================
     CONNECT STREAM TO VIDEO
  ======================================================= */

  useEffect(() => {
    if (!cameraOn) {
      return;
    }

    if (
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;
    }
  }, [cameraOn]);

  /* =======================================================
     SPEECH RECOGNITION
  ======================================================= */

  const startListening = useCallback(() => {
    if (
      interviewCompletedRef.current ||
      !interviewStarted
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);

      setMessage(
        "Speech recognition is not supported. Please use Google Chrome."
      );

      return;
    }

    if (
      speechSilenceTimeoutRef.current
    ) {
      window.clearTimeout(
        speechSilenceTimeoutRef.current
      );

      speechSilenceTimeoutRef.current =
        null;
    }

    if (recognitionRef.current) {
      suppressRecognitionAutoSubmitRef.current =
        true;

      try {
        recognitionRef.current.abort();
      } catch {
        // Already stopped.
      }

      recognitionRef.current = null;
    }

    recognitionSessionIdRef.current += 1;

    const thisRecognitionSession =
      recognitionSessionIdRef.current;

    suppressRecognitionAutoSubmitRef.current =
      false;

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let hasReceivedSpeech = false;

    recognition.onstart = () => {
      if (
        thisRecognitionSession !==
        recognitionSessionIdRef.current
      ) {
        try {
          recognition.abort();
        } catch {
          // Already stopped.
        }

        return;
      }

      if (
        interviewCompletedRef.current ||
        !interviewStarted
      ) {
        try {
          recognition.abort();
        } catch {
          // Already stopped.
        }

        return;
      }

      setIsListening(true);

      setMessage(
        "🎙️ Listening... Speak your answer."
      );
    };

    recognition.onresult = (event) => {
      if (
        thisRecognitionSession !==
        recognitionSessionIdRef.current
      ) {
        return;
      }

      if (
        interviewCompletedRef.current ||
        isSubmittingRef.current
      ) {
        return;
      }

      let interimTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i]?.[0]
            ?.transcript || "";

        if (
          event.results[i].isFinal
        ) {
          finalTranscript +=
            transcript + " ";

          hasReceivedSpeech = true;
        } else {
          interimTranscript +=
            transcript;
        }
      }

      const combined = (
        finalTranscript +
        interimTranscript
      ).trim();

      if (combined) {
        hasReceivedSpeech = true;
      }

      answerRef.current = combined;
      setAnswer(combined);

      /*
       * Automatic submission after silence.
       */
      if (
        finalTranscript.trim() &&
        !isSubmittingRef.current
      ) {
        if (
          speechSilenceTimeoutRef.current
        ) {
          window.clearTimeout(
            speechSilenceTimeoutRef.current
          );
        }

        speechSilenceTimeoutRef.current =
          window.setTimeout(() => {
            speechSilenceTimeoutRef.current =
              null;

            if (
              interviewCompletedRef.current ||
              isSubmittingRef.current ||
              !interviewStarted ||
              thisRecognitionSession !==
                recognitionSessionIdRef.current
            ) {
              return;
            }

            const capturedText =
              finalTranscript.trim();

            if (!capturedText) {
              return;
            }

            answerRef.current =
              capturedText;

            setAnswer(capturedText);

            setMessage(
              "✅ Voice answer captured. AI is evaluating..."
            );

            suppressRecognitionAutoSubmitRef.current =
              true;

            try {
              recognition.stop();
            } catch {
              // Already stopped.
            }

            if (
              recognitionRef.current ===
              recognition
            ) {
              recognitionRef.current =
                null;
            }

            setIsListening(false);

            submitAnswerRef.current?.({
              preventDefault: () => {},
            });
          }, 1400);
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event
      );

      if (
        thisRecognitionSession !==
        recognitionSessionIdRef.current
      ) {
        return;
      }

      if (
        event.error === "not-allowed"
      ) {
        setMessage(
          "Microphone permission denied. Please allow microphone access."
        );

        setIsListening(false);
        return;
      }

      if (
        event.error === "aborted"
      ) {
        return;
      }

      if (
        event.error === "no-speech"
      ) {
        if (hasReceivedSpeech) {
          return;
        }

        setMessage(
          "No speech detected. Please speak your answer."
        );

        return;
      }

      setMessage(
        "Voice recognition error. Please try again."
      );

      setIsListening(false);
    };

    recognition.onend = () => {
      if (
        thisRecognitionSession !==
        recognitionSessionIdRef.current
      ) {
        return;
      }

      if (
        recognitionRef.current ===
        recognition
      ) {
        recognitionRef.current =
          null;
      }

      setIsListening(false);

      if (
        suppressRecognitionAutoSubmitRef.current
      ) {
        suppressRecognitionAutoSubmitRef.current =
          false;

        return;
      }

      if (
        interviewCompletedRef.current ||
        isSubmittingRef.current ||
        !interviewStarted
      ) {
        return;
      }

      const capturedAnswer =
        finalTranscript.trim();

      if (capturedAnswer) {
        answerRef.current =
          capturedAnswer;

        setAnswer(capturedAnswer);

        if (
          speechSilenceTimeoutRef.current
        ) {
          window.clearTimeout(
            speechSilenceTimeoutRef.current
          );

          speechSilenceTimeoutRef.current =
            null;
        }

        setMessage(
          "✅ Voice answer captured. AI is evaluating..."
        );

        speechSilenceTimeoutRef.current =
          window.setTimeout(() => {
            speechSilenceTimeoutRef.current =
              null;

            if (
              interviewCompletedRef.current ||
              isSubmittingRef.current ||
              !interviewStarted ||
              !submitAnswerRef.current
            ) {
              return;
            }

            suppressRecognitionAutoSubmitRef.current =
              true;

            submitAnswerRef.current({
              preventDefault: () => {},
            });
          }, 250);

        return;
      }

      if (!hasReceivedSpeech) {
        setMessage(
          "No speech detected. Please speak your answer."
        );
      }
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Unable to start speech recognition:",
        error
      );

      if (
        recognitionRef.current ===
        recognition
      ) {
        recognitionRef.current =
          null;
      }

      setIsListening(false);

      setMessage(
        "Unable to start microphone. Please try again."
      );
    }
  }, [interviewStarted]);

  /* =======================================================
     SPEAK QUESTION
  ======================================================= */

  const speakQuestion = useCallback(
    (text) => {
      if (
        !text ||
        !text.trim()
      ) {
        return;
      }

      if (
        interviewCompletedRef.current ||
        !interviewStarted
      ) {
        return;
      }

      if (
        !("speechSynthesis" in window)
      ) {
        setMessage(
          "Voice playback is not supported in this browser. Please use Google Chrome."
        );

        return;
      }

      clearSpeechTimeouts();

      if (recognitionRef.current) {
        suppressRecognitionAutoSubmitRef.current =
          true;

        recognitionSessionIdRef.current += 1;

        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped.
        }

        recognitionRef.current =
          null;

        setIsListening(false);
      }

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          text.trim()
        );

      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsListening(false);

        setMessage(
          "🔊 AI Interviewer is speaking..."
        );
      };

      utterance.onend = () => {
        if (
          !interviewStarted ||
          interviewCompletedRef.current
        ) {
          return;
        }

        setMessage(
          "🎙️ Your turn. Speak your answer."
        );

        clearSpeechTimeouts();

        speechStartTimeoutRef.current =
          window.setTimeout(() => {
            speechStartTimeoutRef.current =
              null;

            if (
              !interviewStarted ||
              interviewCompletedRef.current ||
              isSubmittingRef.current
            ) {
              return;
            }

            startListening();
          }, 700);
      };

      utterance.onerror = (event) => {
        console.error(
          "Speech synthesis error:",
          event
        );

        setMessage(
          "AI voice playback failed. You can still read the question and answer manually."
        );
      };

      window.speechSynthesis.speak(
        utterance
      );
    },
    [
      interviewStarted,
      startListening,
      clearSpeechTimeouts,
    ]
  );

  /* =======================================================
     AUTO SPEAK CURRENT QUESTION
  ======================================================= */

  useEffect(() => {
    if (
      page !== "interview" ||
      !interviewStarted ||
      interviewCompletedRef.current ||
      questions.length === 0 ||
      !questions[currentQuestion]
    ) {
      return undefined;
    }

    const questionText =
      getQuestionText(
        questions[currentQuestion]
      );

    if (
      !questionText ||
      questionText ===
        "Question unavailable"
    ) {
      return undefined;
    }

    let cancelled = false;

    const timer =
      window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        speakQuestion(questionText);
      }, 500);

    return () => {
      cancelled = true;

      window.clearTimeout(timer);

      clearSpeechTimeouts();

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      if (recognitionRef.current) {
        suppressRecognitionAutoSubmitRef.current =
          true;

        recognitionSessionIdRef.current += 1;

        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped.
        }

        recognitionRef.current =
          null;
      }

      setIsListening(false);
    };
  }, [
    page,
    interviewStarted,
    currentQuestion,
    questions,
    getQuestionText,
    speakQuestion,
    clearSpeechTimeouts,
  ]);

  /* =======================================================
     CLEANUP ON COMPONENT UNMOUNT
  ======================================================= */

  useEffect(() => {
    return () => {
      suppressRecognitionAutoSubmitRef.current =
        true;

      interviewCompletedRef.current =
        true;

      clearSpeechTimeouts();

      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped.
        }

        recognitionRef.current =
          null;
      }

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }
    };
  }, [clearSpeechTimeouts]);

  /* =======================================================
     LOGIN SUCCESS
  ======================================================= */

  const handleLoginSuccess = (user) => {
    setAuthUser(user);

    if (user?.name) {
      setName(user.name);
    }

    interviewCompletedRef.current =
      false;

    setInterviewCompleted(false);

    suppressRecognitionAutoSubmitRef.current =
      false;

    isSubmittingRef.current = false;

    setMessage("");
    setPage("home");
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    suppressRecognitionAutoSubmitRef.current =
      true;

    interviewCompletedRef.current =
      true;

    setInterviewCompleted(true);

    clearSpeechTimeouts();

    recognitionSessionIdRef.current += 1;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Already stopped.
      }

      recognitionRef.current =
        null;
    }

    stopListening();
    stopCamera();

    if (
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    localStorage.removeItem(
      "authUser"
    );

    setAuthUser(null);
    setMessage("");
    setPage("home");
  };

  /* =======================================================
     LOAD RESULTS
  ======================================================= */

  const loadResults = useCallback(
    async (
      candidate = candidateId,
      session = sessionId
    ) => {
      if (!candidate) {
        console.warn(
          "Cannot load results: candidate ID missing."
        );

        return false;
      }

      if (!session) {
        console.warn(
          "Cannot load results: session ID missing."
        );

        return false;
      }

      try {
        setLoading(true);

        const url =
          `${API}/interview/results/` +
          `${candidate}/${session}`;

        console.log(
          "Loading results from:",
          url
        );

        const response =
          await axios.get(url);

        console.log(
          "Results response:",
          response.data
        );

        if (
          Array.isArray(
            response.data
          )
        ) {
          setResults(
            response.data
          );
        } else if (
          Array.isArray(
            response.data?.results
          )
        ) {
          setResults(
            response.data.results
          );
        } else {
          setResults([]);
        }

        return true;
      } catch (error) {
        console.error(
          "Results error:",
          error
        );

        console.error(
          "Backend results response:",
          error.response?.data
        );

        const detail =
          error.response?.data?.detail;

        if (Array.isArray(detail)) {
          setMessage(
            detail
              .map(
                (item) =>
                  item?.msg ||
                  "Validation error"
              )
              .join(", ")
          );
        } else if (
          typeof detail === "string"
        ) {
          setMessage(detail);
        } else {
          setMessage(
            "Unable to load interview results."
          );
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [candidateId, sessionId]
  );

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleNavigate = (destination) => {
    setMessage("");

    if (
      destination !== "interview"
    ) {
      suppressRecognitionAutoSubmitRef.current =
        true;

      clearSpeechTimeouts();

      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped.
        }

        recognitionRef.current =
          null;
      }

      stopListening();

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      stopCamera();
    }

    if (
      destination === "results"
    ) {
      setPage("results");

      if (
        candidateId &&
        sessionId
      ) {
        loadResults(
          candidateId,
          sessionId
        );
      }

      return;
    }

    setPage(destination);
  };

  /* =======================================================
     REGISTER CANDIDATE
  ======================================================= */

  const registerCandidate =
    async (event) => {
      event.preventDefault();

      setMessage("");

      const cleanName =
        name.trim();

      const cleanSkill =
        skill.trim().toLowerCase();

      if (!cleanName) {
        setMessage(
          "Please enter your full name."
        );

        return;
      }

      if (!cleanSkill) {
        setMessage(
          "Please select your primary skill."
        );

        return;
      }

      const allowedSkills = [
        "python",
        "java",
        "javascript",
      ];

      if (
        !allowedSkills.includes(
          cleanSkill
        )
      ) {
        setMessage(
          "Skill must be Python, Java, or JavaScript."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await axios.post(
            `${API}/candidate`,
            {
              name: cleanName,
              skill: cleanSkill,
            }
          );

        console.log(
          "Candidate registration response:",
          response.data
        );

        const newCandidateId =
          response.data?.candidate_id ||
          response.data?.id ||
          response.data?.candidateId;

        if (!newCandidateId) {
          setMessage(
            "Candidate registered, but Candidate ID was not returned."
          );

          return;
        }

        clearSpeechTimeouts();

        suppressRecognitionAutoSubmitRef.current =
          true;

        interviewCompletedRef.current =
          false;

        setInterviewCompleted(false);

        isSubmittingRef.current =
          false;

        recognitionSessionIdRef.current += 1;

        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // Already stopped.
          }

          recognitionRef.current =
            null;
        }

        setName(cleanName);
        setSkill(cleanSkill);

        setCandidateId(
          String(newCandidateId)
        );

        setSessionId("");

        setResumeFile(null);
        setResumeUploaded(false);
        setResumeName("");

        setQuestions([]);
        setResults([]);
        setCurrentQuestion(0);
        setAnswer("");
        setInterviewStarted(false);

        answerRef.current = "";

        localStorage.setItem(
          "candidateName",
          cleanName
        );

        localStorage.setItem(
          "candidateSkill",
          cleanSkill
        );

        localStorage.setItem(
          "candidateId",
          String(newCandidateId)
        );

        localStorage.removeItem(
          "sessionId"
        );

        setMessage(
          `Registration successful. Candidate ID: ${newCandidateId}`
        );
      } catch (error) {
        console.error(
          "Registration error:",
          error
        );

        const detail =
          error.response?.data?.detail;

        if (Array.isArray(detail)) {
          setMessage(
            detail
              .map(
                (item) =>
                  item?.msg ||
                  "Validation error"
              )
              .join(", ")
          );
        } else if (
          typeof detail === "string"
        ) {
          setMessage(detail);
        } else if (
          error.response
        ) {
          setMessage(
            `Registration failed. Server returned ${error.response.status}.`
          );
        } else {
          setMessage(
            "Unable to connect to the FastAPI backend."
          );
        }
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     RESUME UPLOAD
  ======================================================= */

  const uploadResume = async () => {
    setMessage("");

    if (!candidateId) {
      setMessage(
        "Please initialize your candidate profile before uploading your resume."
      );

      return;
    }

    if (!resumeFile) {
      setMessage(
        "Please select a PDF or DOCX resume first."
      );

      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const fileName =
      resumeFile.name || "";

    const extension =
      fileName
        .substring(
          fileName.lastIndexOf(".")
        )
        .toLowerCase();

    if (
      !allowedTypes.includes(
        resumeFile.type
      ) &&
      ![".pdf", ".docx"].includes(
        extension
      )
    ) {
      setMessage(
        "Only PDF and DOCX resumes are supported."
      );

      return;
    }

    try {
      setResumeUploading(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        resumeFile
      );

      console.log(
        "Uploading resume for candidate:",
        candidateId
      );

      const response =
        await axios.post(
          `${API}/resume/upload/${candidateId}`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      console.log(
        "Resume upload response:",
        response.data
      );

      setResumeUploaded(true);

      setResumeName(
        response.data?.filename ||
          resumeFile.name
      );

      setMessage(
        "✅ Resume uploaded and analyzed successfully. Your next interview will use your resume."
      );
    } catch (error) {
      console.error(
        "Resume upload error:",
        error
      );

      console.error(
        "Backend resume response:",
        error.response?.data
      );

      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map(
              (item) =>
                item?.msg ||
                "Resume upload validation error"
            )
            .join(", ")
        );
      } else if (
        typeof detail === "string"
      ) {
        setMessage(detail);
      } else if (
        error.response
      ) {
        setMessage(
          `Resume upload failed. Server returned ${error.response.status}.`
        );
      } else {
        setMessage(
          "Unable to connect to the FastAPI backend."
        );
      }

      setResumeUploaded(false);
    } finally {
      setResumeUploading(false);
    }
  };

  /* =======================================================
     START INTERVIEW
  ======================================================= */

  const startInterview = async () => {
    setMessage("");

    if (!candidateId) {
      setMessage(
        "Please initialize your candidate profile first."
      );

      setPage("home");

      return;
    }

    if (!skill) {
      setMessage(
        "Please select your primary skill first."
      );

      setPage("home");

      return;
    }

    try {
      setLoading(true);

      clearSpeechTimeouts();

      interviewCompletedRef.current =
        false;

      setInterviewCompleted(false);

      suppressRecognitionAutoSubmitRef.current =
        true;

      isSubmittingRef.current =
        false;

      answerRef.current = "";

      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped.
        }

        recognitionRef.current =
          null;
      }

      setIsListening(false);

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      const response =
        await axios.get(
          `${API}/interview/start/${skill.toLowerCase()}`,
          {
            params: {
              candidate_id:
                candidateId,
            },
          }
        );

      console.log(
        "Interview response:",
        response.data
      );

      const receivedSessionId =
        response.data?.session_id ||
        response.data?.sessionId;

      if (!receivedSessionId) {
        console.error(
          "No session_id received:",
          response.data
        );

        setMessage(
          "Interview started, but no session ID was returned by the server."
        );

        return;
      }

      setSessionId(
        String(receivedSessionId)
      );

      let receivedQuestions = [];

      if (
        Array.isArray(
          response.data
        )
      ) {
        receivedQuestions =
          response.data;
      } else if (
        Array.isArray(
          response.data?.questions
        )
      ) {
        receivedQuestions =
          response.data.questions;
      } else if (
        response.data?.question
      ) {
        receivedQuestions = [
          response.data.question,
        ];
      }

      if (
        receivedQuestions.length === 0
      ) {
        setMessage(
          "No interview questions were received from the server."
        );

        return;
      }

      setQuestions(
        receivedQuestions
      );

      setCurrentQuestion(0);
      setAnswer("");

      setTimeLeft(TOTAL_INTERVIEW_TIME_SECONDS);
      setQuestionTimeLeft(QUESTION_TIME_SECONDS);

      suppressRecognitionAutoSubmitRef.current =
        false;

      setInterviewStarted(true);
      setPage("interview");
    } catch (error) {
      console.error(
        "Interview start error:",
        error
      );

      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map(
              (item) =>
                item?.msg ||
                "Validation error"
            )
            .join(", ")
        );
      } else if (
        typeof detail === "string"
      ) {
        setMessage(detail);
      } else {
        setMessage(
          "Unable to start interview. Check the FastAPI backend."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SUBMIT ANSWER
  ======================================================= */

  const submitAnswer = useCallback(async (event) => {
    event.preventDefault();

    const timedOut = event?.timedOut === true;
    if (
      interviewCompletedRef.current
    ) {
      console.warn(
        "Ignoring answer submission because interview is already completed."
      );

      return;
    }

    if (isSubmittingRef.current) {
      console.warn(
        "Ignoring duplicate answer submission already in progress."
      );

      return;
    }

    clearSpeechTimeouts();

    suppressRecognitionAutoSubmitRef.current =
      true;

    recognitionSessionIdRef.current += 1;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped.
      }

      recognitionRef.current =
        null;
    }

    setIsListening(false);

    if (
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    const currentAnswer =
      (
        answerRef.current ||
        answer
      ).trim();

    const currentQuestionText =
      getQuestionText(
        questions[currentQuestion]
      );

    if (!currentAnswer && !timedOut) {
      suppressRecognitionAutoSubmitRef.current =
        false;

      setMessage(
        "Please provide an answer before submitting."
      );

      return;
    }

    if (
      !candidateId ||
      !sessionId
    ) {
      suppressRecognitionAutoSubmitRef.current =
        false;

      setMessage(
        "Interview session information is missing."
      );

      return;
    }

    if (!currentQuestionText) {
      suppressRecognitionAutoSubmitRef.current =
        false;

      setMessage(
        "Question data is missing."
      );

      return;
    }

    isSubmittingRef.current =
      true;

    try {
      setLoading(true);

      setMessage(
        "🤖 AI is evaluating your answer..."
      );

      const response =
        await axios.post(
          `${API}/interview/answer`,
          null,
          {
            params: {
              question:
                currentQuestionText,
              answer:
                currentAnswer,
              candidate_id:
                candidateId,
              session_id:
                sessionId,
            },
          }
        );

      console.log(
        "Answer evaluation:",
        response.data
      );

      const data =
        response.data || {};

      answerRef.current = "";
      setAnswer("");

      /* ===================================================
         INTERVIEW COMPLETED
      =================================================== */

      if (
        data.interview_completed ===
        true
      ) {
        markInterviewCompleted(
          true
        );

        suppressRecognitionAutoSubmitRef.current =
          true;

        clearSpeechTimeouts();

        setInterviewStarted(false);

        if (questionTimerRef.current) {
          window.clearTimeout(questionTimerRef.current);
          questionTimerRef.current = null;
        }

        recognitionSessionIdRef.current += 1;

        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // Already stopped.
          }

          recognitionRef.current =
            null;
        }

        setIsListening(false);

        stopCamera();

        if (
          "speechSynthesis" in window
        ) {
          window.speechSynthesis.cancel();
        }

        setMessage(
          "🎉 Interview completed! Generating results..."
        );

        await loadResults(
          candidateId,
          sessionId
        );

        setPage("results");

        return;
      }

      /* ===================================================
         NEXT ADAPTIVE QUESTION
      =================================================== */

      if (
        data.next_question
      ) {
        suppressRecognitionAutoSubmitRef.current =
          false;

        const nextQuestion =
          data.next_question;

        setQuestions(
          (previousQuestions) => [
            ...previousQuestions,
            nextQuestion,
          ]
        );

        setCurrentQuestion(
          (previousIndex) =>
            previousIndex + 1
        );

        setMessage(
          "✅ Answer evaluated. Next question..."
        );

        return;
      }

      /* ===================================================
         FALLBACK — PRELOADED QUESTIONS
      =================================================== */

      if (
        currentQuestion < 19
      ) {
        suppressRecognitionAutoSubmitRef.current =
          false;

        setCurrentQuestion(
          (previousIndex) =>
            previousIndex + 1
        );

        setMessage(
          "✅ Answer evaluated. Next question..."
        );

        return;
      }

      /* ===================================================
         NO NEXT QUESTION
      =================================================== */

      markInterviewCompleted(
        true
      );

      suppressRecognitionAutoSubmitRef.current =
        true;

      clearSpeechTimeouts();

      setInterviewStarted(false);

      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped.
        }

        recognitionRef.current =
          null;
      }

      setIsListening(false);

      stopCamera();

      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      setMessage(
        "🎉 Interview completed! Generating results..."
      );

      await loadResults(
        candidateId,
        sessionId
      );

      setPage("results");
    } catch (error) {
      console.error(
        "Answer submission error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map(
              (item) =>
                item?.msg ||
                "Validation error"
            )
            .join(", ")
        );
      } else if (
        typeof detail === "string"
      ) {
        setMessage(detail);
      } else {
        setMessage(
          "Unable to submit answer. Please try again."
        );
      }

      suppressRecognitionAutoSubmitRef.current =
        false;
            } finally {
      isSubmittingRef.current =
        false;

      setLoading(false);
    }
  }, [
    answer,
    candidateId,
    clearSpeechTimeouts,
    currentQuestion,
    getQuestionText,
    loadResults,
    markInterviewCompleted,
    questions,
    sessionId,
    stopCamera,
  ]);
  /*
   * IMPORTANT FIX:
   *
   * NEVER do:
   *
   * submitAnswerRef.current = submitAnswer;
   *
   * directly inside the component render body.
   *
   * React's hooks lint rule treats that as a ref mutation
   * during render.
   *
   * Updating it inside useEffect is safe.
   */
  useEffect(() => {
    submitAnswerRef.current =
      submitAnswer;
  }, [submitAnswer]);

    /* =======================================================
     MANUAL VOICE ANSWER HANDLER
  ======================================================= */

  const handleVoiceAnswer = useCallback(() => {
    if (
      loading ||
      isListening ||
      interviewCompletedRef.current
    ) {
      return;
    }

    clearSpeechTimeouts();

    suppressRecognitionAutoSubmitRef.current =
      false;

    startListening();
  }, [
    loading,
    isListening,
    clearSpeechTimeouts,
    startListening,
  ]);

  /* =======================================================
     PERFORMANCE
  ======================================================= */

  const getPerformance = () => {
    if (
      !results ||
      results.length === 0
    ) {
      return {
        average: 0,
        score: 0,
        title: "No Results",
      };
    }

    const scores =
      results
        .map((item) =>
          Number(item?.score)
        )
        .filter(
          (score) =>
            Number.isFinite(score)
        );

    if (scores.length === 0) {
      return {
        average: 0,
        score: 0,
        title: "No Scores",
      };
    }

    const averageScore =
      scores.reduce(
        (total, score) =>
          total + score,
        0
      ) / scores.length;

    const percentage =
      Math.min(
        100,
        Math.max(
          0,
          averageScore * 10
        )
      );

    let title =
      "Needs Improvement";

    if (
      percentage >= 80
    ) {
      title = "Excellent";
    } else if (
      percentage >= 60
    ) {
      title = "Good";
    }

    return {
      average: Math.round(
        percentage
      ),
      score: Number(
        averageScore.toFixed(1)
      ),
      title,
    };
  };

  const performance =
    getPerformance();

  /* =======================================================
     HOME PAGE
  ======================================================= */

  const renderHome = () => {
    return (
      <main className="dashboard-page">

        <section className="dashboard-header">
          <div>
            <span className="eyebrow">
              AI INTERVIEW COMMAND CENTER
            </span>

            <h1>
              Welcome back,
              <span>
                {" "}
                {authUser?.name ||
                  name ||
                  "Candidate"}
              </span>
            </h1>

            <p>
              Your personalized AI interview
              workspace is ready. Prepare,
              practice, and measure your
              technical performance.
            </p>
          </div>

          <div className="dashboard-status">
            <span className="status-dot"></span>
            AI SYSTEM ONLINE
          </div>
        </section>

        <section className="dashboard-grid">

          <div className="dashboard-card profile-card">
            <div className="dashboard-card-header">
              <div>
                <span className="card-mini-label">
                  CANDIDATE PROFILE
                </span>

                <h2>
                  {name ||
                    authUser?.name ||
                    "Candidate"}
                </h2>
              </div>

              <div className="profile-avatar">
                {(
                  name ||
                  authUser?.name ||
                  "C"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>

            <div className="profile-details">
              <div>
                <span>
                  CANDIDATE ID
                </span>

                <strong>
                  {candidateId
                    ? `#${candidateId}`
                    : "Not initialized"}
                </strong>
              </div>

              <div>
                <span>
                  PRIMARY SKILL
                </span>

                <strong>
                  {skill
                    ? skill.toUpperCase()
                    : "Not selected"}
                </strong>
              </div>

              <div>
                <span>
                  ACCOUNT
                </span>

                <strong>
                  ACTIVE
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-card performance-card">
            <div className="dashboard-card-header">
              <div>
                <span className="card-mini-label">
                  PERFORMANCE
                </span>

                <h2>
                  {performance.average}%
                </h2>
              </div>

              <div className="performance-icon">
                ◈
              </div>
            </div>

            <div className="performance-line">
              <div
                style={{
                  width: `${performance.average}%`,
                }}
              ></div>
            </div>

            <p>
              {results.length > 0
                ? `${performance.title} — based on your latest interview results.`
                : "Complete your first interview to generate your performance score."}
            </p>
          </div>

          <div className="dashboard-card status-card">
            <div className="dashboard-card-header">
              <div>
                <span className="card-mini-label">
                  INTERVIEW STATUS
                </span>

                <h2>
                  {interviewStarted
                    ? "IN PROGRESS"
                    : results.length > 0
                    ? "COMPLETED"
                    : "READY"}
                </h2>
              </div>

              <div className="status-icon">
                {interviewStarted
                  ? "●"
                  : "✓"}
              </div>
            </div>

            <p>
              {interviewStarted
                ? "Your AI technical assessment is currently active."
                : results.length > 0
                ? "Your latest interview has been evaluated."
                : "Your AI interview environment is ready to begin."}
            </p>
          </div>
        </section>

        <section className="dashboard-resume-card">

          <div className="resume-card-header">
            <div>
              <span className="eyebrow">
                RESUME INTELLIGENCE
              </span>

              <h2>
                Personalize Your AI Interview
              </h2>

              <p>
                Upload your resume so the AI
                interviewer can generate
                questions based on your actual
                skills, projects, experience,
                and technologies.
              </p>
            </div>

            <div className="resume-status">
              <span
                className={
                  resumeUploaded
                    ? "status-dot active"
                    : "status-dot"
                }
              ></span>

              {resumeUploaded
                ? "RESUME ANALYZED"
                : "RESUME NOT UPLOADED"}
            </div>
          </div>

          <div className="resume-upload-area">

            <div className="resume-file-input">

              <label htmlFor="resume-upload">
                SELECT RESUME
              </label>

              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0] ||
                    null;

                  setResumeFile(file);

                  if (file) {
                    setResumeName(
                      file.name
                    );

                    setResumeUploaded(
                      false
                    );

                    setMessage("");
                  } else {
                    setResumeName("");
                  }
                }}
                disabled={
                  resumeUploading ||
                  !candidateId
                }
              />

              {resumeName && (
                <div className="resume-selected-file">
                  <span>📄</span>

                  <strong>
                    {resumeName}
                  </strong>
                </div>
              )}

            </div>

            <button
              type="button"
              className="primary-button"
              onClick={uploadResume}
              disabled={
                resumeUploading ||
                !resumeFile ||
                !candidateId
              }
            >
              {resumeUploading
                ? "ANALYZING RESUME..."
                : resumeUploaded
                ? "UPDATE RESUME →"
                : "UPLOAD & ANALYZE →"}
            </button>

          </div>

          <div className="resume-info-grid">

            <div>
              <span>
                SUPPORTED FORMAT
              </span>

              <strong>
                PDF / DOCX
              </strong>
            </div>

            <div>
              <span>
                AI PERSONALIZATION
              </span>

              <strong>
                {resumeUploaded
                  ? "ACTIVE"
                  : "READY"}
              </strong>
            </div>

            <div>
              <span>
                CANDIDATE
              </span>

              <strong>
                {candidateId
                  ? `#${candidateId}`
                  : "NOT INITIALIZED"}
              </strong>
            </div>

          </div>

        </section>

        <section className="dashboard-action">
          <div className="action-content">
            <div className="action-icon">
              AI
            </div>

            <div>
              <span className="eyebrow">
                NEXT ACTION
              </span>

              <h2>
                Ready to test your skills?
              </h2>

              <p>
                Start a personalized
                technical interview
                generated for your
                selected skill.
              </p>
            </div>
          </div>

          <div className="action-buttons">

            <button
              type="button"
              className="primary-button dashboard-start-button"
              onClick={startInterview}
              disabled={
                loading ||
                !candidateId ||
                !skill
              }
            >
              {loading
                ? "INITIALIZING AI..."
                : "START AI INTERVIEW →"}
            </button>

            {results.length > 0 && (
              <button
                type="button"
                className="secondary-button dashboard-results-button"
                onClick={async () => {
                  await loadResults(
                    candidateId,
                    sessionId
                  );

                  setPage("results");
                }}
              >
                VIEW RESULTS
              </button>
            )}

          </div>
        </section>

        {!candidateId && (
          <section className="dashboard-setup-card">

            <div className="setup-number">
              01
            </div>

            <div className="setup-content">

              <span className="card-mini-label">
                PROFILE INITIALIZATION REQUIRED
              </span>

              <h2>
                Configure your interview profile
              </h2>

              <p>
                Select your primary technical
                skill before starting your
                first AI interview.
              </p>

              <form
                className="dashboard-profile-form"
                onSubmit={
                  registerCandidate
                }
              >

                <div className="dashboard-input">
                  <label htmlFor="dashboard-name">
                    FULL NAME
                  </label>

                  <input
                    id="dashboard-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="Your full name"
                    disabled={loading}
                  />
                </div>

                <div className="dashboard-input">
                  <label htmlFor="dashboard-skill">
                    PRIMARY SKILL
                  </label>

                  <select
                    id="dashboard-skill"
                    value={skill}
                    onChange={(event) =>
                      setSkill(
                        event.target.value
                      )
                    }
                    disabled={loading}
                  >
                    <option value="">
                      Select skill
                    </option>

                    <option value="python">
                      Python
                    </option>

                    <option value="java">
                      Java
                    </option>

                    <option value="javascript">
                      JavaScript
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "INITIALIZING..."
                    : "INITIALIZE PROFILE →"}
                </button>

              </form>
            </div>
          </section>
        )}

        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <span className="eyebrow">
                ACTIVITY
              </span>

              <h2>
                Recent Interview Activity
              </h2>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={async () => {
                await loadResults(
                  candidateId,
                  sessionId
                );

                setPage("results");
              }}
            >
              View all →
            </button>
          </div>

          {results.length > 0 ? (
            <div className="activity-list">

              {results
                .slice(0, 3)
                .map(
                  (result, index) => (
                    <div
                      className="activity-item"
                      key={index}
                    >

                      <div className="activity-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="activity-question">
                        <span>
                          TECHNICAL QUESTION
                        </span>

                        <p>
                          {result.question ||
                            result.question_text ||
                            "Interview question"}
                        </p>
                      </div>

                      <div className="activity-score">
                        <strong>
                          {result.score ??
                            "--"}
                        </strong>

                        <span>
                          / 10
                        </span>
                      </div>

                    </div>
                  )
                )}

            </div>
          ) : (
            <div className="dashboard-empty">

              <div className="empty-icon">
                ◈
              </div>

              <h3>
                No interview activity yet
              </h3>

              <p>
                Your interview scores and
                evaluation history will
                appear here after you
                complete an AI interview.
              </p>

            </div>
          )}

        </section>

        <section className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">
              AI
            </div>

            <div>
              <h3>
                AI Evaluation
              </h3>

              <p>
                Intelligent analysis of
                your technical answers.
              </p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              01
            </div>

            <div>
              <h3>
                Skill Assessment
              </h3>

              <p>
                Questions generated around
                your selected skill.
              </p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              ↑
            </div>

            <div>
              <h3>
                Track Progress
              </h3>

              <p>
                Monitor your performance
                across interviews.
              </p>
            </div>
          </div>

        </section>

        {message && (
          <div className="message-box dashboard-message">
            {message}
          </div>
        )}

      </main>
    );
  };

  /* =======================================================
     INTERVIEW PAGE
  ======================================================= */

  const renderInterview = () => {
    if (!candidateId) {
      return (
        <main className="page-container">
          <div className="empty-card">

            <h2>
              No Candidate Registered
            </h2>

            <p>
              Please register before
              starting an interview.
            </p>

            <button
              type="button"
              className="primary-button small-button"
              onClick={() =>
                setPage("home")
              }
            >
              GO TO REGISTRATION
            </button>

          </div>
        </main>
      );
    }

    if (questions.length === 0) {
      return (
        <main className="page-container">

          <div className="interview-card">

            <div className="interview-header">

              <div>
                <span className="eyebrow">
                  AI INTERVIEW
                </span>

                <h1>
                  Ready for your interview?
                </h1>
              </div>

              <div className="candidate-pill">
                #{candidateId}
              </div>

            </div>

            <p>
              Your interview will be
              generated according to your
              selected technical skill.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={startInterview}
              disabled={loading}
            >
              {loading
                ? "INITIALIZING..."
                : "START INTERVIEW"}
            </button>

            {message && (
              <div className="message-box">
                {message}
              </div>
            )}

          </div>
        </main>
      );
    }

    const questionText =
      getQuestionText(
        questions[currentQuestion]
      );

    const progress =
      ((currentQuestion + 1) /
        20) *
      100;

    return (
      <main className="page-container">

        <div className="interview-card">

          <div className="interview-header">

            <div>
              <span className="eyebrow">
                LIVE AI INTERVIEW
              </span>

              <h1>
                Technical Assessment
              </h1>
            </div>

            <div className="interview-header-right">

              <div className="interview-timer">
                ⏱{" "}
                {formatTime(
                  timeLeft
                )}
              </div>

              <div className="interview-question-timer">
                ⏳ {questionTimeLeft}s / question
              </div>

              <div className="interview-progress">
                Question{" "}
                {Math.min(currentQuestion + 1, 20)}{" "}
                / 20
              </div>

            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="camera-section">

            <div className="camera-header">
              <span className="camera-status">
                {cameraOn
                  ? "● CAMERA LIVE"
                  : "● CAMERA OFF"}
              </span>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-preview"
            />

            <div className="camera-controls">

              {!cameraOn ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={startCamera}
                  disabled={loading}
                >
                  START CAMERA
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={stopCamera}
                >
                  STOP CAMERA
                </button>
              )}

            </div>

          </div>

          <div className="question-box">

            <span className="question-label">
              AI QUESTION
            </span>

            <h2>
              {questionText}
            </h2>

          </div>

          <form onSubmit={submitAnswer}>

            <div className="answer-section">

              <label htmlFor="answer-input">
                YOUR ANSWER
              </label>

              <textarea
                id="answer-input"
                value={answer}
                onChange={(event) => {
                  setAnswer(
                    event.target.value
                  );

                  answerRef.current =
                    event.target.value;
                }}
                placeholder="Type your answer here..."
                rows="7"
                disabled={loading}
              />

            </div>

            <div className="voice-answer-controls">

              <button
                type="button"
                className="secondary-button"
                onClick={handleVoiceAnswer}
                disabled={
                  loading ||
                  isListening ||
                  interviewCompleted
                }
              >
                {isListening
                  ? "🎙 LISTENING..."
                  : "🎙 ANSWER BY VOICE"}
              </button>

              {isListening && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    suppressRecognitionAutoSubmitRef.current =
                      true;

                    clearSpeechTimeouts();

                    recognitionSessionIdRef.current +=
                      1;

                    if (
                      recognitionRef.current
                    ) {
                      try {
                        recognitionRef.current.stop();
                      } catch {
                        // Already stopped.
                      }

                      recognitionRef.current =
                        null;
                    }

                    setIsListening(false);

                    if (
                      answerRef.current.trim()
                    ) {
                      setMessage(
                        "Voice input stopped. Review your answer and submit when ready."
                      );
                    } else {
                      setMessage(
                        "Voice input stopped."
                      );
                    }
                  }}
                >
                  Stop Listening
                </button>
              )}

              {!speechSupported && (
                <span className="voice-not-supported">
                  Voice input is not
                  supported in this
                  browser.
                </span>
              )}

            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={
                loading ||
                !answer.trim() ||
                interviewCompleted
              }
            >
              {loading
                ? "SUBMITTING..."
                : currentQuestion === 19
                ? "SUBMIT FINAL ANSWER"
                : "SUBMIT ANSWER →"}
            </button>

          </form>

          {message && (
            <div className="message-box">
              {message}
            </div>
          )}

        </div>
      </main>
    );
  };

  /* =======================================================
     RESULTS PAGE
  ======================================================= */

  const renderResults = () => {
    return (
      <main className="page-container">

        <div className="results-card">

          <div className="results-header">

            <div>
              <span className="eyebrow">
                PERFORMANCE ANALYSIS
              </span>

              <h1>
                Interview Results
              </h1>
            </div>

            {candidateId && (
              <div className="candidate-pill">
                Candidate #{candidateId}
              </div>
            )}

          </div>

          {results.length > 0 ? (
            <>

              <div className="performance-overview">

                <div className="score-circle">

                  <strong>
                    {performance.average}
                  </strong>

                  <span>
                    / 100
                  </span>

                </div>

                <div>

                  <span className="eyebrow">
                    OVERALL PERFORMANCE
                  </span>

                  <h2>
                    {performance.title}
                  </h2>

                  <p>
                    Your average interview
                    performance based on
                    the available evaluation
                    results.
                  </p>

                </div>

              </div>

              <div className="results-list">

                {results.map(
                  (result, index) => (
                    <div
                      className="result-item"
                      key={index}
                    >

                      <div className="result-question">

                        <span>
                          QUESTION{" "}
                          {index + 1}
                        </span>

                        <p>
                          {result.question ||
                            result.question_text ||
                            "Interview question"}
                        </p>

                      </div>

                      <div className="result-score">

                        <strong>
                          {result.score ??
                            "--"}
                        </strong>

                        <span>
                          / 10
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>

            </>
          ) : (
            <div className="empty-results">

              <div className="empty-icon">
                ◈
              </div>

              <h2>
                No Interview Results Yet
              </h2>

              <p>
                Complete an AI interview
                to see your scores and
                feedback here.
              </p>

              <button
                type="button"
                className="primary-button small-button"
                onClick={
                  startInterview
                }
                disabled={loading}
              >
                START INTERVIEW
              </button>

            </div>
          )}

          {message && (
            <div className="message-box">
              {message}
            </div>
          )}

        </div>
      </main>
    );
  };

  /* =======================================================
     AUTH GUARD
  ======================================================= */

  if (!authUser) {
    return (
      <div className="app">
        <AuthView
          onLoginSuccess={
            handleLoginSuccess
          }
        />
      </div>
    );
  }

  /* =======================================================
     MAIN RENDER
  ======================================================= */

  return (
    <div className="app">

      <Navbar
        onNavigate={
          handleNavigate
        }
      />

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          alignItems: "center",
          gap: "12px",
          padding: "12px 24px",
        }}
      >

        <span>
          Welcome{" "}
          <strong>
            {authUser?.name ||
              name ||
              "Candidate"}
          </strong>
        </span>

        <button
          type="button"
          className="danger-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      {page === "home" &&
        renderHome()}

      {page === "interview" &&
        renderInterview()}

      {page === "results" &&
        renderResults()}

    </div>
  );
}

export default App;