import { useCallback, useEffect, useState } from "react";
import "./App.css";

const JOBS_API_URL = "http://localhost:5000/api/jobs";
const APPLICATIONS_API_URL = "http://localhost:5000/api/applications";

const EMPTY_JOB_FORM = {
  title: "",
  company: "",
  description: "",
  location: "",
  salary: "",
  jobType: "full-time",
  skills: "",
  deadline: "",
};

function isJobExpired(deadline) {
  if (!deadline) return false;

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return true;

  date.setHours(23, 59, 59, 999);
  return date < new Date();
}

function getJobStatus(job) {
  if (!job.isActive) return "Inactive";

  if (job.displayStatus === "Expired" || isJobExpired(job.deadline)) {
    return "Expired";
  }

  return "Active";
}

function RecruiterDashboard({ currentUser, onBack }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState([]);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [savingJob, setSavingJob] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingJob, setEditingJob] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);

  const getToken = () => sessionStorage.getItem("jobhubToken");

  const selectedJob = jobs.find((job) => job._id === selectedJobId);

  const fetchJobs = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setError("Your session has expired. Please log in again.");
      setLoadingJobs(false);
      return;
    }

    setLoadingJobs(true);
    setError("");

    try {
      const response = await fetch(`${JOBS_API_URL}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load your jobs.");
      }

      const myJobs = Array.isArray(data.jobs) ? data.jobs : [];

      setJobs(myJobs);

      setSelectedJobId((previousId) => {
        if (myJobs.some((job) => job._id === previousId)) {
          return previousId;
        }

        return myJobs[0]?._id || "";
      });
    } catch (err) {
      setError(err.message || "Unable to load your jobs.");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    if (!selectedJobId) {
      setApplications([]);
      setLoadingApplications(false);
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setLoadingApplications(true);
    setError("");

    try {
      const response = await fetch(
        `${APPLICATIONS_API_URL}/job/${selectedJobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load applications.");
      }

      setApplications(
        Array.isArray(data.applications) ? data.applications : []
      );
    } catch (err) {
      setApplications([]);
      setError(err.message || "Unable to load applications.");
    } finally {
      setLoadingApplications(false);
    }
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleJobFormChange = (event) => {
    const { name, value } = event.target;

    setJobForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const startEditingJob = () => {
    if (!selectedJob) return;

    setJobForm({
      title: selectedJob.title || "",
      company: selectedJob.company || "",
      description: selectedJob.description || "",
      location: selectedJob.location || "",
      salary: selectedJob.salary || "",
      jobType: selectedJob.jobType || "full-time",
      skills: Array.isArray(selectedJob.skills)
        ? selectedJob.skills.join(", ")
        : "",
      deadline: selectedJob.deadline
        ? new Date(selectedJob.deadline).toISOString().slice(0, 10)
        : "",
    });

    setEditingJob(true);
    setError("");
    setNotice("");
  };

  const cancelEditingJob = () => {
    setEditingJob(false);
    setJobForm(EMPTY_JOB_FORM);
  };

  const saveJobChanges = async (event) => {
    event.preventDefault();

    if (!selectedJob || savingJob) return;

    const token = getToken();

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    if (!jobForm.deadline) {
      setError("Please select an application deadline.");
      return;
    }

    const payload = {
      title: jobForm.title.trim(),
      company: jobForm.company.trim(),
      description: jobForm.description.trim(),
      location: jobForm.location.trim(),
      salary: jobForm.salary.trim(),
      jobType: jobForm.jobType,
      skills: jobForm.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      deadline: new Date(`${jobForm.deadline}T00:00:00`).toISOString(),
    };

    setSavingJob(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${JOBS_API_URL}/${selectedJob._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update the job.");
      }

      setEditingJob(false);
      setNotice("Job updated successfully.");
      await fetchJobs();
    } catch (err) {
      setError(err.message || "Unable to update the job.");
    } finally {
      setSavingJob(false);
    }
  };

  const deleteSelectedJob = async () => {
    if (!selectedJob || deletingJob) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedJob.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setDeletingJob(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${JOBS_API_URL}/${selectedJob._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete the job.");
      }

      setJobs((previous) =>
        previous.filter((job) => job._id !== selectedJob._id)
      );

      setSelectedJobId((previousId) =>
        previousId === selectedJob._id ? "" : previousId
      );

      setApplications([]);
      setEditingJob(false);
      setJobForm(EMPTY_JOB_FORM);
      setNotice("Job deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete the job.");
    } finally {
      setDeletingJob(false);
    }
  };

  const updateStatus = async (applicationId, status) => {
    const token = getToken();

    if (!token || updatingId) return;

    setUpdatingId(applicationId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${APPLICATIONS_API_URL}/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Failed to update application status."
        );
      }

      setNotice(`Application status updated to ${status}.`);
      await fetchApplications();
    } catch (err) {
      setError(err.message || "Unable to update application status.");
    } finally {
      setUpdatingId("");
    }
  };

  const formatDate = (value) => {
    if (!value) return "Not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not specified";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (currentUser?.role !== "recruiter") {
    return (
      <main className="applications-page">
        <h1>Recruiter access required</h1>
        <p>Log in with a recruiter account to access this dashboard.</p>
        <button type="button" className="primary-btn" onClick={onBack}>
          Back to JobHub
        </button>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
        >
          <span className="brand-icon">J</span>
          <span>JobHub</span>
        </a>

        <nav className="nav-links">
          <button type="button" className="login-btn" onClick={onBack}>
            Home
          </button>
          <span>Recruiter Dashboard</span>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="primary-btn"
            disabled={
              loadingJobs ||
              loadingApplications ||
              savingJob ||
              deletingJob
            }
            onClick={async () => {
              setNotice("");
              await fetchJobs();
              await fetchApplications();
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="applications-page">
        <div className="applications-heading">
          <span className="eyebrow">RECRUITER WORKSPACE</span>
          <h1>Applicant Management</h1>
          <p>Manage your jobs and review applications from candidates.</p>

          <div className="applications-summary">
            {jobs.length} jobs · {applications.length} applications
          </div>
        </div>

        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}

        {notice && (
          <p className="message" role="status">
            {notice}
          </p>
        )}

        {loadingJobs ? (
          <p className="message">Loading your jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="applications-empty">
            <h2>No jobs found</h2>
            <p>You have not posted any jobs yet.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={fetchJobs}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <section
              className="application-card"
              style={{ marginBottom: 24 }}
            >
              <h2>My Jobs</h2>
              <p>Select one of your jobs to manage it and review applicants.</p>

              <div className="search-bar">
                <select
                  aria-label="Select your job"
                  value={selectedJobId}
                  onChange={(event) => {
                    setSelectedJobId(event.target.value);
                    setEditingJob(false);
                    setError("");
                    setNotice("");
                  }}
                >
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} — {job.company}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {selectedJob && (
              <section
                className="application-card"
                style={{ marginBottom: 24 }}
              >
                <h2>{selectedJob.title}</h2>
                <p className="application-company">{selectedJob.company}</p>

                <div className="application-details">
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
                    {selectedJob.jobType || "Not specified"}
                  </p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {formatDate(selectedJob.deadline)}
                  </p>
                  <p>
                    <strong>Status:</strong> {getJobStatus(selectedJob)}
                  </p>
                </div>

                {!editingJob ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      marginTop: 20,
                    }}
                  >
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={startEditingJob}
                    >
                      Edit Job
                    </button>

                    <button
                      type="button"
                      className="details-btn"
                      disabled={deletingJob}
                      onClick={deleteSelectedJob}
                    >
                      {deletingJob ? "Deleting..." : "Delete Job"}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={saveJobChanges}
                    className="auth-form"
                    style={{ marginTop: 24 }}
                  >
                    <h3>Edit Job Details</h3>

                    <label htmlFor="edit-title">Job title</label>
                    <input
                      id="edit-title"
                      name="title"
                      value={jobForm.title}
                      onChange={handleJobFormChange}
                      required
                    />

                    <label htmlFor="edit-company">Company</label>
                    <input
                      id="edit-company"
                      name="company"
                      value={jobForm.company}
                      onChange={handleJobFormChange}
                      required
                    />

                    <label htmlFor="edit-description">Description</label>
                    <textarea
                      id="edit-description"
                      name="description"
                      rows="5"
                      value={jobForm.description}
                      onChange={handleJobFormChange}
                      required
                    />

                    <label htmlFor="edit-location">Location</label>
                    <input
                      id="edit-location"
                      name="location"
                      value={jobForm.location}
                      onChange={handleJobFormChange}
                      required
                    />

                    <label htmlFor="edit-salary">Salary</label>
                    <input
                      id="edit-salary"
                      name="salary"
                      value={jobForm.salary}
                      onChange={handleJobFormChange}
                    />

                    <label htmlFor="edit-jobType">Job type</label>
                    <select
                      id="edit-jobType"
                      name="jobType"
                      value={jobForm.jobType}
                      onChange={handleJobFormChange}
                      required
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="remote">Remote</option>
                    </select>

                    <label htmlFor="edit-skills">
                      Skills (comma-separated)
                    </label>
                    <input
                      id="edit-skills"
                      name="skills"
                      value={jobForm.skills}
                      onChange={handleJobFormChange}
                      placeholder="JavaScript, Node.js, MongoDB"
                    />

                    <label htmlFor="edit-deadline">
                      Application deadline
                    </label>
                    <input
                      id="edit-deadline"
                      type="date"
                      name="deadline"
                      value={jobForm.deadline}
                      onChange={handleJobFormChange}
                      required
                    />

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        marginTop: 12,
                      }}
                    >
                      <button
                        type="submit"
                        className="primary-btn"
                        disabled={savingJob}
                      >
                        {savingJob ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        className="details-btn"
                        disabled={savingJob}
                        onClick={cancelEditingJob}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            <section>
              <div className="applications-heading">
                <h2>Applications for this job</h2>
                <p>Review candidates and update their application status.</p>
              </div>

              {loadingApplications ? (
                <p className="message">Loading applications...</p>
              ) : applications.length === 0 ? (
                <div className="applications-empty">
                  <h2>No applications yet</h2>
                  <p>There are no applications for this job yet.</p>
                </div>
              ) : (
                <div className="applications-list">
                  {applications.map((application) => {
                    const applicant = application.applicant || {};
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
                            {(applicant.name || "A")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span
                            className={`application-status status-${status}`}
                          >
                            {status}
                          </span>
                        </div>

                        <h2>{applicant.name || "Unknown applicant"}</h2>
                        <p className="application-company">
                          {applicant.email || "No email provided"}
                        </p>

                        <div className="application-details">
                          <p>
                            <strong>Applied on:</strong>{" "}
                            {formatDate(application.createdAt)}
                          </p>
                          <p>
                            <strong>Skills:</strong>{" "}
                            {Array.isArray(applicant.skills) &&
                            applicant.skills.length
                              ? applicant.skills.join(", ")
                              : "Not provided"}
                          </p>
                          <p>
                            <strong>Resume:</strong>{" "}
                            {applicant.resume ? (
                              <a
                                href={applicant.resume}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View resume
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </p>
                        </div>

                        {application.coverLetter && (
                          <p className="application-cover-letter">
                            <strong>Cover letter:</strong>{" "}
                            {application.coverLetter}
                          </p>
                        )}

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            marginTop: 20,
                          }}
                        >
                          <button
                            type="button"
                            className="primary-btn"
                            disabled={
                              updatingId === application._id ||
                              status === "accepted"
                            }
                            onClick={() =>
                              updateStatus(application._id, "accepted")
                            }
                          >
                            {updatingId === application._id
                              ? "Updating..."
                              : "Accept"}
                          </button>

                          <button
                            type="button"
                            className="details-btn"
                            disabled={
                              updatingId === application._id ||
                              status === "rejected"
                            }
                            onClick={() =>
                              updateStatus(application._id, "rejected")
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
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

export default RecruiterDashboard;