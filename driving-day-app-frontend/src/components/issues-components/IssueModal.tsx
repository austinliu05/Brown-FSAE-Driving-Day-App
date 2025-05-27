import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { updateIssue, deleteIssue } from "../../api/api";
import { availableSubsystems, priorityLevels, statusOptions } from "../../constants/IssuesConstants";
import { Issue } from "../../utils/DataTypes";

interface IssueModalProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newIssue?: Issue) => void;
}

export default function IssueModal({
  issue,
  isOpen,
  onClose,
  onSave,
}: IssueModalProps) {
  
  const [editMode, setEditMode] = useState(false);
  const [editedIssue, setEditedIssue] = useState<Issue>(issue);
  const [isSubsystemDropdownOpen, setIsSubsystemDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Added for delete confirmation

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !editMode) {
      setImageUrl(null);
      setImgError(null);

      fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/fetch-s3-image/?issue_id=${issue.id}`,
        { credentials: "include" }
      )
        .then((res) => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setImageUrl(data.url);
        })
        .catch((err) => {
          console.warn("No image or fetch failed:", err);
          setImgError("No image available");
        });
    }
  }, [isOpen, editMode, issue.id]);

  useEffect(() => {
    setEditedIssue(issue);
  }, [issue]);

  const handleSubsystemToggle = (subsystem: string) => {
    setEditedIssue((prevIssue) => {
      if (prevIssue.subsystems.includes(subsystem)) {
        return {
          ...prevIssue,
          subsystems: prevIssue.subsystems.filter((s) => s !== subsystem),
        };
      } else {
        return {
          ...prevIssue,
          subsystems: [...prevIssue.subsystems, subsystem],
        };
      }
    });
  };

  const getPriorityColor = (priority: string | undefined) => {
    const priorityLower = priority?.toLowerCase() || "unknown";
    switch (priorityLower) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-600 text-white";
      case "high":
        return "bg-red-100 text-red-800";
      case "critical":
        return "bg-red-800 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string | undefined) => {
    const statusLower = status?.toLowerCase() || "unknown";
    switch (statusLower) {
      case "closed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-yellow-600 text-white";
      case "open":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateIssue(editedIssue.id, {
        driver: editedIssue.driver,
        date: editedIssue.date,
        synopsis: editedIssue.synopsis,
        subsystems: editedIssue.subsystems,
        description: editedIssue.description,
        priority: editedIssue.priority,
        status: editedIssue.status,
      });
      if (response.status !== 200) {
        throw new Error("Failed to update issue");
      }
      setEditMode(false);
      onSave();
    } catch (err) {
      setError("Failed to update issue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await deleteIssue(editedIssue.id);
      if (response.status !== 200) {
        throw new Error("Failed to delete issue");
      }
      onSave();
      onClose();
    } catch (err) {
      setError("Failed to delete issue. Please try again.");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false); // Close confirmation dialog
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setEditMode(false);
        setEditedIssue(issue);
        setShowDeleteConfirm(false); // Reset confirmation state
        onClose();
      }}
    >
      <div className="p-6">
        {editMode ? (
          <>
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p>Are you sure you want to delete this issue?</p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border rounded"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-red-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Driver
                      </label>
                      <input
                        type="text"
                        value={editedIssue.driver}
                        onChange={(e) =>
                          setEditedIssue({
                            ...editedIssue,
                            driver: e.target.value,
                          })
                        }
                        className="w-full border p-2 rounded"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editedIssue.date}
                        onChange={(e) =>
                          setEditedIssue({
                            ...editedIssue,
                            date: e.target.value,
                          })
                        }
                        className="w-full border p-2 rounded"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Synopsis
                    </label>
                    <input
                      type="text"
                      value={editedIssue.synopsis}
                      onChange={(e) =>
                        setEditedIssue({
                          ...editedIssue,
                          synopsis: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Priority
                      </label>
                      <select
                        value={editedIssue.priority || "Medium"}
                        onChange={(e) =>
                          setEditedIssue({
                            ...editedIssue,
                            priority: e.target.value,
                          })
                        }
                        className="w-full border rounded p-2"
                        disabled={isLoading}
                      >
                        {priorityLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <select
                        value={editedIssue.status || "Open"}
                        onChange={(e) =>
                          setEditedIssue({
                            ...editedIssue,
                            status: e.target.value,
                          })
                        }
                        className="w-full border rounded p-2"
                        disabled={isLoading}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Subsystems
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsSubsystemDropdownOpen(!isSubsystemDropdownOpen)
                        }
                        className="w-full border rounded p-2 text-left flex justify-between items-center"
                        disabled={isLoading}
                      >
                        <span>
                          {editedIssue.subsystems.length > 0
                            ? `Selected (${editedIssue.subsystems.length})`
                            : "Select subsystems"}
                        </span>
                        <span>{isSubsystemDropdownOpen ? "▲" : "▼"}</span>
                      </button>

                      {isSubsystemDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                          {availableSubsystems.map((subsystem) => (
                            <div
                              key={subsystem}
                              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                              onClick={() => handleSubsystemToggle(subsystem)}
                            >
                              <input
                                type="checkbox"
                                checked={editedIssue.subsystems.includes(
                                  subsystem
                                )}
                                onChange={() => {}}
                                className="mr-2"
                                disabled={isLoading}
                              />
                              {subsystem}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap mt-2">
                      {editedIssue.subsystems.map((subsystem) => (
                        <span
                          key={subsystem}
                          className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center"
                        >
                          {subsystem}
                          <button
                            type="button"
                            className="ml-1.5 text-blue-800 hover:text-blue-900"
                            onClick={() => handleSubsystemToggle(subsystem)}
                            disabled={isLoading}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      value={editedIssue.description}
                      onChange={(e) =>
                        setEditedIssue({
                          ...editedIssue,
                          description: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded h-32"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setEditedIssue(issue);
                      }}
                      className="px-4 py-2 border rounded"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)} // Show confirmation dialog
                      className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-red-300"
                      disabled={isLoading}
                    >
                      {isLoading ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </>
        ) : (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Issue #{issue.id}</h2>
            </div>
            {imageUrl ? (
              <div className="mb-4">
                <img
                  src={imageUrl}
                  alt={`Issue ${issue.id}`}
                  className="max-h-60 w-auto mx-auto rounded shadow"
                />
              </div>
            ) : imgError ? (
              <p className="text-sm italic text-gray-500 mb-4">{imgError}</p>
            ) : (
              // while loading
              <p className="text-sm text-gray-400 mb-4">Loading image…</p>
            )}
            <div className="space-y-4">
              <p className="break-words">
                <strong>Driver:</strong> {issue.driver}
              </p>
              <p>
                <strong>Date:</strong> {issue.date}
              </p>
              <p className="break-words">
                <strong>Synopsis:</strong> {issue.synopsis}
              </p>
              <p>
                <strong>Priority:</strong>{" "}
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded ml-2 ${getPriorityColor(
                    issue.priority
                  )}`}
                >
                  {issue.priority || "Unknown"}
                </span>
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded ml-2 ${getStatusColor(
                    issue.status
                  )}`}
                >
                  {issue.status || "Unknown"}
                </span>
              </p>
              <div>
                <strong>Subsystems:</strong>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {issue.subsystems.length > 0 ? (
                    issue.subsystems.map((subsystem) => (
                      <span
                        key={subsystem}
                        className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                      >
                        {subsystem}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">
                      No subsystems assigned
                    </span>
                  )}
                </div>
              </div>
              <div>
                <strong>Description:</strong>
                <p className="mt-2 whitespace-pre-wrap break-words overflow-hidden">
                  {issue.description}
                </p>
              </div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
