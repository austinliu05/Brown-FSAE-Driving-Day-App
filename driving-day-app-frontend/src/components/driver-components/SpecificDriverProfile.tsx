import React from "react";
import { Driver } from "../../utils/DriverType";
import './SpecificDriverProfile.css';

export const SpecificDriverProfile = ({ driver }: { driver: Driver }) => (
  // <div className="justify-center bg-white border rounded-lg shadow-lg flex flex-col items-center w-full">
  <div className="my-10 flex w-full flex-col items-center">
    <div className="rounded-full bg-orange-500 w-32 h-32 mb-6 flex items-center justify-center">
      {/* Placeholder for a profile image, replace with actual image if available */}
      <span className="text-3xl text-white">D</span>
    </div>
    <h1 className="text-3xl font-bold mb-4 text-gray-800">
      {driver.firstName} {driver.lastName}
    </h1>
    <p className="text-lg font-semibold text-gray-600">Driver</p>
    <div className="profile-data text-lg text-gray-700 mt-4">
      <p>
        <span className="font-semibold">Height:</span> {driver.height} cm
      </p>
      <p>
        <span className="font-semibold">Weight:</span> {driver.weight} kg
      </p>
      <p>
        <span className="font-semibold">Pedal Box Position:</span>{" "}
        {driver.pedalBoxPos}
      </p>
    </div>
  </div>
  // </div>
);
