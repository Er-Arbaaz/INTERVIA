import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";
import DeveloperModal from "./DeveloperModal";
import InterviaLogo from "./Logo";
import {
  DashboardIcon,
  InterviewIcon,
  ResultsIcon,
  ProfileBadgeIcon,
  SkillBadgeIcon,
  StatusBadgeIcon,
} from "./Icons";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/* =========================================================
   AUTHENTICATION VIEW (SIGNUP / LOGIN)
========================================================= */

function AuthView({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Background glow effects */}
      <div className="auth-ambient-glow glow-1"></div>
      <div className="auth-ambient-glow glow-2"></div>

      {/* Top Brand Bar: Only INTERVIA and AI-POWERED TECHNICAL INTERVIEW SUITE */}
      <div className="auth-brand-top">
        <InterviaLogo size={38} />
        <div className="brand-text">
          <div className="brand-title-row">
            <strong>INTERVIA</strong>
            <span className="auth-suite-badge">AI-POWERED TECHNICAL INTERVIEW SUITE</span>
          </div>
        </div>
      </div>

      {/* Left Column: Product Showcase */}
      <section className="auth-intro">
        <h1 className="auth-headline">
          Prepare, Practice &amp; Excel with
          <span className="gradient-text"> INTERVIA.</span>
        </h1>

        {/* Feature Highlights Grid */}
        <div className="auth-features-list">
          <div className="auth-feature-card">
            <div className="feature-icon">⚡</div>
            <div>
              <strong>Adaptive Difficulty</strong>
              <span>Questions dynamically adjust to your skill performance in real-time</span>
            </div>
          </div>

          <div className="auth-feature-card">
            <div className="feature-icon">📄</div>
            <div>
              <strong>Resume Intelligence</strong>
              <span>Upload your PDF/DOCX resume to tailor questions to your projects &amp; stack</span>
            </div>
          </div>

          <div className="auth-feature-card">
            <div className="feature-icon">🎙️</div>
            <div>
              <strong>Voice &amp; Speech Recognition</strong>
              <span>Listen to AI questions and speak your answers using Chrome Web Speech</span>
            </div>
          </div>

          <div className="auth-feature-card">
            <div className="feature-icon">📊</div>
            <div>
              <strong>Comprehensive Analytics</strong>
              <span>Receive scoring out of 10, actionable feedback, and ideal sample answers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Authentication Card */}
      <section className="auth-card-wrapper">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-card-badge">
              {mode === "login" ? "SECURE ACCESS" : "NEW CANDIDATE"}
            </span>
            <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
            <p>
              {mode === "login"
                ? "Enter your credentials to enter your interview session."
                : "Register in seconds to start your personalized AI assessment."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="auth-mode-tabs">
            <button
              type="button"
              className={`mode-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMessage("");
                setMode("login");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => {
                setMessage("");
                setMode("signup");
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "signup" && (
              <div className="auth-field">
                <label htmlFor="auth-name">FULL NAME</label>
                <div className="auth-input-group">
                  <span className="input-icon">✦</span>
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
              <div className="auth-input-group">
                <span className="input-icon">@</span>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">PASSWORD</label>
              <div className="auth-input-group">
                <span className="input-icon">◆</span>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              className="iv-primary-button submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner-wrap">
                  <span className="spinner"></span>
                  {mode === "login" ? "Authenticating..." : "Creating Account..."}
                </span>
              ) : (
                <span>
                  {mode === "login" ? "Sign In to Workspace →" : "Create Candidate Account →"}
                </span>
              )}
            </button>
          </form>

          {message && (
            <div className="iv-message">
              <span className="message-icon">⚠️</span>
              <span>{message}</span>
            </div>
          )}

          <div className="auth-switch">
            {mode === "login" ? (
              <>
                <span>Don't have an account yet?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setMode("signup");
                  }}
                  disabled={loading}
                >
                  Sign Up Free
                </button>
              </>
            ) : (
              <>
                <span>Already registered with INTERVIA?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setMode("login");
                  }}
                  disabled={loading}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        <div className="auth-footer-tag">
          <span>Protected by Gemini AI Evaluator • Production Build v2.0</span>
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
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch (err) {
      void err;
      localStorage.removeItem("authUser");
      return null;
    }
  });

  /* =======================================================
     DEVELOPER MODAL STATE (TOPBAR TRIGGER ONLY)
  ======================================================= */

  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

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
    if (!savedUser) return "";
    try {
      const user = JSON.parse(savedUser);
      return localStorage.getItem(`candidateId_${user.id}`) || "";
    } catch (err) {
      void err;
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
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);

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
    if (name) localStorage.setItem("candidateName", name);
  }, [name]);

  useEffect(() => {
    if (skill) localStorage.setItem("candidateSkill", skill);
  }, [skill]);

  useEffect(() => {
    if (candidateId) localStorage.setItem("candidateId", String(candidateId));
  }, [candidateId]);

  useEffect(() => {
    if (candidateType) localStorage.setItem("candidateType", candidateType);
  }, [candidateType]);

  useEffect(() => {
    if (sessionId) localStorage.setItem("sessionId", String(sessionId));
  }, [sessionId]);

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (!interviewStarted || timeLeft <= 0) return undefined;

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
  }, [interviewStarted, timeLeft]);

  /* =======================================================
     QUESTION TEXT
  ======================================================= */

  const getQuestionText = useCallback((question) => {
    if (typeof question === "string") return question;
    if (question?.question) return question.question;
    if (question?.question_text) return question.question_text;
    return "Question unavailable";
  }, []);

  /* =======================================================
     CLEAR SPEECH TIMEOUTS
  ======================================================= */

  const clearSpeechTimeouts = useCallback(() => {
    if (speechStartTimeoutRef.current) {
      window.clearTimeout(speechStartTimeoutRef.current);
      speechStartTimeoutRef.current = null;
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
      } catch (err) {
        void err;
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, [clearSpeechTimeouts]);

  /* =======================================================
     SPEECH RECOGNITION
  ======================================================= */

  const startListening = useCallback(() => {
    if (interviewCompletedRef.current || !interviewStarted) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setMessage(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (recognitionRef.current) {
      suppressRecognitionAutoSubmitRef.current = true;
      try {
        recognitionRef.current.abort();
      } catch (err) {
        void err;
      }
      recognitionRef.current = null;
    }

    recognitionSessionIdRef.current += 1;
    const thisRecognitionSession = recognitionSessionIdRef.current;
    suppressRecognitionAutoSubmitRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    let hasReceivedSpeech = false;

    recognition.onstart = () => {
      if (thisRecognitionSession !== recognitionSessionIdRef.current) {
        try { recognition.abort(); } catch (err) { void err; }
        return;
      }

      if (interviewCompletedRef.current || !interviewStarted) {
        try { recognition.abort(); } catch (err) { void err; }
        return;
      }

      setIsListening(true);
      setMessage("🎙️ Listening... Speak your answer clearly.");
    };

    recognition.onresult = (event) => {
      if (thisRecognitionSession !== recognitionSessionIdRef.current) return;
      if (interviewCompletedRef.current || isSubmittingRef.current) return;

      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          hasReceivedSpeech = true;
        } else {
          interimTranscript += transcript;
        }
      }

      const combined = (finalTranscript + interimTranscript).trim();
      if (combined) {
        hasReceivedSpeech = true;
      }

      answerRef.current = combined;
      setAnswer(combined);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event);

      if (thisRecognitionSession !== recognitionSessionIdRef.current) return;

      if (event.error === "not-allowed") {
        setMessage("Microphone permission denied. Please allow microphone access.");
        setIsListening(false);
        return;
      }

      if (event.error === "aborted") return;

      if (event.error === "no-speech") {
        if (hasReceivedSpeech) return;
        return;
      }

      setMessage("Voice recognition error. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      if (thisRecognitionSession !== recognitionSessionIdRef.current) return;

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      setIsListening(false);

      if (suppressRecognitionAutoSubmitRef.current) {
        suppressRecognitionAutoSubmitRef.current = false;
        return;
      }

      if (
        interviewCompletedRef.current ||
        isSubmittingRef.current ||
        !interviewStarted
      ) {
        return;
      }

      const capturedAnswer = finalTranscript.trim();
      if (capturedAnswer) {
        answerRef.current = capturedAnswer;
        setAnswer(capturedAnswer);
        setMessage("🎙️ Voice paused. Your answer is captured. Click submit when ready.");
        return;
      }

      setMessage("");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("Unable to start speech recognition:", error);
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      setIsListening(false);
      setMessage("Unable to access microphone. Please try again.");
    }
  }, [interviewStarted]);

  /* =======================================================
     VOICE ANSWER BUTTON HANDLER
  ======================================================= */

  const handleVoiceAnswer = useCallback(() => {
    clearSpeechTimeouts();
    suppressRecognitionAutoSubmitRef.current = false;
    startListening();
  }, [clearSpeechTimeouts, startListening]);

  /* =======================================================
     SPEAK QUESTION
  ======================================================= */

  const speakQuestion = useCallback(
    (text) => {
      if (!text || !text.trim()) return;
      if (interviewCompletedRef.current || !interviewStarted) return;

      if (!("speechSynthesis" in window)) {
        setMessage("Voice playback is not supported in this browser. Please use Google Chrome.");
        return;
      }

      clearSpeechTimeouts();

      if (recognitionRef.current) {
        suppressRecognitionAutoSubmitRef.current = true;
        recognitionSessionIdRef.current += 1;
        try { recognitionRef.current.abort(); } catch (err) { void err; }
        recognitionRef.current = null;
        setIsListening(false);
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsListening(false);
        setAiSpeaking(true);
        setMessage("🔊 AI Interviewer is speaking...");
      };

      utterance.onend = () => {
        setAiSpeaking(false);
        if (!interviewStarted || interviewCompletedRef.current) return;

        setMessage("🎙️ AI finished. Speak your answer or type below.");
        clearSpeechTimeouts();

        speechStartTimeoutRef.current = window.setTimeout(() => {
          speechStartTimeoutRef.current = null;
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
        setAiSpeaking(false);
        console.error("Speech synthesis error:", event);
        setMessage("AI voice playback failed. You can still read the question and answer manually.");
      };

      window.speechSynthesis.speak(utterance);
    },
    [interviewStarted, startListening, clearSpeechTimeouts]
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

    const questionText = getQuestionText(questions[currentQuestion]);
    if (!questionText || questionText === "Question unavailable") return undefined;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      speakQuestion(questionText);
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      clearSpeechTimeouts();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setAiSpeaking(false);

      if (recognitionRef.current) {
        suppressRecognitionAutoSubmitRef.current = true;
        recognitionSessionIdRef.current += 1;
        try { recognitionRef.current.abort(); } catch (err) { void err; }
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, [page, interviewStarted, currentQuestion, questions, getQuestionText, speakQuestion, clearSpeechTimeouts]);

  /* =======================================================
     CLEANUP ON COMPONENT UNMOUNT
  ======================================================= */

  useEffect(() => {
    return () => {
      suppressRecognitionAutoSubmitRef.current = true;
      interviewCompletedRef.current = true;
      clearSpeechTimeouts();
      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (err) { void err; }
        recognitionRef.current = null;
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearSpeechTimeouts]);

  /* =======================================================
     LOGIN SUCCESS
  ======================================================= */

  const handleLoginSuccess = async (user) => {
    setAuthUser(user);
    if (user?.name) setName(user.name);
    setMessage("");

    const savedCandidateId = user?.id
      ? localStorage.getItem(`candidateId_${user.id}`) || ""
      : "";

    const legacyCandidateId = localStorage.getItem("candidateId") || "";
    const legacyCandidateName = localStorage.getItem("candidateName") || "";

    let resolvedCandidateId = savedCandidateId;

    if (
      !resolvedCandidateId &&
      user?.name &&
      legacyCandidateName.trim().toLowerCase() === user.name.trim().toLowerCase() &&
      legacyCandidateId
    ) {
      resolvedCandidateId = legacyCandidateId;
    }

    if (!resolvedCandidateId && user?.name) {
      try {
        const candidateResponse = await axios.post(`${API}/candidate`, {
          name: user.name.trim(),
          skill: candidateType === "non_technical" ? "general" : "auto",
          candidate_type: candidateType || "technical",
        });

        resolvedCandidateId =
          candidateResponse.data?.candidate_id ||
          candidateResponse.data?.id ||
          candidateResponse.data?.candidateId ||
          "";
      } catch (error) {
        console.error("Automatic candidate creation failed:", error);
        setCandidateId("");
        setMessage("Unable to initialize candidate profile. Please try logging in again.");
        return;
      }
    }

    if (user?.id && resolvedCandidateId) {
      localStorage.setItem(`candidateId_${user.id}`, String(resolvedCandidateId));
    }

    if (resolvedCandidateId) {
      localStorage.setItem("candidateId", String(resolvedCandidateId));
      setCandidateId(String(resolvedCandidateId));
    } else {
      localStorage.removeItem("candidateId");
      setCandidateId("");
    }

    setSessionId("");
    localStorage.removeItem("sessionId");
    interviewCompletedRef.current = false;
    setInterviewCompleted(false);
    suppressRecognitionAutoSubmitRef.current = false;
    isSubmittingRef.current = false;
    setPage("home");
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    suppressRecognitionAutoSubmitRef.current = true;
    interviewCompletedRef.current = true;
    setInterviewCompleted(true);
    clearSpeechTimeouts();
    recognitionSessionIdRef.current += 1;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (err) { void err; }
      recognitionRef.current = null;
    }

    stopListening();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    localStorage.removeItem("authUser");
    setAuthUser(null);
    setMessage("");
    setPage("home");
  };

  /* =======================================================
     LOAD RESULTS
  ======================================================= */

  const loadResults = useCallback(
    async (candidate = candidateId, session = sessionId) => {
      if (!candidate) {
        console.warn("Cannot load results: candidate ID missing.");
        return false;
      }

      if (!session) {
        console.warn("Cannot load results: session ID missing.");
        return false;
      }

      try {
        setLoading(true);
        const url = `${API}/interview/results/${candidate}/${session}`;
        const response = await axios.get(url);

        if (Array.isArray(response.data)) {
          setResults(response.data);
          setSelectedResult(0);
        } else if (Array.isArray(response.data?.results)) {
          setResults(response.data.results);
          setSelectedResult(0);
        } else {
          setResults([]);
        }

        return true;
      } catch (error) {
        console.error("Results error:", error);
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          setMessage(detail.map((item) => item?.msg || "Validation error").join(", "));
        } else if (typeof detail === "string") {
          setMessage(detail);
        } else {
          setMessage("Unable to load interview results.");
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

    if (destination !== "interview") {
      suppressRecognitionAutoSubmitRef.current = true;
      clearSpeechTimeouts();
      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (err) { void err; }
        recognitionRef.current = null;
      }

      stopListening();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setAiSpeaking(false);
    }

    if (destination === "results") {
      setPage("results");
      if (candidateId && sessionId) {
        loadResults(candidateId, sessionId);
      }
      return;
    }

    setPage(destination);
  };

  /* =======================================================
     REGISTER CANDIDATE
  ======================================================= */

  const registerCandidate = async (event) => {
    event.preventDefault();
    setMessage("");

    const cleanName = name.trim();
    const cleanSkill = candidateType === "non_technical" ? "general" : "auto";

    if (!cleanName) {
      setMessage("Please enter your full name.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/candidate`, {
        name: cleanName,
        skill: cleanSkill,
        candidate_type: candidateType,
      });

      const newCandidateId =
        response.data?.candidate_id ||
        response.data?.id ||
        response.data?.candidateId;

      if (!newCandidateId) {
        setMessage("Candidate registered, but Candidate ID was not returned.");
        return;
      }

      clearSpeechTimeouts();
      suppressRecognitionAutoSubmitRef.current = true;
      interviewCompletedRef.current = false;
      setInterviewCompleted(false);
      isSubmittingRef.current = false;
      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (err) { void err; }
        recognitionRef.current = null;
      }

      setName(cleanName);
      setSkill(cleanSkill);
      setCandidateType(candidateType);
      setCandidateId(String(newCandidateId));
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

      localStorage.setItem("candidateName", cleanName);
      localStorage.setItem("candidateSkill", cleanSkill);
      localStorage.setItem("candidateType", candidateType);
      localStorage.setItem("candidateId", String(newCandidateId));

      if (authUser?.id) {
        localStorage.setItem(`candidateId_${authUser.id}`, String(newCandidateId));
      }

      localStorage.removeItem("sessionId");
      setMessage(`Registration successful. Candidate profile #${newCandidateId} activated.`);
    } catch (error) {
      console.error("Registration error:", error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        setMessage(detail.map((item) => item?.msg || "Validation error").join(", "));
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else if (error.response) {
        setMessage(`Registration failed. Server returned ${error.response.status}.`);
      } else {
        setMessage("Unable to connect to the FastAPI backend.");
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
        ? localStorage.getItem(`candidateId_${authUser.id}`)
        : "");

    if (!uploadCandidateId) {
      setMessage("Please initialize your candidate profile before uploading your resume.");
      return;
    }

    if (!resumeFile) {
      setMessage("Please select a PDF or DOCX resume first.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const fileName = resumeFile.name || "";
    const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

    if (
      !allowedTypes.includes(resumeFile.type) &&
      ![".pdf", ".docx"].includes(extension)
    ) {
      setMessage("Only PDF and DOCX resumes are supported.");
      return;
    }

    try {
      setResumeUploading(true);
      const formData = new FormData();
      formData.append("file", resumeFile);

      const response = await axios.post(
        `${API}/resume/upload/${uploadCandidateId}`,
        formData
      );

      setResumeUploaded(true);
      setResumeName(response.data?.filename || resumeFile.name);
      setMessage("✅ Resume analyzed successfully! Your upcoming interview questions are now personalized.");
    } catch (error) {
      console.error("Resume upload error:", error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        setMessage(detail.map((item) => item?.msg || "Resume error").join(", "));
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else if (error.response) {
        setMessage(`Resume upload failed. Server returned ${error.response.status}.`);
      } else {
        setMessage("Unable to connect to the FastAPI backend.");
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

    const activeCandidateId =
      candidateId ||
      (authUser?.id
        ? localStorage.getItem(`candidateId_${authUser.id}`)
        : "");

    if (!activeCandidateId) {
      setMessage("Please initialize your candidate profile first.");
      setPage("home");
      return;
    }

    try {
      setLoading(true);
      clearSpeechTimeouts();
      interviewCompletedRef.current = false;
      setInterviewCompleted(false);
      suppressRecognitionAutoSubmitRef.current = true;
      isSubmittingRef.current = false;
      answerRef.current = "";
      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (err) { void err; }
        recognitionRef.current = null;
      }

      setIsListening(false);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setAiSpeaking(false);

      const response = await axios.get(
        `${API}/interview/start-candidate/${activeCandidateId}`,
        {
          params: { candidate_id: activeCandidateId },
        }
      );

      const receivedSessionId =
        response.data?.session_id || response.data?.sessionId;

      if (!receivedSessionId) {
        setMessage("Interview started, but no session ID was returned by the server.");
        return;
      }

      setSessionId(String(receivedSessionId));

      let receivedQuestions = [];
      if (Array.isArray(response.data)) {
        receivedQuestions = response.data;
      } else if (Array.isArray(response.data?.questions)) {
        receivedQuestions = response.data.questions;
      } else if (response.data?.question) {
        receivedQuestions = [response.data.question];
      }

      if (receivedQuestions.length === 0) {
        setMessage("No interview questions were received from the server.");
        return;
      }

      setQuestions(receivedQuestions);
      setCurrentQuestion(0);
      setAnswer("");
      setTimeLeft(TOTAL_INTERVIEW_TIME_SECONDS);
      suppressRecognitionAutoSubmitRef.current = false;
      setInterviewStarted(true);
      setPage("interview");
    } catch (error) {
      console.error("Interview start error:", error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        setMessage(detail.map((item) => item?.msg || "Validation error").join(", "));
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else {
        setMessage("Unable to start interview. Check the FastAPI backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     SUBMIT ANSWER
  ======================================================= */

  const submitAnswer = async (event) => {
    if (event?.preventDefault) event.preventDefault();

    const timedOut = event?.timedOut === true;

    if (interviewCompletedRef.current) {
      console.warn("Ignoring answer submission: interview is completed.");
      return;
    }

    if (isSubmittingRef.current) {
      console.warn("Ignoring duplicate answer submission in progress.");
      return;
    }

    clearSpeechTimeouts();
    suppressRecognitionAutoSubmitRef.current = true;
    recognitionSessionIdRef.current += 1;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (err) { void err; }
      recognitionRef.current = null;
    }

    setIsListening(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAiSpeaking(false);

    const currentAnswer = (answerRef.current || answer).trim();
    const currentQuestionText = getQuestionText(questions[currentQuestion]);

    if (!currentAnswer && !timedOut) {
      suppressRecognitionAutoSubmitRef.current = false;
      setMessage("Please provide an answer before submitting.");
      return;
    }

    if (!candidateId || !sessionId) {
      suppressRecognitionAutoSubmitRef.current = false;
      setMessage("Interview session information is missing.");
      return;
    }

    if (!currentQuestionText) {
      suppressRecognitionAutoSubmitRef.current = false;
      setMessage("Question data is missing.");
      return;
    }

    isSubmittingRef.current = true;

    try {
      setLoading(true);
      setMessage("🤖 Gemini AI is evaluating your response...");

      const response = await axios.post(
        `${API}/interview/answer`,
        null,
        {
          params: {
            question: currentQuestionText,
            answer: currentAnswer,
            candidate_id: candidateId,
            session_id: sessionId,
            timed_out: timedOut,
          },
        }
      );

      const data = response.data || {};
      answerRef.current = "";
      setAnswer("");

      /* INTERVIEW COMPLETED */
      if (data.interview_completed === true) {
        markInterviewCompleted(true);
        suppressRecognitionAutoSubmitRef.current = true;
        clearSpeechTimeouts();
        setInterviewStarted(false);
        recognitionSessionIdRef.current += 1;

        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (err) { void err; }
          recognitionRef.current = null;
        }

        setIsListening(false);
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setAiSpeaking(false);

        setMessage("🎉 Interview completed! Generating comprehensive results...");
        await loadResults(candidateId, sessionId);
        setPage("results");
        return;
      }

      /* NEXT ADAPTIVE QUESTION */
      if (data.next_question) {
        suppressRecognitionAutoSubmitRef.current = false;
        const nextQuestion = data.next_question;
        setQuestions((previousQuestions) => [
          ...previousQuestions,
          nextQuestion,
        ]);
        setCurrentQuestion((previousIndex) => previousIndex + 1);
        setMessage("✅ Answer scored. Next question loaded.");
        return;
      }

      /* FALLBACK: PRELOADED QUESTIONS */
      if (currentQuestion < 19) {
        suppressRecognitionAutoSubmitRef.current = false;
        setCurrentQuestion((previousIndex) => previousIndex + 1);
        setMessage("✅ Answer scored. Next question loaded.");
        return;
      }

      /* REACHED END */
      markInterviewCompleted(true);
      suppressRecognitionAutoSubmitRef.current = true;
      clearSpeechTimeouts();
      setInterviewStarted(false);
      recognitionSessionIdRef.current += 1;

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (err) { void err; }
        recognitionRef.current = null;
      }

      setIsListening(false);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setAiSpeaking(false);

      setMessage("🎉 Interview completed! Generating comprehensive results...");
      await loadResults(candidateId, sessionId);
      setPage("results");
    } catch (error) {
      console.error("Answer submission error:", error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        setMessage(detail.map((item) => item?.msg || "Validation error").join(", "));
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else {
        setMessage("Unable to submit answer. Please try again.");
      }
      suppressRecognitionAutoSubmitRef.current = false;
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
  });

  /* =======================================================
     PERFORMANCE CALCULATION
  ======================================================= */

  const getPerformance = () => {
    if (!results || results.length === 0) {
      return { average: 0, score: 0, title: "No Results", letterGrade: "N/A" };
    }

    const scores = results
      .map((item) => Number(item?.score))
      .filter((score) => Number.isFinite(score));

    if (scores.length === 0) {
      return { average: 0, score: 0, title: "No Scores", letterGrade: "N/A" };
    }

    const averageScore = scores.reduce((total, score) => total + score, 0) / scores.length;
    const percentage = Math.min(100, Math.max(0, averageScore * 10));

    let title = "Needs Improvement";
    let letterGrade = "C";

    if (percentage >= 85) {
      title = "Excellent";
      letterGrade = "A+";
    } else if (percentage >= 70) {
      title = "Very Good";
      letterGrade = "A";
    } else if (percentage >= 55) {
      title = "Moderate";
      letterGrade = "B";
    }

    return {
      average: Math.round(percentage),
      score: Number(averageScore.toFixed(1)),
      title,
      letterGrade,
    };
  };

  const performance = getPerformance();

  /* =======================================================
     KEYBOARD SHORTCUT HANDLER (Ctrl+Enter to submit answer)
  ======================================================= */

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading && answer.trim() && !interviewCompleted) {
        submitAnswer(e);
      }
    }
  };

  /* =======================================================
     DASHBOARD (HOME) PAGE
  ======================================================= */

  const renderHome = () => {
    const displayName = authUser?.name || name || "Candidate";
    const candidateLabel = candidateId ? `#${candidateId}` : "Not registered";
    const skillLabel = skill ? skill.toUpperCase() : "GENERAL";

    return (
      <main className="workspace-page home-page">
        {/* Welcome Hero Banner - Cleaned up per request */}
        <section className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-kicker-row">
              <span className="section-kicker">
                <span className="pulse-dot"></span>
                AI CANDIDATE WORKSPACE
              </span>
            </div>

            <h1 className="hero-title">
              Welcome, <span className="highlight-text">{displayName}</span>
            </h1>
            <p className="hero-subtitle">
              Prepare for high-stakes technical interviews with adaptive AI questioning,
              speech evaluation, and resume-driven technical scenarios.
            </p>
          </div>
        </section>

        {/* 3 Metric Stat Cards with Custom Tech Icons */}
        <section className="stats-grid">
          <article className="stat-card stat-profile">
            <div className="stat-card-top">
              <div className="stat-icon-wrap purple">
                <ProfileBadgeIcon size={20} />
              </div>
              <span className="stat-badge">PROFILE</span>
            </div>
            <span className="stat-label">CANDIDATE ID</span>
            <strong className="stat-val">{candidateLabel}</strong>
            <small className="stat-hint">
              {candidateType === "technical"
                ? "Technical Engineering Track"
                : "Non-Technical Track"}
            </small>
          </article>

          <article className="stat-card stat-skill">
            <div className="stat-card-top">
              <div className="stat-icon-wrap cyan">
                <SkillBadgeIcon size={20} />
              </div>
              <span className="stat-badge">EVALUATION FOCUS</span>
            </div>
            <span className="stat-label">PRIMARY SKILL</span>
            <strong className="stat-val">{skillLabel}</strong>
            <small className="stat-hint">
              {resumeUploaded ? "Resume Intelligence Active" : "General Technical Profile"}
            </small>
          </article>

          <article className="stat-card stat-status">
            <div className="stat-card-top">
              <div className="stat-icon-wrap emerald">
                <StatusBadgeIcon size={20} />
              </div>
              <span className="stat-badge">SYSTEM STATUS</span>
            </div>
            <span className="stat-label">ASSESSMENT STATE</span>
            <strong className="stat-val">
              {interviewCompleted ? "RESULTS READY" : "READY TO LAUNCH"}
            </strong>
            <small className="stat-hint">
              {interviewCompleted
                ? "Click Results tab to inspect score breakdown"
                : "15 min • 20 adaptive questions"}
            </small>
          </article>
        </section>

        {/* Balanced 2-Column Dashboard Grid: Resume Studio & Launchpad */}
        <section className="dashboard-main-grid balanced-grid">
          {/* Left Column: Resume Intelligence Studio */}
          <article className="dashboard-card resume-studio-card full-height-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">RESUME INTELLIGENCE</span>
                <h2>{resumeUploaded ? "Resume Connected" : "Personalize Your Interview"}</h2>
              </div>
              <span className={`status-pill ${resumeUploaded ? "success" : "neutral"}`}>
                {resumeUploaded ? "● ANALYZED" : "OPTIONAL"}
              </span>
            </div>

            <p className="card-desc">
              Upload your resume to extract skills, project architecture, and work history.
              INTERVIA will tailor technical questions specifically to your background.
            </p>

            <div className="resume-dropzone">
              <div className="resume-file-icon">📄</div>
              <div className="resume-meta">
                <strong>{resumeName || "No resume uploaded yet"}</strong>
                <span>PDF or DOCX format • Automatic skill parsing</span>
              </div>

              <div className="resume-controls">
                <label className="outline-btn file-select-label" htmlFor="resume-upload">
                  Choose File
                </label>
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
                  className="iv-primary-button upload-btn"
                  onClick={uploadResume}
                  disabled={resumeUploading || !resumeFile}
                >
                  {resumeUploading ? "Analyzing..." : resumeUploaded ? "Re-upload" : "Upload & Analyze"}
                </button>
              </div>
            </div>

            <div className="feature-bullets">
              <span>✦ Dynamic Project Scenarios</span>
              <span>✦ Framework-Specific Questions</span>
              <span>✦ Real-Time Deep Dives</span>
            </div>

            {message && <div className="inline-message">{message}</div>}
          </article>

          {/* Right Column: Assessment Launchpad */}
          <article className="dashboard-card launchpad-card full-height-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">ASSESSMENT LAUNCHPAD</span>
                <h2>Ready to Test Your Engineering Skills?</h2>
              </div>
            </div>

            <p className="card-desc">
              Experience a complete 20-question structured interview with adaptive difficulty,
              overall 15-minute countdown, and AI scoring.
            </p>

            <div className="assessment-specs">
              <div className="spec-box">
                <span className="spec-label">QUESTIONS</span>
                <strong className="spec-value">20</strong>
                <span className="spec-sub">Tech + Aptitude</span>
              </div>
              <div className="spec-box">
                <span className="spec-label">TIMER</span>
                <strong className="spec-value">15 min</strong>
                <span className="spec-sub">Countdown</span>
              </div>
              <div className="spec-box">
                <span className="spec-label">VOICE</span>
                <strong className="spec-value">Active</strong>
                <span className="spec-sub">Chrome STT</span>
              </div>
            </div>

            <button
              type="button"
              className="iv-primary-button start-interview-btn"
              onClick={startInterview}
              disabled={loading}
            >
              {loading ? "Initializing Interview Environment..." : "Begin Interview Now →"}
            </button>

            <div className="launchpad-guarantee">
              <span>🔒 Your responses are securely evaluated and private</span>
            </div>
          </article>
        </section>

        {/* Profile Setup Section if candidate not registered yet */}
        {!candidateId && (
          <section className="dashboard-card setup-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">INITIAL SETUP REQUIRED</span>
                <h2>Complete Candidate Registration</h2>
              </div>
            </div>
            <p className="card-desc">
              Choose your assessment profile track and focus skill to begin mock interviews.
            </p>
            <form
              className="setup-form-grid"
              onSubmit={async (event) => {
                event.preventDefault();
                await registerCandidate(event);
              }}
            >
              <div className="field-box">
                <label htmlFor="candidate-name">FULL NAME</label>
                <input
                  id="candidate-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="field-box">
                <label htmlFor="candidate-skill">PRIMARY SKILL</label>
                <select
                  id="candidate-skill"
                  value={skill}
                  onChange={(event) => setSkill(event.target.value)}
                >
                  <option value="">Select Primary Skill</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              <div className="field-box">
                <label htmlFor="candidate-type">TRACK</label>
                <select
                  id="candidate-type"
                  value={candidateType}
                  onChange={(event) => setCandidateType(event.target.value)}
                >
                  <option value="technical">Technical Track</option>
                  <option value="non_technical">Non-Technical Track</option>
                </select>
              </div>
              <button className="iv-primary-button setup-btn" type="submit">
                Save &amp; Activate →
              </button>
            </form>
          </section>
        )}
      </main>
    );
  };

  /* =======================================================
     INTERVIEW PAGE (Camera option removed, space utilized)
  ======================================================= */

  const renderInterview = () => {
    if (!candidateId) {
      return (
        <main className="workspace-page centered-page">
          <section className="empty-state-card">
            <InterviaLogo size={48} />
            <span className="section-kicker">ASSESSMENT LOCKED</span>
            <h1>Candidate Profile Required</h1>
            <p>Please register your candidate profile on the dashboard before starting an interview.</p>
            <button
              type="button"
              className="iv-primary-button"
              onClick={() => setPage("home")}
            >
              Go to Dashboard →
            </button>
          </section>
        </main>
      );
    }

    if (questions.length === 0) {
      return (
        <main className="workspace-page centered-page">
          <section className="empty-state-card">
            <InterviaLogo size={48} />
            <span className="section-kicker">LIVE AI INTERVIEW</span>
            <h1>Ready to Launch Assessment?</h1>
            <p>Your technical questions will be generated from your profile and uploaded resume.</p>
            <button
              type="button"
              className="iv-primary-button"
              onClick={startInterview}
              disabled={loading}
            >
              {loading ? "Preparing Interview Session..." : "Start Interview →"}
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
    const isTimerUrgent = timeLeft < 120; // under 2 minutes

    return (
      <main className="workspace-page interview-page">
        <section className="interview-shell">
          {/* Top HUD: Status, Timer & Progress */}
          <div className="interview-hud">
            <div className="hud-title-col">
              <span className="section-kicker">
                <span className="pulse-dot live"></span>
                LIVE AI INTERVIEW ASSESSMENT
              </span>
              <h1 className="hud-heading">Technical Simulation</h1>
            </div>

            <div className="hud-metrics">
              {/* Animated Timer Pill */}
              <div className={`timer-box ${isTimerUrgent ? "urgent" : ""}`}>
                <span className="timer-icon">⏱</span>
                <span className="timer-digits">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span className="timer-tag">{isTimerUrgent ? "Hurry!" : "Left"}</span>
              </div>

              {/* Question Counter Pill */}
              <div className="question-counter-box">
                <span className="counter-label">Question</span>
                <span className="counter-val">
                  <strong>{currentQuestion + 1}</strong> / 20
                </span>
              </div>
            </div>
          </div>

          {/* Animated Gradient Progress Track */}
          <div className="hud-progress-track">
            <div
              className="hud-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Main 2-Chamber Split View: Camera removed, Left chamber fully utilized */}
          <section className="interview-chambers">
            {/* Left Chamber: AI Interviewer */}
            <div className="chamber-left ai-chamber">
              <div className="chamber-header">
                <div className="ai-persona-badge">
                  <InterviaLogo size={36} />
                  <div>
                    <strong>AI Interviewer</strong>
                    <span>Evaluation Engine</span>
                  </div>
                </div>

                <div className="ai-status-indicator">
                  {aiSpeaking ? (
                    <span className="speaking-tag">🔊 Speaking...</span>
                  ) : isListening ? (
                    <span className="listening-tag">🎙️ Listening...</span>
                  ) : (
                    <span className="ready-tag">● Standing By</span>
                  )}
                </div>
              </div>

              {/* Dynamic Sound Wave Equalizer */}
              <div className={`soundwave-bar-container ${aiSpeaking || isListening ? "active" : ""}`}>
                <span className="sw-bar b1"></span>
                <span className="sw-bar b2"></span>
                <span className="sw-bar b3"></span>
                <span className="sw-bar b4"></span>
                <span className="sw-bar b5"></span>
                <span className="sw-bar b6"></span>
                <span className="sw-bar b7"></span>
                <span className="sw-bar b8"></span>
                <span className="sw-bar b9"></span>
              </div>

              {/* Expanded Question Display Card */}
              <div className="question-display-card expanded-card">
                <div className="question-meta-row">
                  <span className="question-idx-pill">Q{String(currentQuestion + 1).padStart(2, "0")}</span>
                  <span className="question-type-pill">
                    {currentQuestion < 12
                      ? "Technical & Adaptive"
                      : currentQuestion < 16
                      ? "Problem Solving / Algorithms"
                      : "Analytical & Aptitude"}
                  </span>
                </div>

                <h2 className="question-text">{questionText}</h2>

                <div className="question-actions">
                  <button
                    type="button"
                    className="replay-audio-btn"
                    onClick={() => speakQuestion(questionText)}
                    disabled={loading || aiSpeaking}
                  >
                    🔊 Repeat Question
                  </button>
                </div>
              </div>

              {/* Interview Best Practice Hint Box (replaces camera cleanly) */}
              <div className="interview-guide-box">
                <div className="guide-icon">💡</div>
                <div className="guide-text">
                  <strong>Interview Tips</strong>
                  <p>
                    Structure your answer clearly with context, approaches, and trade-offs.
                    You may speak naturally using voice input or type your solution directly.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Chamber: Candidate Response Studio */}
            <form onSubmit={submitAnswer} className="chamber-right response-chamber">
              <div className="response-header">
                <span className="response-title">YOUR RESPONSE</span>
                <span className="response-tip">Type or use Voice Input</span>
              </div>

              <div className="textarea-wrapper">
                <textarea
                  id="answer-input"
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    answerRef.current = event.target.value;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your technical response here, or click 'Answer by Voice' to speak..."
                  rows="12"
                  disabled={loading}
                />
                <div className="textarea-footer">
                  <span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span className="shortcut-hint">Tip: Press Ctrl + Enter to submit</span>
                </div>
              </div>

              {/* Voice Controls Toolbar */}
              <div className="voice-toolbar">
                <button
                  type="button"
                  className={`voice-record-btn ${isListening ? "recording" : ""}`}
                  onClick={handleVoiceAnswer}
                  disabled={loading || isListening || interviewCompleted}
                >
                  {isListening ? (
                    <>
                      <span className="rec-dot"></span>
                      Recording... Speak Now
                    </>
                  ) : (
                    <>
                      <span>🎙️</span> Answer by Voice
                    </>
                  )}
                </button>

                {isListening && (
                  <button
                    type="button"
                    className="stop-listening-btn"
                    onClick={() => {
                      suppressRecognitionAutoSubmitRef.current = true;
                      clearSpeechTimeouts();
                      recognitionSessionIdRef.current += 1;
                      if (recognitionRef.current) {
                        try { recognitionRef.current.stop(); } catch (err) { void err; }
                        recognitionRef.current = null;
                      }
                      setIsListening(false);
                      setMessage(
                        answerRef.current.trim()
                          ? "Voice recording stopped. Review answer before submitting."
                          : "Voice input stopped."
                      );
                    }}
                  >
                    ⏹️ Stop Recording
                  </button>
                )}

                {!speechSupported && (
                  <span className="unsupported-speech-note">
                    Voice input is best supported in Google Chrome.
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                className="iv-primary-button submit-response-btn"
                type="submit"
                disabled={loading || !answer.trim() || interviewCompleted}
              >
                {loading ? (
                  <span className="btn-spinner-wrap">
                    <span className="spinner"></span>
                    Evaluating with AI...
                  </span>
                ) : currentQuestion === 19 ? (
                  "Submit Final Answer & Finish →"
                ) : (
                  "Submit Answer →"
                )}
              </button>

              <div className="response-security-note">
                <span>🛡️ Answers are assessed in real-time and saved to Session #{sessionId}</span>
              </div>
            </form>
          </section>

          {message && (
            <div className="inline-message interview-toast">
              <span>{message}</span>
            </div>
          )}
        </section>
      </main>
    );
  };

  /* =======================================================
     RESULTS PAGE (Font style matched, developer block removed)
  ======================================================= */

  const renderResults = () => {
    const score = performance.average;
    const answered = results.length;
    const earned = results.reduce(
      (sum, item) => sum + Number(item?.score || 0),
      0
    );

    const zeroScores = results.filter(
      (item) => Number(item?.score || 0) === 0
    ).length;

    const resultSlots = Array.from(
      { length: 20 },
      (_, index) => results[index] || null
    );

    const selectedItem = resultSlots[selectedResult];

    return (
      <main className="workspace-page results-page-v2">
        {/* Results Header */}
        <section className="results-header-banner">
          <div>
            <span className="section-kicker">PERFORMANCE EVALUATION</span>
            <h1 className="results-title">Interview Assessment Report</h1>
            <p className="results-subtitle">
              Comprehensive AI scoring, response critique, and model answer recommendations.
            </p>
          </div>

          <div className="results-header-actions">
            {candidateId && (
              <span className="candidate-pill">Candidate #{candidateId}</span>
            )}
            <button
              type="button"
              className="iv-primary-button retake-btn"
              onClick={startInterview}
              disabled={loading}
            >
              Retake Interview →
            </button>
          </div>
        </section>

        {/* 4 Performance Metric Cards */}
        <section className="results-kpi-grid">
          <article className="result-kpi-card overall-kpi">
            <div className="kpi-score-ring">
              <span className="ring-number">{score}%</span>
            </div>
            <div className="kpi-text">
              <span className="kpi-label">OVERALL ACCURACY</span>
              <strong className="kpi-title">{performance.title}</strong>
              <small className="kpi-sub">Grade: {performance.letterGrade}</small>
            </div>
          </article>

          <article className="result-kpi-card">
            <span className="kpi-label">QUESTIONS ANSWERED</span>
            <strong className="kpi-number">
              {answered} <span className="kpi-dim">/ 20</span>
            </strong>
            <small className="kpi-sub">Full interview coverage</small>
          </article>

          <article className="result-kpi-card">
            <span className="kpi-label">AVERAGE QUESTION SCORE</span>
            <strong className="kpi-number">
              {answered ? (earned / answered).toFixed(1) : "0.0"}{" "}
              <span className="kpi-dim">/ 10</span>
            </strong>
            <small className="kpi-sub">Evaluated by AI Engine</small>
          </article>

          <article className="result-kpi-card alert-kpi">
            <span className="kpi-label">QUESTIONS NEEDING REVIEW</span>
            <strong className="kpi-number alert-text">{zeroScores}</strong>
            <small className="kpi-sub">Scored 0 or skipped</small>
          </article>
        </section>

        {/* Question Review Layout */}
        {results.length > 0 ? (
          <section className="results-review-split">
            {/* Left: 20 Question Selector Grid */}
            <article className="dashboard-card question-grid-panel">
              <div className="panel-title-row">
                <div>
                  <span className="section-kicker">QUESTION SELECTOR</span>
                  <h3>All 20 Questions</h3>
                </div>
                <span className="active-idx-tag">
                  Viewing Q{selectedResult + 1}
                </span>
              </div>

              <div className="matrix-20-grid">
                {resultSlots.map((result, index) => {
                  const itemScore = result ? Number(result.score || 0) : null;
                  const isSelected = selectedResult === index;
                  const statusClass = result
                    ? itemScore >= 7
                      ? "good"
                      : itemScore >= 4
                      ? "mid"
                      : "low"
                    : "unanswered";

                  return (
                    <button
                      type="button"
                      key={index}
                      className={`matrix-box ${isSelected ? "selected" : ""} ${statusClass}`}
                      onClick={() => setSelectedResult(index)}
                    >
                      <span className="m-q">Q{index + 1}</span>
                      <strong className="m-score">
                        {result ? `${itemScore}/10` : "--"}
                      </strong>
                    </button>
                  );
                })}
              </div>

              <div className="matrix-legend">
                <span className="legend-item">
                  <span className="legend-dot good"></span> 7-10 High
                </span>
                <span className="legend-item">
                  <span className="legend-dot mid"></span> 4-6 Medium
                </span>
                <span className="legend-item">
                  <span className="legend-dot low"></span> 0-3 Low
                </span>
              </div>
            </article>

            {/* Right: Selected Question Deep Dive */}
            <article className="dashboard-card question-detail-panel">
              {selectedItem ? (
                <>
                  <div className="detail-top-bar">
                    <div>
                      <span className="section-kicker">QUESTION {selectedResult + 1} OF 20</span>
                      <h2 className="detail-question-text">
                        {selectedItem.question ||
                          selectedItem.question_text ||
                          "Interview Question"}
                      </h2>
                    </div>

                    <div
                      className={`detail-score-badge ${
                        Number(selectedItem.score || 0) >= 7
                          ? "good"
                          : Number(selectedItem.score || 0) >= 4
                          ? "mid"
                          : "low"
                      }`}
                    >
                      <span>SCORE</span>
                      <strong>{Number(selectedItem.score || 0)} / 10</strong>
                    </div>
                  </div>

                  <div className="detail-sections-scroll">
                    {/* Candidate Submitted Answer - Unified Font Styling */}
                    <div className="detail-block answer-block">
                      <span className="block-label">YOUR SUBMITTED RESPONSE</span>
                      <p className="block-content clean-answer-text">
                        {selectedItem.answer || "No answer was recorded for this question."}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="detail-block feedback-block">
                      <span className="block-label">🤖 AI EVALUATION FEEDBACK</span>
                      <p className="block-content">
                        {selectedItem.feedback ||
                          "No detailed feedback was returned for this answer."}
                      </p>
                    </div>

                    {/* Strengths */}
                    {selectedItem.strengths && (
                      <div className="detail-block strengths-block">
                        <span className="block-label">✓ KEY STRENGTHS</span>
                        <p className="block-content">
                          {Array.isArray(selectedItem.strengths)
                            ? selectedItem.strengths.join(" • ")
                            : selectedItem.strengths}
                        </p>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {selectedItem.weaknesses && (
                      <div className="detail-block weaknesses-block">
                        <span className="block-label">⚠️ AREAS FOR IMPROVEMENT</span>
                        <p className="block-content">
                          {Array.isArray(selectedItem.weaknesses)
                            ? selectedItem.weaknesses.join(" • ")
                            : selectedItem.weaknesses}
                        </p>
                      </div>
                    )}

                    {/* Ideal Model Answer */}
                    {selectedItem.ideal_answer && (
                      <div className="detail-block ideal-block">
                        <span className="block-label">💡 RECOMMENDED MODEL ANSWER</span>
                        <p className="block-content">
                          {selectedItem.ideal_answer}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="detail-empty">
                  <InterviaLogo size={42} />
                  <h3>Question not answered</h3>
                  <p>This question was not reached or completed in this assessment session.</p>
                </div>
              )}
            </article>
          </section>
        ) : (
          <section className="empty-results-box">
            <InterviaLogo size={48} />
            <span className="section-kicker">NO RESULTS RECORDED</span>
            <h2>Take Your First Mock Interview</h2>
            <p>Your question-by-question scoring and AI feedback will appear here.</p>
            <button
              type="button"
              className="iv-primary-button"
              onClick={startInterview}
              disabled={loading}
            >
              Start Interview →
            </button>
          </section>
        )}

        {message && <div className="inline-message">{message}</div>}
      </main>
    );
  };

  /* =======================================================
     AUTH GUARD
  ======================================================= */

  if (!authUser) {
    return (
      <div className="app unauthenticated-app">
        <AuthView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  /* =======================================================
     AUTHENTICATED APP SHELL
  ======================================================= */

  return (
    <div className="app authenticated-app">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <InterviaLogo size={34} />
          <div className="brand-copy">
            <strong>INTERVIA</strong>
            <span>AI Assessment Suite</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button
            className={`nav-item ${page === "home" ? "active" : ""}`}
            onClick={() => handleNavigate("home")}
            type="button"
          >
            <DashboardIcon size={18} className="nav-icon" />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${page === "interview" ? "active" : ""}`}
            onClick={() => handleNavigate("interview")}
            type="button"
          >
            <InterviewIcon size={18} className="nav-icon" />
            <span>Interview</span>
          </button>

          <button
            className={`nav-item ${page === "results" ? "active" : ""}`}
            onClick={() => handleNavigate("results")}
            type="button"
          >
            <ResultsIcon size={18} className="nav-icon" />
            <span>Results</span>
          </button>
        </nav>

        {/* User Card & Logout (Sidebar Developer card removed per request) */}
        <div className="sidebar-user">
          <div className="avatar">
            {(authUser?.name || name || "C").charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <strong>{authUser?.name || name || "Candidate"}</strong>
            <span>{candidateType === "technical" ? "Technical" : "Non-Technical"}</span>
          </div>
          <button
            type="button"
            className="logout-icon-btn"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            ↪
          </button>
        </div>
      </aside>

      {/* Main Shell */}
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <InterviaLogo size={28} />
            <strong>INTERVIA</strong>
          </div>

          <div className="topbar-right">
            {/* Developer Contact Quick Action in Topbar (Preserved cleanly) */}
            <button
              type="button"
              className="topbar-dev-pill"
              onClick={() => setIsDevModalOpen(true)}
            >
              <span className="pill-dot"></span>
              👨‍💻 Developer Info
            </button>

            <div className="topbar-user-pill">
              <span className="topbar-user-greeting">
                Signed in as <strong>{authUser?.name || name || "Candidate"}</strong>
              </span>
            </div>

            <button
              type="button"
              className="topbar-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {page === "home" && renderHome()}
        {page === "interview" && renderInterview()}
        {page === "results" && renderResults()}
      </div>

      {/* Developer Profile & Contact Modal */}
      <DeveloperModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </div>
  );
}

export default App;
