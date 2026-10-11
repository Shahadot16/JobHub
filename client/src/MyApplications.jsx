
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const APPLICATIONS_API_URL =
  "http://localhost:5000/api/applications/my";

function MyApplications({ onBack }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("jobhubToken");

      if (!token) {
        throw new Error("Please log in to view your applications.");
      }

      const response = await fetch(APPLICATIONS_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Failed to load your applications."
        );
      }

      setApplications(
        Array.isArray(data.applications) ? data.applications : []
      );
    } catch (err) {
      setError(
        err.message || "Unable to load applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    const normalizedStatus = (status || "pending").toLowerCase();

    if (normalizedStatus === "accepted") return "status-accepted";
    if (normalizedStatus === "rejected") return "status-rejected";

    return "status-pending";
  };

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home" onClick={onBack}>
          <span className="brand-icon">J</span>
          <span>JobHub</span>
        </a>

        <nav className="nav-links">
          <button type="button" className="login-btn" onClick={onBack}>
            Home
          </button>
          <span>My Applications</span>
        </nav>

        <button
          type="button"
          className="primary-btn"
          onClick={fetchApplications}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      <main className="applications-page">
        <section className="applications-heading">
          <span className="eyebrow">YOUR CAREER JOURNEY</span>
          <h1>My Applications</h1>
          <p>
            Track the jobs you have applied for and check your application
            status.
          </p>

          {!loading && !error && (
            <div className="applications-summary">
              {applications.length}{" "}
              {applications.length === 1 ? "application" : "applications"}
              {" submitted"}
            </div>
          )}
        </section>

        {loading && (
          <p className="message">Loading your applications...</p>
        )}

        {error && (
          <div className="message error">
            <p>{error}</p>
            <button
              type="button"
              className="primary-btn"
              onClick={fetchApplications}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <section className="applications-empty">
            <h2>No applications yet</h2>
            <p>
              When you apply for a job, it will appear here.
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={onBack}
            >
              Explore jobs
            </button>
          </section>
        )}

        {!loading && !error && applications.length > 0 && (
          <section className="applications-list">
            {applications.map((application) => {
              const job =
                application.job &&
                typeof application.job === "object"
                  ? application.job
                  : {};

              const status = (
                application.status || "pending"
              ).toLowerCase();

              return (
                <article
                  className="application-card"
                  key={application._id}
                >
                  <div className="application-card-top">
                    <div className="application-company-icon">
                      {(job.company || "J").charAt(0).toUpperCase()}
                    </div>

                    <span
                      className={`application-status ${getStatusClass(status)}`}
                    >
                      {status}
                    </span>
                  </div>

                  <h2>{job.title || "Job details unavailable"}</h2>

                  <p className="application-company">
                    {job.company || "Company not available"}
                  </p>

                  <div className="application-details">
                    <p>
                      <strong>Location:</strong>{" "}
                      {job.location || "Not specified"}
                    </p>

                    <p>
                      <strong>Salary:</strong>{" "}
                      {job.salary || "Negotiable"}
                    </p>

                    <p>
                      <strong>Applied on:</strong>{" "}
                      {formatDate(application.createdAt)}
                    </p>
                  </div>

                  {application.coverLetter && (
                    <p className="application-cover-letter">
                      <strong>Cover letter:</strong>{" "}
                      {application.coverLetter}
                    </p>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>

      <footer className="footer">
        <strong>JobHub</strong>
        <span>Connecting people with opportunities.</span>
        <span>© 2026 JobHub</span>
      </footer>
    </div>
  );
}

export default MyApplications;
