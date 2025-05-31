import axios, { Axios } from "axios";
import { AxiosError } from "axios";
import { DataCategory } from "../utils/DataTypes";

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api/`,
  timeout: 10000,
  withCredentials: true,
});

// TODO: Configure POST request to use API token to obtain content/register
/**
 *
 * @param content: JSON data, consisting of the JSON content that should be sent to the backend upon making a POST request
 * @param path: string, corresponding to the path for the POST request
 * @returns: JSON content, representing the result of the POST request
 */
export const postRequest = async (path: string, content: any) => {
  try {
    const response = await api.post(path, content);
    return response;
  } catch (error) {
    console.error(error);
    const axiosError = error as AxiosError;
    return { status: axiosError.status };
  }
};

export const postDriverProfile = async (userData: {
  firstName: string;
  lastName: string;
  height: number;
  weight: number;
  pedalBoxPos: number;
}) => {
  const path = "add-driver/";
  return await postRequest(path, userData);
};

export const postFiles = async (formData: FormData) => {
  const path = "upload-files/";
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/${path}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error uploading file:", error);
    const axiosError = error as AxiosError;
    return { status: axiosError.status, data: undefined };
  }
};

export const postS3Image = async (formData: FormData, id: string) => {
  const path = `upload-s3-image/`;
  try {
    const response = await api.post(
      path,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error uploading image:", error);
    const axiosError = error as AxiosError;
    return { status: axiosError.status, data: undefined };
  }
};

export const postIssue = async (issueData: {
  driver: string;
  date: string;
  synopsis: string;
  subsystems: string[];
  description: string;
}) => {
  const path = "add-issue/";
  return await postRequest(path, issueData);
};

/**
 *
 * @param path: Corresponds to the relative backend path to which the GET request is sent
 * @param searchParams: Corresponds to a selection of GET Request Parameters
 * @returns: A JSON object representing the result of making the GET Request
 */
export const getRequest = async (
  path: string,
  searchParams: URLSearchParams
) => {
  try {
    const response = await api.get(`${path}?${searchParams.toString()}`);
    return response;
  } catch (error) {
    console.error(error);
    const axiosError = error as AxiosError;
    return { status: axiosError.status, data: undefined };
  }
};

export const getAllDrivers = async () => {
  const path = "all-drivers";
  return await getRequest(
    path,
    new URLSearchParams({
      height: "-1",
      weight: "-1",
    })
  );
};

export const getDriversFiltered = async (filters: {
  height?: number;
  weight?: number;
}) => {
  const path = "all-drivers";

  const heightFilter = filters.height || -1;
  const weightFilter = filters.weight || -1;
  const searchParams = new URLSearchParams({
    height: heightFilter.toString(),
    weight: weightFilter.toString(),
  });

  return await getRequest(path, searchParams);
};


export const getSpecificDriver = async (filters: {
  driverId: string;
}) => {
  const path = "specific-driver";

  const driverIdFilter = filters.driverId;
  const searchParams = new URLSearchParams({
    driverId: driverIdFilter
  });

  return await getRequest(path, searchParams)
}


/**
 *
 * @param runFilter: JSON object containing filters for:
 *                      -> driverId, runDate, etc.
 * @returns: JSON object of the most-recent runs, in simplified form
 */
export const getGeneralRunData = async (runFilter: {
  runDate?: Date;
  driverId?: string;
}) => {
  const path = "general-run-data";

  const runDateFilter = runFilter.runDate || new Date(0);
  const driverIdFilter = runFilter.driverId || "";

  const params = new URLSearchParams({
    runDate: runDateFilter.toDateString(),
    driverId: driverIdFilter.toString(),
  });

  return await getRequest(path, params);
};

/**
 *
 * @param runFilter: JSON containing the run title
 * @returns: JSON object representing the specific run data being pulleds
 */
export const getSpecificRunData = async (runFilter: {
  runTitle: string;
  categories?: DataCategory[];
}) => {
  const path = "specific-run-data";

  const categoriesFiltered = runFilter.categories || [];
  const params = new URLSearchParams({
    runTitle: runFilter.runTitle.toString(),
    categories: categoriesFiltered.toString(),
  });
  return await getRequest(path, params);
};

/**
 *
 */
export const getSpecificRunDataPaginated = async (runFilter: {
  runTitle: string;
  pageSize: number;
  startAfterDoc?: string;
  endBeforeDoc?: string;
  categories?: Set<string>;
}) => {
  const path = "specific-run-data-paginated";

  const startAfterDoc = runFilter.startAfterDoc || "";
  const endBeforeDoc = runFilter.endBeforeDoc || "";

  let categoriesFiltered: string[] = [];
  if (runFilter.categories) {
    categoriesFiltered = Array.from(runFilter.categories);
  }
  const params = new URLSearchParams({
    runTitle: runFilter.runTitle,
    pageSize: runFilter.pageSize.toString(),
    startAfterDoc: startAfterDoc,
    endBeforeDoc: endBeforeDoc,
    categories: categoriesFiltered.toString(),
  });

  return await getRequest(path, params);
};

export const getAllIssues = async (filters?: {
  driver?: string;
  subsystem?: string;
}) => {
  const path = "all-issues";
  const searchParams = new URLSearchParams();

  if (filters) {
    if (filters.driver) searchParams.append("driver", filters.driver);
    if (filters.subsystem) searchParams.append("subsystem", filters.subsystem);
  }

  return await getRequest(path, searchParams);
};


export const getIssuesPaginated = async (filters: {
  pageSize: number,
  startAtDoc: string,
  startAfterDoc: string,
  issueFilters: Map<string, string>  
}) => {
  const path = "issues-paginated"

  const params = new URLSearchParams({
    pageSize: filters.pageSize.toString(),
    startAtDoc: filters.startAtDoc,
    startAfterDoc: filters.startAfterDoc
  });
  
  // TODO: Update URLSearchParams with each of the filters
  filters.issueFilters.forEach((value, key) => {
    params.append(key, value)
  })

  return await getRequest(path, params);
};


export const updateIssue = async (
  issueId: string,
  issueData: {
    driver?: string;
    date?: string;
    synopsis?: string;
    subsystems?: string[];
    description?: string;
    priority?: string;
    status?: string;
  }
) => {
  const path = `update-issue/${issueId}/`;
  try {
    const response = await api.put(path, issueData);
    return response;
  } catch (error) {
    console.error(error);
    const axiosError = error as AxiosError;
    return { status: axiosError.status };
  }
};

export const deleteIssue = async (issueId: string) => {
  const path = `delete-issue/${issueId}/`;
  try {
    const response = await api.delete(path);
    return response;
  } catch (error) {
    console.error(error);
    const axiosError = error as AxiosError;
    return { status: axiosError.status };
  }
};
