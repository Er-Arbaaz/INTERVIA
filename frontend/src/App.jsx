import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
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

      const response =
        mode === "signup"
          ? await axios.post(`${API}/auth/signup`, {
              name: name.trim(),
              email: email.trim(),
              password,
            })
          : await axios.post(`${API}/auth/login`, {
              email: email.trim(),
              password,
            });

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
          detail.map((item) => item?.msg || "Validation error").join(", ")
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
    <main className="auth-page">
      <div className="auth-brand">
        <div className="brand-mark">AI</div>
        <div>
          <strong>INTERVIA</strong>
          <span>Intelligent Assessment Platform</span>
        </div>
      </div>

      <section className="auth-intro">
        <div className="auth-kicker">AI-POWERED INTERVIEW PLATFORM</div>
        <h1>
          Welcome to Your
          <span> INTERVIA.</span>
        </h1>
        <p>
          {mode === "login"
            ? "Sign in to continue to your intelligent interview workspace."
            : "Create your account to begin your personalized AI interview journey."}
        </p>
      </section>

      <section className="auth-card">
        <div className="auth-card-heading">
          <span>{mode === "login" ? "SECURE LOGIN" : "CREATE ACCOUNT"}</span>
          <h2>
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="auth-field">
              <label htmlFor="auth-name">FULL NAME</label>
              <div className="auth-input">
                <span>✦</span>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">EMAIL ADDRESS</label>
            <div className="auth-input">
              <span>@</span>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">PASSWORD</label>
            <div className="auth-input">
              <span>◆</span>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                disabled={loading}
              />
            </div>
          </div>

          <button className="iv-primary-button" type="submit" disabled={loading}>
            {loading
              ? mode === "login"
                ? "SIGNING IN..."
                : "CREATING ACCOUNT..."
              : mode === "login"
              ? "LOGIN →"
              : "CREATE ACCOUNT →"}
          </button>
        </form>

        {message && <div className="iv-message">{message}</div>}

        <div className="auth-switch">
          {mode === "login" ? (
            <>
              <span>Don't have an account?</span>
              <button
                type="button"
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

  const recognitionRef = useRef(null);

  const answerRef = useRef("");
  const submitAnswerRef = useRef(null);

  const isSubmittingRef = useRef(false);
  const interviewCompletedRef = useRef(false);

  const suppressRecognitionAutoSubmitRef = useRef(false);

  const speechStartTimeoutRef = useRef(null);

  const recognitionSessionIdRef = useRef(0);

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
      if (authUser?.id && candidateId) {
  localStorage.setItem(
    `candidateId_${authUser.id}`,
    String(candidateId)
  );
}
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

  const [candidateId, setCandidateId] = useState(() => {
  const savedUser = localStorage.getItem("authUser");

  if (!savedUser) {
    return "";
  }

  try {
    const user = JSON.parse(savedUser);

    return (
      localStorage.getItem(`candidateId_${user.id}`) || ""
    );
  } catch {
    return "";
  }
});

  const [candidateType, setCandidateType] = useState(
    localStorage.getItem("candidateType") || "technical"
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
  const [selectedResult, setSelectedResult] = useState(0);

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

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const TOTAL_INTERVIEW_TIME_SECONDS = 15 * 60;

  const [timeLeft, setTimeLeft] = useState(TOTAL_INTERVIEW_TIME_SECONDS);

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
    if (candidateType) {
      localStorage.setItem(
        "candidateType",
        candidateType
      );
    }
  }, [candidateType]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(
        "sessionId",
        String(sessionId)
      );
    }
  }, [sessionId]);


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
              "⏱️ The 15-minute interview limit has been reached. Finalizing the interview..."
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
     CLEAR SPEECH TIMEOUTS
  ======================================================= */

  const clearSpeechTimeouts =
    useCallback(() => {
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

        // Keep the answer field available; silence must never submit an answer.
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
    recognitionRef.current = null;
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
    answerRef.current = capturedAnswer;
    setAnswer(capturedAnswer);

    setMessage(
      "🎙️ Voice recognition paused. Your answer is saved. Submit it when you are ready."
    );

    return;
  }

  // Hide the listening prompt when voice recognition stops without captured speech.
  // It will appear again when the user clicks "Answer by Voice".
  setMessage("");
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
     VOICE ANSWER BUTTON HANDLER
  ======================================================= */

  const handleVoiceAnswer = useCallback(() => {
    clearSpeechTimeouts();

    suppressRecognitionAutoSubmitRef.current =
      false;

    startListening();
  }, [
    clearSpeechTimeouts,
    startListening,
  ]);

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


    };
  }, [clearSpeechTimeouts]);

  /* =======================================================
     LOGIN SUCCESS
  ======================================================= */

 const handleLoginSuccess = async (user) => {
  setAuthUser(user);

  if (user?.name) {
    setName(user.name);
  }

  setMessage("");

  /*
   * Each login account gets its own candidate profile.
   * Existing candidate mappings are reused.
   */
  const savedCandidateId = user?.id
    ? localStorage.getItem(
        `candidateId_${user.id}`
      ) || ""
    : "";

  const legacyCandidateId =
    localStorage.getItem("candidateId") || "";

  const legacyCandidateName =
    localStorage.getItem("candidateName") || "";

  let resolvedCandidateId =
    savedCandidateId;

  /*
   * Recover an older candidate only when the
   * saved candidate name belongs to this user.
   */
  if (
    !resolvedCandidateId &&
    user?.name &&
    legacyCandidateName.trim().toLowerCase() ===
      user.name.trim().toLowerCase() &&
    legacyCandidateId
  ) {
    resolvedCandidateId =
      legacyCandidateId;
  }

  /*
   * If this login account does not have a candidate
   * profile yet, create one automatically.
   */
  if (
    !resolvedCandidateId &&
    user?.name
  ) {
    try {
      const candidateResponse =
        await axios.post(
          `${API}/candidate`,
          {
            name: user.name.trim(),
            skill:
              candidateType === "non_technical"
                ? "general"
                : "auto",
            candidate_type:
              candidateType || "technical",
          }
        );

      resolvedCandidateId =
        candidateResponse.data?.candidate_id ||
        candidateResponse.data?.id ||
        candidateResponse.data?.candidateId ||
        "";
    } catch (error) {
      console.error(
        "Automatic candidate creation failed:",
        error
      );

      console.error(
        "Backend candidate response:",
        error.response?.data
      );

      setCandidateId("");
      setMessage(
        "Unable to initialize your candidate profile. Please try logging in again."
      );

      return;
    }
  }

  /*
   * Save the candidate ID permanently for this
   * specific login account.
   */
  if (
    user?.id &&
    resolvedCandidateId
  ) {
    localStorage.setItem(
      `candidateId_${user.id}`,
      String(resolvedCandidateId)
    );
  }

  if (resolvedCandidateId) {
    localStorage.setItem(
      "candidateId",
      String(resolvedCandidateId)
    );

    setCandidateId(
      String(resolvedCandidateId)
    );
  } else {
    localStorage.removeItem(
      "candidateId"
    );

    setCandidateId("");
  }

  setSessionId("");

  localStorage.removeItem(
    "sessionId"
  );

  interviewCompletedRef.current =
    false;

  setInterviewCompleted(false);

  suppressRecognitionAutoSubmitRef.current =
    false;

  isSubmittingRef.current =
    false;

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
          setSelectedResult(0);
        } else if (
          Array.isArray(
            response.data?.results
          )
        ) {
          setResults(
            response.data.results
          );
          setSelectedResult(0);
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
        candidateType === "non_technical"
          ? "general"
          : "auto";

      if (!cleanName) {
        setMessage(
          "Please enter your full name."
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
              candidate_type: candidateType,
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
        setCandidateType(candidateType);

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
          "candidateType",
          candidateType
        );

        localStorage.setItem(
          "candidateId",
          String(newCandidateId)
        );
        if (authUser?.id) {
  localStorage.setItem(
    `candidateId_${authUser.id}`,
    String(newCandidateId)
  );
}

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

  const uploadCandidateId =
    candidateId ||
    (authUser?.id
      ? localStorage.getItem(
          `candidateId_${authUser.id}`
        )
      : "");

  if (!uploadCandidateId) {
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
    `${API}/resume/upload/${uploadCandidateId}`,
    formData
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
          `${API}/interview/start-candidate/${candidateId}`,
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

  const submitAnswer = async (event) => {
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
  };

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
  });

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
    const displayName = authUser?.name || name || "Candidate";
    const candidateLabel = candidateId ? `#${candidateId}` : "Not registered";
    const skillLabel = skill ? skill.toUpperCase() : "GENERAL";

    return (
      <main className="workspace-page home-page">
        <section className="page-heading home-heading">
          <div>
            <span className="section-kicker">AI INTERVIEW WORKSPACE</span>
            <h1>Welcome back, {displayName}.</h1>
            <p>Prepare, practice and measure your interview performance with INTERVIA.</p>
          </div>
          <div className="online-pill"><span /> AI SYSTEM ONLINE</div>
        </section>

        <section className="stats-grid">
          <article className="stat-card stat-card-accent">
            <div className="stat-icon">◎</div>
            <span>CANDIDATE</span>
            <strong>{candidateLabel}</strong>
            <small>{candidateType === "technical" ? "Technical background" : "Non-technical background"}</small>
          </article>
          <article className="stat-card">
            <div className="stat-icon">✦</div>
            <span>PRIMARY SKILL</span>
            <strong>{skillLabel}</strong>
            <small>{resumeUploaded ? "Resume personalized" : "General interview profile"}</small>
          </article>
          <article className="stat-card">
            <div className="stat-icon">✓</div>
            <span>INTERVIEW STATUS</span>
            <strong>{interviewCompleted ? "COMPLETED" : "READY"}</strong>
            <small>{interviewCompleted ? "View your latest results" : "15-minute assessment"}</small>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card resume-panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">RESUME INTELLIGENCE</span>
                <h2>{resumeUploaded ? "Resume analyzed successfully" : "Personalize your AI interview"}</h2>
              </div>
              <span className={`status-tag ${resumeUploaded ? "success" : "neutral"}`}>
                {resumeUploaded ? "ANALYZED" : "READY"}
              </span>
            </div>

            <p className="panel-description">
              Upload your resume and INTERVIA will use your skills, projects, experience and technologies to personalize your questions.
            </p>

            <div className="resume-upload-box">
              <div className="resume-file-info">
                <div className="file-icon">PDF</div>
                <div>
                  <strong>{resumeName || "Choose your resume"}</strong>
                  <span>PDF or DOCX · Resume-aware interview questions</span>
                </div>
              </div>
              <label className="outline-button" htmlFor="resume-upload">Choose File</label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setResumeFile(file);
                  if (file) {
                    setResumeName(file.name);
                    setResumeUploaded(false);
                    setMessage("");
                  } else {
                    setResumeName("");
                  }
                }}
                disabled={resumeUploading}
              />
              <button
                type="button"
                className="primary-button"
                onClick={uploadResume}
                disabled={resumeUploading || !resumeFile}
              >
                {resumeUploading ? "Analyzing..." : resumeUploaded ? "Update Resume" : "Upload & Analyze"}
              </button>
            </div>

            <div className="feature-line">
              <span>✓ Resume extraction</span>
              <span>✓ Personalized questions</span>
              <span>✓ Technical + aptitude mix</span>
            </div>
            {message && <div className="inline-message">{message}</div>}
          </article>

          <article className="dashboard-card start-panel">
            <div className="start-illustration">✦</div>
            <span className="section-kicker">NEXT ACTION</span>
            <h2>Ready to test your skills?</h2>
            <p>
              Start a personalized 20-question interview with one overall 15-minute timer.
            </p>
            <div className="start-details">
              <div><span>Questions</span><strong>20</strong></div>
              <div><span>Duration</span><strong>15 min</strong></div>
              <div><span>Voice</span><strong>Enabled</strong></div>
            </div>
            <button
              type="button"
              className="primary-button large-button"
              onClick={startInterview}
              disabled={loading || !candidateId || !skill}
            >
              {loading ? "Initializing AI..." : "Start Interview →"}
            </button>
          </article>
        </section>

        {!candidateId && (
          <section className="dashboard-card setup-panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">PROFILE SETUP</span>
                <h2>Complete your candidate profile</h2>
              </div>
            </div>
            <p className="panel-description">Choose the candidate background and primary skill before starting your assessment.</p>
            <form className="setup-grid" onSubmit={async (event) => { event.preventDefault(); await registerCandidate(event); }}>
              <div className="field-group">
                <label htmlFor="candidate-name">FULL NAME</label>
                <input id="candidate-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" />
              </div>
              <div className="field-group">
                <label htmlFor="candidate-skill">PRIMARY SKILL</label>
                <select id="candidate-skill" value={skill} onChange={(event) => setSkill(event.target.value)}>
                  <option value="">Select skill</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              <div className="field-group">
                <label htmlFor="candidate-type">BACKGROUND</label>
                <select id="candidate-type" value={candidateType} onChange={(event) => setCandidateType(event.target.value)}>
                  <option value="technical">Technical</option>
                  <option value="non_technical">Non-Technical</option>
                </select>
              </div>
              <button className="primary-button" type="submit">Create Profile →</button>
            </form>
          </section>
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
        <main className="workspace-page centered-page">
          <section className="empty-state-card">
            <div className="empty-icon">AI</div>
            <span className="section-kicker">INTERVIEW</span>
            <h1>No candidate registered</h1>
            <p>Please complete your candidate profile before starting your interview.</p>
            <button type="button" className="primary-button" onClick={() => setPage("home")}>Go to Dashboard →</button>
          </section>
        </main>
      );
    }

    if (questions.length === 0) {
      return (
        <main className="workspace-page centered-page">
          <section className="empty-state-card">
            <div className="empty-icon">✦</div>
            <span className="section-kicker">AI INTERVIEW</span>
            <h1>Ready for your interview?</h1>
            <p>Your questions will be generated from your candidate profile and uploaded resume.</p>
            <button type="button" className="primary-button" onClick={startInterview} disabled={loading}>
              {loading ? "Initializing..." : "Start Interview →"}
            </button>
            {message && <div className="inline-message">{message}</div>}
          </section>
        </main>
      );
    }

    const questionText = getQuestionText(questions[currentQuestion]);
    const progress = Math.min(((currentQuestion + 1) / 20) * 100, 100);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <main className="workspace-page interview-page">
        <section className="interview-shell">
          <div className="interview-header">
            <div>
              <span className="section-kicker">LIVE AI INTERVIEW</span>
              <h1>Technical Assessment</h1>
              <p>Answer naturally. INTERVIA evaluates relevance, quality and response consistency.</p>
            </div>
            <div className="interview-meta">
              <span className="timer-badge">⏱ {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
              <span className="question-badge">Question {currentQuestion + 1} / 20</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <section className="interview-content">
            <div className="question-column">
              <div className="content-label"><span className="ai-spark">✦</span> AI INTERVIEWER</div>
              <div className="question-card">
                <div className="question-number">{String(currentQuestion + 1).padStart(2, "0")}</div>
                <div>
                  <span>Current question</span>
                  <h2>{questionText}</h2>
                  <p>Listen carefully, then answer in your own words. You may type or use voice input.</p>
                </div>
              </div>
            </div>

            <form onSubmit={submitAnswer} className="answer-column">
              <div className="content-label">YOUR ANSWER</div>
              <div className="answer-note">Speak or Type the Answer</div>
              <textarea
                id="answer-input"
                value={answer}
                onChange={(event) => { setAnswer(event.target.value); answerRef.current = event.target.value; }}
                placeholder="Type your answer here..."
                rows="10"
                disabled={loading}
              />
              <div className="answer-toolbar">
                <button type="button" className="voice-button" onClick={handleVoiceAnswer} disabled={loading || isListening || interviewCompleted}>
                  {isListening ? "🎙 Listening..." : "🎙 Answer by Voice"}
                </button>
                {isListening && (
                  <button type="button" className="text-button" onClick={() => {
                    suppressRecognitionAutoSubmitRef.current = true;
                    clearSpeechTimeouts();
                    recognitionSessionIdRef.current += 1;
                    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* stopped */ } recognitionRef.current = null; }
                    setIsListening(false);
                    setMessage(answerRef.current.trim() ? "Voice input stopped. Review your answer before submitting." : "Voice input stopped.");
                  }}>Stop listening</button>
                )}
                {!speechSupported && <span className="browser-note">Voice input is not supported in this browser.</span>}
              </div>
              <button className="submit-answer-button" type="submit" disabled={loading || !answer.trim() || interviewCompleted}>
                {loading ? "Submitting..." : currentQuestion === 19 ? "Submit Final Answer →" : "Submit Answer →"}
              </button>
              <div className="answer-note">Your response is securely evaluated and stored with this interview session.</div>
            </form>
          </section>

          {message && <div className="inline-message interview-message">{message}</div>}
        </section>
      </main>
    );
  };

  /* =======================================================
     RESULTS PAGE
  ======================================================= */

 const renderResults = () => {
  const score = performance.average;
  const answered = results.length;

  const earned = results.reduce(
    (sum, item) =>
      sum + Number(item?.score || 0),
    0
  );

  const zeroScores = results.filter(
    (item) =>
      Number(item?.score || 0) === 0
  ).length;

  const resultSlots = Array.from(
    { length: 20 },
    (_, index) => results[index] || null
  );

  const selectedItem =
    resultSlots[selectedResult];

  return (
    <main className="workspace-page results-page">
      <style>{`
        /* Results page: everything fits in one viewport. */
        .results-page {
          height: calc(100vh - 72px) !important;
          max-height: calc(100vh - 72px) !important;
          min-height: 0 !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
          padding: 18px 28px !important;
        }

        .results-page .page-heading {
          flex: 0 0 auto !important;
          margin: 0 !important;
        }

        .results-page .page-heading h1 {
          margin: 2px 0 4px !important;
          font-size: 28px !important;
        }

        .results-page .page-heading p {
          margin: 0 !important;
        }

        .results-page .results-stat-grid {
          flex: 0 0 auto !important;
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 10px !important;
          margin: 0 !important;
        }

        .results-page .result-stat {
          min-height: 0 !important;
          padding: 12px 14px !important;
        }

        .results-page .result-stat strong {
          font-size: 24px !important;
        }

        .results-page .question-review-layout {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow: hidden !important;
          display: grid !important;
          grid-template-columns: minmax(300px, 0.9fr) minmax(420px, 1.5fr) !important;
          gap: 14px !important;
          align-items: stretch !important;
        }

        .results-page .question-selector-panel,
        .results-page .selected-result-panel {
          grid-column: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          width: auto !important;
          position: relative !important;
          z-index: 1 !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          padding: 14px !important;
        }

        .results-page .question-selector-panel {
          display: flex !important;
          flex-direction: column !important;
        }

        .results-page .question-selector-panel .panel-heading {
          flex: 0 0 auto !important;
          margin-bottom: 10px !important;
        }

        .results-page .question-selector-panel .panel-heading h2 {
          margin: 2px 0 0 !important;
          font-size: 18px !important;
        }

        .results-page .question-box-grid {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          display: grid !important;
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          grid-template-rows: repeat(4, minmax(0, 1fr)) !important;
          gap: 8px !important;
        }

        .results-page .question-result-box {
          min-width: 0 !important;
          min-height: 0 !important;
          padding: 8px 5px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 2px !important;
        }

        .results-page .question-result-box span {
          font-size: 12px !important;
        }

        .results-page .question-result-box strong {
          font-size: 13px !important;
        }

        .results-page .question-box-legend {
          flex: 0 0 auto !important;
          margin-top: 8px !important;
          gap: 10px !important;
          font-size: 11px !important;
        }

        .results-page .selected-result-panel {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
        }

        .results-page .selected-result-header {
          flex: 0 0 auto !important;
          min-height: 0 !important;
          gap: 10px !important;
        }

        .results-page .selected-result-header h2 {
          margin: 2px 0 0 !important;
          font-size: 17px !important;
          line-height: 1.25 !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }

        .results-page .selected-score {
          flex: 0 0 auto !important;
          font-size: 18px !important;
          padding: 8px 10px !important;
        }

        .results-page .selected-answer-section,
        .results-page .selected-feedback-section,
        .results-page .feedback-item {
          margin: 0 !important;
          padding: 8px 10px !important;
        }

        /* Keep both answer and feedback visible in the results card. */
        .results-page .selected-answer-section,
        .results-page .selected-feedback-section {
          flex: 1 1 0% !important;
          min-height: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }

        .results-page .selected-answer-section p,
        .results-page .selected-feedback-section p,
        .results-page .feedback-item p {
          margin: 3px 0 0 !important;
          line-height: 1.35 !important;
          display: -webkit-box !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }

        /* Let the answer and AI feedback scroll independently instead of truncating. */
        .results-page .selected-answer-section p,
        .results-page .selected-feedback-section p {
          display: block !important;
          flex: 1 1 auto !important;
          min-height: 0 !important;
          -webkit-line-clamp: unset !important;
          line-clamp: unset !important;
          -webkit-box-orient: initial !important;
          height: auto !important;
          max-height: none !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          text-overflow: clip !important;
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
          word-break: normal !important;
          padding-right: 7px !important;
          scrollbar-width: thin;
          scrollbar-color: #b8b5d8 transparent;
        }

        .results-page .selected-answer-section p::-webkit-scrollbar,
        .results-page .selected-feedback-section p::-webkit-scrollbar {
          width: 6px;
        }

        .results-page .selected-answer-section p::-webkit-scrollbar-thumb,
        .results-page .selected-feedback-section p::-webkit-scrollbar-thumb {
          background: #b8b5d8;
          border-radius: 6px;
        }

        .results-page .selected-answer-section p::-webkit-scrollbar-track,
        .results-page .selected-feedback-section p::-webkit-scrollbar-track {
          background: transparent;
        }

        .results-page .feedback-item p {
          -webkit-line-clamp: 2 !important;
        }

        .results-page .inline-message {
          flex: 0 0 auto !important;
          margin: 0 !important;
        }

        @media (max-width: 900px) {
          .results-page {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }

          .results-page .question-review-layout {
            grid-template-columns: 1fr !important;
            overflow: visible !important;
          }
        }
      `}</style>
      <section className="page-heading">
        <div>
          <span className="section-kicker">
            PERFORMANCE ANALYSIS
          </span>

          <h1>Interview Results</h1>

          <p>
            Select any question to view your answer,
            score and personalized AI feedback.
          </p>
        </div>

        {candidateId && (
          <div className="candidate-badge">
            Candidate #{candidateId}
          </div>
        )}
      </section>

      <section className="results-stat-grid compact-results-stats">
        <article className="result-stat main-score">
          <span>OVERALL SCORE</span>
          <strong>{score}%</strong>
          <small>
            {performance.title} performance
          </small>
        </article>

        <article className="result-stat">
          <span>QUESTIONS ANSWERED</span>
          <strong>
            {answered}
            <small> / 20</small>
          </strong>
          <small>
            Completed in this session
          </small>
        </article>

        <article className="result-stat">
          <span>AVERAGE ANSWER</span>
          <strong>
            {answered
              ? (earned / answered).toFixed(1)
              : "0.0"}
            <small> / 10</small>
          </strong>
          <small>
            Across evaluated answers
          </small>
        </article>

        <article className="result-stat alert-stat">
          <span>ZERO SCORES</span>
          <strong>{zeroScores}</strong>
          <small>
            Incorrect or unanswered
          </small>
        </article>
      </section>

      {results.length > 0 ? (
        <section className="question-review-layout">

          {/* =================================================
              20 QUESTION BOXES
          ================================================= */}

          <article className="dashboard-card question-selector-panel">
            <div className="panel-heading">
              <div>
                <span className="section-kicker">
                  QUESTION REVIEW
                </span>

                <h2>
                  All 20 Questions
                </h2>
              </div>
            </div>

            <div className="question-box-grid">
              {resultSlots.map(
                (result, index) => {
                  const itemScore = result
                    ? Number(
                        result.score || 0
                      )
                    : null;

                  const isSelected =
                    selectedResult === index;

                  return (
                    <button
                      type="button"
                      key={index}
                      className={
                        `question-result-box ${
                          isSelected
                            ? "selected"
                            : ""
                        } ${
                          result
                            ? itemScore === 0
                              ? "zero"
                              : itemScore >= 7
                              ? "good"
                              : "mid"
                            : "unanswered"
                        }`
                      }
                      onClick={() =>
                        setSelectedResult(
                          index
                        )
                      }
                    >
                      <span>
                        Q{index + 1}
                      </span>

                      <strong>
                        {result
                          ? `${itemScore}/10`
                          : "--"}
                      </strong>
                    </button>
                  );
                }
              )}
            </div>

            <div className="question-box-legend">
              <span>
                <i className="good" />
                Good
              </span>

              <span>
                <i className="mid" />
                Needs Improvement
              </span>

              <span>
                <i className="zero" />
                Incorrect
              </span>
            </div>
          </article>

          {/* =================================================
              SELECTED QUESTION DETAILS
          ================================================= */}

          <article className="dashboard-card selected-result-panel">
            {selectedItem ? (
              <>
                <div className="selected-result-header">
                  <div>
                    <span className="section-kicker">
                      QUESTION{" "}
                      {selectedResult + 1}
                    </span>

                    <h2>
                      {selectedItem.question ||
                        selectedItem.question_text ||
                        "Interview Question"}
                    </h2>
                  </div>

                  <div
                    className={
                      `selected-score ${
                        Number(
                          selectedItem.score || 0
                        ) >= 7
                          ? "good"
                          : Number(
                              selectedItem.score ||
                                0
                            ) === 0
                          ? "zero"
                          : "mid"
                      }`
                    }
                  >
                    {Number(
                      selectedItem.score || 0
                    )}
                    /10
                  </div>
                </div>

                <div className="selected-answer-section">
                  <span>
                    YOUR ANSWER
                  </span>

                  <p>
                    {selectedItem.answer ||
                      "No answer recorded."}
                  </p>
                </div>

                <div className="selected-feedback-section">
                  <span>
                    AI FEEDBACK
                  </span>

                  <p>
                    {selectedItem.feedback ||
                      "No detailed feedback was returned for this answer."}
                  </p>
                </div>

                {selectedItem.strengths && (
                  <div className="feedback-item">
                    <strong>
                      Strengths
                    </strong>

                    <p>
                      {Array.isArray(
                        selectedItem.strengths
                      )
                        ? selectedItem.strengths.join(
                            " • "
                          )
                        : selectedItem.strengths}
                    </p>
                  </div>
                )}

                {selectedItem.weaknesses && (
                  <div className="feedback-item">
                    <strong>
                      Weaknesses / Mistakes
                    </strong>

                    <p>
                      {Array.isArray(
                        selectedItem.weaknesses
                      )
                        ? selectedItem.weaknesses.join(
                            " • "
                          )
                        : selectedItem.weaknesses}
                    </p>
                  </div>
                )}

                {selectedItem.improvement && (
                  <div className="feedback-item">
                    <strong>
                      How to Improve
                    </strong>

                    <p>
                      {selectedItem.improvement}
                    </p>
                  </div>
                )}

                {selectedItem.ideal_answer && (
                  <div className="feedback-item">
                    <strong>
                      Ideal Answer
                    </strong>

                    <p>
                      {selectedItem.ideal_answer}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="selected-empty">
                <div className="empty-icon">
                  ✦
                </div>

                <h2>
                  Question not answered
                </h2>

                <p>
                  This question was not answered
                  during the interview.
                </p>
              </div>
            )}
          </article>
        </section>
      ) : (
        <section className="empty-results">
          <div className="empty-icon">
            ✦
          </div>

          <span className="section-kicker">
            NO RESULTS YET
          </span>

          <h2>
            Complete an AI interview to see
            your results
          </h2>

          <p>
            Your scores and question-level
            evaluation will appear here after
            the interview.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={startInterview}
            disabled={loading}
          >
            {loading
              ? "Initializing..."
              : "Start Interview →"}
          </button>
        </section>
      )}

      {message && (
        <div className="inline-message">
          {message}
        </div>
      )}
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
    <div className="app authenticated-app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-symbol">✦</div>
          <div><strong>INTERVIA</strong><span>Intelligent Assessment</span></div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className={page === "home" ? "nav-item active" : "nav-item"} onClick={() => handleNavigate("home")} type="button"><span>⌂</span>Dashboard</button>
          <button className={page === "interview" ? "nav-item active" : "nav-item"} onClick={() => handleNavigate("interview")} type="button"><span>▣</span>Interview</button>
          <button className={page === "results" ? "nav-item active" : "nav-item"} onClick={() => handleNavigate("results")} type="button"><span>◫</span>Results</button>
        </nav>

        <div className="sidebar-info">
          <span className="section-kicker">INTERVIA FEATURES</span>
          <p>Resume-aware questions, adaptive evaluation and voice input.</p>
        </div>

        <div className="sidebar-user">
          <div className="avatar">{(authUser?.name || name || "C").charAt(0).toUpperCase()}</div>
          <div><strong>{authUser?.name || name || "Candidate"}</strong><span>{candidateType === "technical" ? "Technical" : "Non-Technical"}</span></div>
          <button type="button" onClick={handleLogout} aria-label="Log out">↪</button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-symbol">✦</div><strong>INTERVIA</strong></div>
          <div className="topbar-right">
            <span>Welcome, {authUser?.name || name || "Candidate"}</span>
            <button type="button" className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {page === "home" && renderHome()}
        {page === "interview" && renderInterview()}
        {page === "results" && renderResults()}
      </div>
    </div>
  );
}

export default App;
