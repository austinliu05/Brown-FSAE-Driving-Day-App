import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { postFiles, postIssue, postS3Image } from "../../api/api";
import { availableSubsystems, priorityLevels, statusOptions } from "../../constants/IssuesConstants";
import { Issue } from "../../utils/DataTypes";

interface AddIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newIssue: Issue) => void;
}

export default function AddIssueModal({
  isOpen,
  onClose,
  onSave,
}: AddIssueModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [issue, setIssue] = useState<Omit<Issue, "id">>({
    issue_number: -1,
    driver: "",
    date: today,
    synopsis: "",
    subsystems: [],
    description: "",
    priority: "LOW",
    status: "OPEN",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setIssue({
        issue_number: -1,
        driver: "",
        date: today,
        synopsis: "",
        subsystems: [],
        description: "",
        priority: "LOW",
        status: "OPEN",
      })
      setPreview(null);
    };
  }, []);

  const handleSubsystemToggle = (subsystem: string) => {
    setIssue((prevIssue) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await postIssue(issue);
      if (response.status !== 201) {
        throw new Error("Failed to create issue");
      }
      let issueId = "";
      if (image && response && "data" in response) {
        const formData = new FormData();
        issueId = response.data.issue_id;
        formData.append("file", image);
        formData.append("issue_id", issueId);
        const imageResponse = await postS3Image(formData, issueId);
        if (imageResponse.status !== 201) {
          throw new Error("Failed to upload image");
        }
      }
      onSave({ ...issue, id: issueId });
      setIssue({
        issue_number: -1,
        driver: "",
        date: "",
        synopsis: "",
        subsystems: [],
        description: "",
        priority: "LOW",
        status: "OPEN",
      });
      onClose();
    } catch (err) {
      setError("Error adding issue, make sure all fields are filled.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">New Issue</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Driver</label>
              <input
                type="text"
                value={issue.driver}
                onChange={(e) => setIssue({ ...issue, driver: e.target.value })}
                className="w-full border rounded p-2"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={issue.date}
                onChange={(e) => setIssue({ ...issue, date: e.target.value })}
                className="w-full border rounded p-2"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Synopsis</label>
            <input
              type="text"
              value={issue.synopsis}
              onChange={(e) => setIssue({ ...issue, synopsis: e.target.value })}
              className="w-full border rounded p-2"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Priority Level
              </label>
              <select
                value={issue.priority}
                onChange={(e) =>
                  setIssue({ ...issue, priority: e.target.value })
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
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={issue.status}
                onChange={(e) => setIssue({ ...issue, status: e.target.value })}
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
            <label className="block text-sm font-medium mb-1">Subsystems</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full border rounded p-2 text-left flex justify-between items-center"
                disabled={isLoading}
              >
                <span>
                  {issue.subsystems.length > 0
                    ? `Selected (${issue.subsystems.length})`
                    : "Select subsystems"}
                </span>
                <span>{isDropdownOpen ? "▲" : "▼"}</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                  {availableSubsystems.map((subsystem) => (
                    <div
                      key={subsystem}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleSubsystemToggle(subsystem)}
                    >
                      <input
                        type="checkbox"
                        checked={issue.subsystems.includes(subsystem)}
                        onChange={() => { }}
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
              {issue.subsystems.map((subsystem) => (
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
              value={issue.description}
              onChange={(e) =>
                setIssue({ ...issue, description: e.target.value })
              }
              className="w-full border rounded p-2 h-32"
              disabled={isLoading}
            />
          </div>
          {preview && (
          <div className="mb-4">
            <p className="text-sm font-medium">Image Preview:</p>
            <img
              src={preview}
              alt="Selected preview"
              className="max-h-40 rounded shadow-sm mt-1"
            />
          </div>
        )}
          <div>
            <label className="block text-sm font-medium mb-1">Upload Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImage(file);
                if (preview){
                  URL.revokeObjectURL(preview);
                  setPreview(null);
                }
                if(file) {
                    const newPreview = URL.createObjectURL(file);
                    setPreview(newPreview);
                  }
              }}
              className="w-full border rounded p-2"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
