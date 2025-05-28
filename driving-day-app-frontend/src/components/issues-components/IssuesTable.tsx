import React, { useState, useEffect, useContext } from "react";
import IssueModal from "./IssueModal";
import AddIssueModal from "./AddIssueModal";
import DropdownFilter from "../filter-components/DropdownFilter";
import DriverFilter from "../filter-components/DriverFilter";
import FiltersBase from "../base-components/FiltersBase";
import { getAllIssues, getIssuesPaginated } from "../../api/api";
import { availableSubsystems, priorityLevels, statusOptions } from "../../constants/IssuesConstants";
import AppDataContext from '../contexts/AppDataContext';
import Pagination from "../pagination-components/Pagination";
import { Issue } from "../../utils/DataTypes";
import { Stack } from "../../utils/CustomDataStructs";

const globalPageSize = 20
// Use a STACK to keep track of all (startAfterDoc) entries
const pageStartStack = new Stack<string>()

export default function IssueTable() {

  const { drivers } = useContext(AppDataContext)

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * useState hooks that store filter options
   */
  const [driverIdFilt, setDriverIdFilt] = useState<string | null>(null);
  const [subsystemFilt, setSubsystemFilt] = useState<string>("");
  const [priorityFilt, setPriorityFilt] = useState<string>("");
  const [statusFilt, setStatusFilt] = useState<string>("");

  /**
   * useState hook that stores current page number (for pagination)
   */
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [isUpdating, setUpdating] = useState<boolean>(false)

  const updatePageNumber = (newPageNumber: number) => {
    let currFirstDoc : string = ""
    let currLastDoc : string = ""
    if(issues.length > 0){
      currFirstDoc = issues[0]['id']
      currLastDoc = issues[issues.length-1]['id']
    }

    // Need to fetch previous set of entries
    if(newPageNumber < pageNumber){
      const prevFirstDoc = pageStartStack.pop() || ""
      fetchIssuesPaginated(prevFirstDoc, "")
    }
    else if(newPageNumber > pageNumber){
      pageStartStack.push(currFirstDoc)
      fetchIssuesPaginated("", currLastDoc)
    }
    else{
      fetchIssuesPaginated(currFirstDoc, "")
    }
    setPageNumber(newPageNumber)
  }

  const fetchIssuesPaginated = async (startAtDoc: string, startAfterDoc: string) => {
    setUpdating(true)
    setIsLoading(true);
    setError(null);

    const issueFilters = new Map<string, string>([
      ["subsystem", subsystemFilt],
      ["priority", priorityFilt],
      ["status", statusFilt]
    ])
    
    // Make request to paginated version of fetchIssues call
    const response = await getIssuesPaginated({
      pageSize: globalPageSize,
      startAtDoc: startAtDoc,
      startAfterDoc: startAfterDoc,
      issueFilters: issueFilters
    })

    if(response.status === 200){
      setIssues(response.data.issuesPaginated)
    }
    else{
      setError("Failed to load issues. Please try again.");
    }

    setUpdating(false)
    setIsLoading(false);
  }

  const handleSave = (newIssue?: Issue) => {
    // Need to re-clear the Stack:
    pageStartStack.clear()
    setPageNumber(1)
    fetchIssuesPaginated("", "")
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

  useEffect(() => {
    fetchIssuesPaginated("", "")
  }, [priorityFilt, statusFilt]);

  // useEffect(() => {
  //   console.log("CURRENT PRIORITY: ", priorityFilt)
  // }, [driverIdFilt, subsystemFilt, priorityFilt, statusFilt])


  return (
    <>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {isLoading && <p>Loading issues...</p>}

      <FiltersBase>
        <DriverFilter 
          allDrivers={drivers}
          setDriverOption={setDriverIdFilt}
          />
        
        <DropdownFilter 
          filterCategory="Subsystem"
          allFilterOptions={availableSubsystems}
          setFilterOption={setSubsystemFilt}
          />

        <DropdownFilter 
          filterCategory="Priority"
          allFilterOptions={priorityLevels}
          setFilterOption={setPriorityFilt}
          />

        <DropdownFilter 
          filterCategory="Status"
          allFilterOptions={statusOptions}
          setFilterOption={setStatusFilt}
          />          
      </FiltersBase>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full font-face table-fixed">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left font-medium text-lg">
                Issue #
              </th>
              <th className="px-6 py-4 text-left font-medium hidden sm:table-cell">Driver</th>
              <th className="px-6 py-4 text-left font-medium">Date</th>
              <th className="px-6 py-4 text-left font-medium">Synopsis</th>
              <th className="px-6 py-4 text-left font-medium hidden sm:table-cell">Subsystems</th>
              <th className="px-6 py-4 text-left font-medium">Priority</th>
              <th className="px-6 py-4 text-left font-medium">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="ml-4 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 focus:outline-none"
                  >
                    Add
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, index) => (
              <tr
                key={issue.id}
                onClick={() => {
                  setSelectedIssue(issue);
                  setIsModalOpen(true);
                }}
                className={`
        odd:bg-white even:bg-blue-50
        hover:bg-gray-200
        cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
        ${index !== issues.length - 1 ? "border-b border-gray-100" : ""}
      `}
                tabIndex={0}
              >
                {/* Issue # */}
                <td className="px-6 py-4 sm:py-3 text-lg font-medium">
                  {issue.issue_number}
                </td>

                {/* Driver (hidden on xs) */}
                <td className="hidden sm:table-cell px-6 py-4 sm:py-3 text-gray-600">
                  <div className="break-words">{issue.driver}</div>
                </td>

                {/* Date */}
                <td className="px-6 py-4 sm:py-3 text-gray-600 whitespace-nowrap">
                  {issue.date}
                </td>

                {/* Synopsis */}
                <td className="px-6 py-4 sm:py-3">
                  <div className="font-medium break-words">
                    {issue.synopsis}
                  </div>
                </td>

                {/* Subsystems (hidden on xs) */}
                <td className="hidden sm:table-cell px-6 py-4 sm:py-3">
                  <div className="flex flex-wrap gap-1">
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
                      <span className="text-gray-500 italic">None</span>
                    )}
                  </div>
                </td>

                {/* Priority */}
                <td className="hidden md:table-cell px-6 py-4 sm:py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded ${getPriorityColor(
                      issue.priority
                    )}`}
                  >
                    {issue.priority || "Unknown"}
                  </span>
                </td>

                {/* Status (wider) */}
                <td className="px-6 py-4 sm:py-3 w-32 sm:w-40">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded ${getStatusColor(
                      issue.status
                    )}`}
                  >
                    {issue.status || "Unknown"}
                  </span>
                </td>
              </tr>
            ))}
            {issues.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No issues found. Click "Add Issue" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isUpdating && 
        <Pagination
          pageSize={globalPageSize}
          pageNumber={pageNumber}
          pageQuantity={issues.length}
          updatePageNumber={updatePageNumber}
          />
      }
      

      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      <AddIssueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
