import React from "react";
import { Driver } from "../../utils/DriverType";

interface DriverFilterProps{
    allDrivers: Driver[],
    setDriverOption: React.Dispatch<React.SetStateAction<string | null>>
}

/**
 * 
 * Generates a dropdown component used to filter items based on specifically Driver data
 * 
 * @param param0 
 * @returns 
 */
export default function DriverFilter({
    allDrivers,
    setDriverOption
} : DriverFilterProps){

    
    return (
        <select onChange={(event) => setDriverOption(event.target.value)} className="px-4 py-2 border border-gray-200 rounded-md bg-white min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
            <option>Filter: Person</option>
            {allDrivers.map(driverObj => {
                return (
                    <option key={driverObj.driverId} value={driverObj.driverId}>
                        {driverObj.firstName} {driverObj.lastName}
                    </option>
                )
            })}
        </select>
    )
}