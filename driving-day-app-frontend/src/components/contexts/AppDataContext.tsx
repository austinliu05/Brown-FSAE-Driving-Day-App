import { createContext } from "react";
import { Driver } from "../../utils/DriverType";

interface AppDataContextType {
    currUserId: string | null,
    setCurrUserId: React.Dispatch<React.SetStateAction<string | null>>,
    drivers: Driver[],
    isLoading: boolean
}

const AppDataContext = createContext<AppDataContextType>(
    { currUserId: null, setCurrUserId: (newUserId) => {},  drivers: [], isLoading: true }
)

export default AppDataContext;