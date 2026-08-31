function Navbar({ onNavigate }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">AI</div>

        <div>
          <h2>AI Mock Interview</h2>
          <span>INTELLIGENT ASSESSMENT PLATFORM</span>
        </div>
      </div>

      <div className="navbar-links">
        <button
          type="button"
          onClick={() => onNavigate("home")}
        >
          <span>01</span>
          Home
        </button>

        <button
          type="button"
          onClick={() => onNavigate("interview")}
        >
          <span>02</span>
          Interview
        </button>

        <button
          type="button"
          onClick={() => onNavigate("results")}
        >
          <span>03</span>
          Results
        </button>
      </div>
    </nav>
  );
}

export default Navbar;