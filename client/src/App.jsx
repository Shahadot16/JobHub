
import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

import AuthForm from "./AuthForm.jsx";
import MyApplications from "./MyApplications.jsx";
import RecruiterDashboard from "./RecruiterDashboard.jsx";

const API_URL = "http://localhost:5000/api/jobs";
const APPLICATION_API_URL = "http://localhost:5000/api/applications";

function App() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  const [authScreen, setAuthScreen] = useState(false);
  const [showMyApplications, setShowMyApplications] = useState(false);
  const [showRecruiterDashboard, setShowRecruiterDashboard] =
    useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem("jobhubUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationError, setApplicationError] = useState("");

  // Fetch jobs from backend
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load jobs.");
      }

      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load jobs. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Close the job details modal with Escape
  useEffect(() => {
    if (!selectedJob) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !applying) {
        setSelectedJob(null);
        setApplicationMessage("");
        setApplicationError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedJob, applying]);

  // Search and location filters
  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const place = location.trim().toLowerCase();

    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.company,
        job.description,
        ...(Array.isArray(job.skills) ? job.skills : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesLocation = (job.location || "")
        .toLowerCase()
        .includes(place);

      return (
        job.isActive !== false &&
        matchesSearch &&
        matchesLocation
      );
    });
  }, [jobs, search, location]);

  const formatDeadline = (deadline) => {
    if (!deadline) return "Not specified";

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) return "Not specified";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (deadline) => {
    if (!deadline) return false;

    const date = new Date(deadline);

    return !Number.isNaN(date.getTime()) && date < new Date();
  };

  const openJobDetails = (job) => {
    setSelectedJob(job);
    setApplicationMessage("");
    setApplicationError("");
  };

  const closeJobDetails = () => {
    if (applying) return;

    setSelectedJob(null);
    setApplicationMessage("");
    setApplicationError("");
  };

  // Authentication
  const handleAuthSuccess = ({ token, user }) => {
    sessionStorage.setItem("jobhubToken", token);
    sessionStorage.setItem("jobhubUser", JSON.stringify(user));

    setCurrentUser(user);
    setAuthScreen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("jobhubToken");
    sessionStorage.removeItem("jobhubUser");

    setCurrentUser(null);
    setAuthScreen(false);
    setShowMyApplications(false);
    setShowRecruiterDashboard(false);
    setSelectedJob(null);
    setApplicationMessage("");
    setApplicationError("");
  };

  // Submit a job application
  const handleApply = async () => {
    if (!selectedJob || applying) return;

    const token = sessionStorage.getItem("jobhubToken");

    if (!token || !currentUser) {
      setSelectedJob(null);
      setApplicationMessage("");
      setApplicationError("");
      setAuthScreen(true);
      return;
    }

    if (currentUser.role !== "jobseeker") {
      setApplicationError("Only jobseekers can apply for jobs.");
      setApplicationMessage("");
      return;
    }

    if (isExpired(selectedJob.deadline)) {
      setApplicationError(
        "The application deadline has passed. Applications are closed."
      );
      setApplicationMessage("");
      return;
    }

    setApplying(true);
    setApplicationMessage("");
    setApplicationError("");

    try {
      const response = await fetch(APPLICATION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: selectedJob._id,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("jobhubToken");
        sessionStorage.removeItem("jobhubUser");
        setCurrentUser(null);

        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Failed to submit your application."
        );
      }

      setApplicationMessage(
        data.message || "Application submitted successfully!"
      );
    } catch (err) {
      setApplicationError(
        err.message || "Unable to connect to the application server."
      );
    } finally {
      setApplying(false);
    }
  };

  // Login screen
  if (authScreen) {
    return (
      <AuthForm
        onBack={() => setAuthScreen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // Jobseeker applications screen
  if (showMyApplications) {
    if (currentUser?.role !== "jobseeker") {
      setShowMyApplications(false);
      return null;
    }

    return (
      <MyApplications
        onBack={() => setShowMyApplications(false)}
      />
    );
  }

  // Recruiter dashboard screen
  if (showRecruiterDashboard) {
    if (currentUser?.role !== "recruiter") {
      setShowRecruiterDashboard(false);
      return null;
    }

    return (
      <RecruiterDashboard
        currentUser={currentUser}
        onBack={() => setShowRecruiterDashboard(false)}
      />
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">J</span>
          <span>JobHub</span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#jobs">Find Jobs</a>
          <a href="#about">About</a>

          {currentUser?.role === "jobseeker" && (
            <button
              type="button"
              className="login-btn"
              onClick={() => setShowMyApplications(true)}
            >
              My Applications
            </button>
          )}

          {currentUser?.role === "recruiter" && (
            <button
              type="button"
              className="login-btn"
              onClick={() => setShowRecruiterDashboard(true)}
            >
              Recruiter Dashboard
            </button>
          )}
        </nav>

        <div className="nav-actions">
          {currentUser ? (
            <>
              <span className="login-btn">
                {currentUser.name} ({currentUser.role})
              </span>

              <button
                type="button"
                className="primary-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="login-btn"
                onClick={() => setAuthScreen(true)}
              >
                Login
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={() => setAuthScreen(true)}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              YOUR NEXT OPPORTUNITY STARTS HERE
            </span>

            <h1>
              Find work that
              <span> moves you forward.</span>
            </h1>

            <p>
              Discover opportunities, connect with great companies,
              and take the next step in your career with JobHub.
            </p>

            <a className="hero-btn" href="#jobs">
              Explore jobs →
            </a>

            <div className="hero-stats">
              <div>
                <strong>Career</strong>
                <span>Growth opportunities</span>
              </div>

              <div>
                <strong>Trusted</strong>
                <span>Job applications</span>
              </div>

              <div>
                <strong>Simple</strong>
                <span>Job discovery</span>
              </div>
            </div>
          </div>

          <div className="featured-wrap">
            <div className="featured-card">
              <span className="muted">Featured opportunity</span>
              <h2>Build your future</h2>
              <hr />

              {jobs.length > 0 ? (
                <>
                  <div className="featured-job">
                    <span className="company-icon">
                      {(jobs[0].company || "J")
                        .charAt(0)
                        .toUpperCase()}
                    </span>

                    <div>
                      <strong>{jobs[0].title}</strong>
                      <p>{jobs[0].company}</p>
                    </div>
                  </div>

                  <div className="skill-tags">
                    {(jobs[0].skills || [])
                      .slice(0, 3)
                      .map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                  </div>

                  <hr />

                  <div className="featured-footer">
                    <div>
                      <strong>{jobs[0].salary || "Negotiable"}</strong>
                      <p>Salary</p>
                    </div>

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => openJobDetails(jobs[0])}
                    >
                      View details
                    </button>
                  </div>
                </>
              ) : (
                <p className="message">
                  {loading
                    ? "Loading featured job..."
                    : "No featured job available yet."}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="jobs-section" id="jobs">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE OPPORTUNITIES</span>
              <h2>Find your next job</h2>
              <p>
                Search roles that match your skills and ambitions.
              </p>
            </div>

            <span className="job-count">
              {filteredJobs.length} opportunities shown
            </span>
          </div>

          <div className="search-bar">
            <input
              type="text"
              aria-label="Search jobs"
              placeholder="Job title, company or skill"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <input
              type="text"
              aria-label="Filter by location"
              placeholder="City or remote"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />

            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setSearch("");
                setLocation("");
              }}
            >
              Clear filters
            </button>
          </div>

          {loading && (
            <p className="message">Loading jobs...</p>
          )}

          {error && (
            <div className="message error">
              <p>{error}</p>
              <button
                type="button"
                className="primary-btn"
                onClick={fetchJobs}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredJobs.length === 0 && (
            <p className="message">No jobs match your search.</p>
          )}

          <div className="job-grid">
            {filteredJobs.map((job) => (
              <article className="job-card" key={job._id}>
                <div className="job-card-top">
                  <span className="company-icon">
                    {(job.company || "J")
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span className="job-type">
                    {(job.jobType || "Full-time").replace(/-/g, " ")}
                  </span>
                </div>

                <h3>{job.title}</h3>
                <p className="company-name">{job.company}</p>

                <div className="job-meta">
                  <p>⌖ {job.location || "Location not specified"}</p>
                  <p>৳ {job.salary || "Negotiable"}</p>
                </div>

                <div className="category-tag">
                  {(job.skills || []).slice(0, 3).join(" · ") ||
                    "Explore this opportunity"}
                </div>

                <button
                  type="button"
                  className="details-btn"
                  onClick={() => openJobDetails(job)}
                >
                  View details →
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <div>
            <span className="eyebrow">YOUR NEXT CHAPTER</span>
            <h2>The right opportunity can change everything.</h2>
          </div>

          <div>
            <p>
              JobHub brings job seekers and recruiters together.
              Explore roles, find talent, and manage applications
              through one connected platform.
            </p>

            <a href="#jobs">Explore opportunities →</a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <strong>JobHub</strong>
        <span>Connecting people with opportunities.</span>
        <span>© 2026 JobHub</span>
      </footer>

      {selectedJob && (
        <div
          className="modal-overlay"
          onClick={closeJobDetails}
        >
          <section
            className="job-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close job details"
              onClick={closeJobDetails}
              disabled={applying}
            >
              ×
            </button>

            <span className="eyebrow">JOB DETAILS</span>

            <h2 id="job-modal-title">{selectedJob.title}</h2>
            <p className="company-name">{selectedJob.company}</p>

            <div className="modal-meta">
              <p>
                <strong>Location:</strong>{" "}
                {selectedJob.location || "Not specified"}
              </p>

              <p>
                <strong>Salary:</strong>{" "}
                {selectedJob.salary || "Negotiable"}
              </p>

              <p>
                <strong>Job type:</strong>{" "}
                {(selectedJob.jobType || "Not specified").replace(
                  /-/g,
                  " "
                )}
              </p>

              <p>
                <strong>Application deadline:</strong>{" "}
                {formatDeadline(selectedJob.deadline)}
              </p>
            </div>

            <h3>About this role</h3>
            <p className="modal-description">
              {selectedJob.description ||
                "No description has been provided for this job."}
            </p>

            <h3>Required skills</h3>
            <div className="skill-tags">
              {(selectedJob.skills || []).length > 0 ? (
                selectedJob.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))
              ) : (
                <span>Not specified</span>
              )}
            </div>

            {applicationMessage && (
              <p className="message" role="status">
                {applicationMessage}
              </p>
            )}

            {applicationError && (
              <p className="message error" role="alert">
                {applicationError}
              </p>
            )}

            {isExpired(selectedJob.deadline) ? (
              <p className="message error">
                The application deadline has passed. Applications are closed.
              </p>
            ) : (
              <button
                type="button"
                className="primary-btn modal-action"
                onClick={handleApply}
                disabled={applying || Boolean(applicationMessage)}
              >
                {applying
                  ? "Submitting application..."
                  : applicationMessage
                    ? "Application submitted"
                    : "Apply for this job"}
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
