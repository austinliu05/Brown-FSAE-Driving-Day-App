import React, { useState, useEffect, useContext } from "react";
import { Driver } from "../../utils/DriverType";
import { SpecificDriverProfile } from "./SpecificDriverProfile";
import AppDataContext from "../contexts/AppDataContext";

// TODO: Move this to DriversPage.tsx
const DriversList = () => {

  const { drivers, isLoading } = useContext(AppDataContext)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading drivers...
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Driver Profiles</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-8">
          <div className="drivers-list">
            <table className="w-full">
              <thead className="bg-gray-100 border-none">
                <tr>
                  <th className="border p-4 text-left">Name</th>
                  <th className="border p-4 text-left">Height (cm)</th>
                  <th className="border p-4 text-left">Weight (kg)</th>
                  <th className="border p-4 text-left">Pedal Box Position</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver, index) => (
                  <tr
                    key={index}
                    onClick={() => setSelectedDriver(driver)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="border p-4 text-[#24a0ed]">
                      {`${driver.firstName} ${driver.lastName}`}
                    </td>
                    <td className="border p-4">{driver.height}</td>
                    <td className="border p-4">{driver.weight}</td>
                    <td className="border p-4">{driver.pedalBoxPos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="selected-driver">
            {selectedDriver ? (
              // <SpecificDriverProfile driver={selectedDriver} />
              <div>
                  <div className="justify-center bg-white border rounded-lg shadow-lg flex flex-col items-center w-full">
                    <SpecificDriverProfile driver={selectedDriver} />
                  </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                Select a driver to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DriversList;
