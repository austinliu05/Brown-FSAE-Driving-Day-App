import { createContext } from "react";
import { Driver } from "../../utils/DriverType";

interface AppDataContextType {
    currUserId: string | null,
    setCurrUserId: React.Dispatch<React.SetStateAction<string | null>>,
    currUser: Driver | null,
    setCurrUser: React.Dispatch<React.SetStateAction<Driver | null>>,
    drivers: Driver[],
    isLoading: boolean
}

const AppDataContext = createContext<AppDataContextType>({ 
    currUserId: null, 
    setCurrUserId: (newUserId) => {},  
    currUser: null,
    setCurrUser: (newUser) => {},
    drivers: [], 
    isLoading: true 
})

export default AppDataContext;