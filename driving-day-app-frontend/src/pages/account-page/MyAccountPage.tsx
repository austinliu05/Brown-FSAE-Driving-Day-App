import React, { useState, useEffect, useContext } from 'react';
import PageBase from '../../components/base-components/PageBase';
import { SpecificDriverProfile } from '../../components/driver-components/SpecificDriverProfile';
import { Driver } from '../../utils/DriverType';
import './MyAccountPage.css';
import AppDataContext from "../../components/contexts/AppDataContext";
import { handleGoogleLogin } from '../../controllers/AuthController';

const MyAccountPage : React.FC = () => {

  const {currUserId, setCurrUserId} = useContext(AppDataContext)

  const tempDriver : Driver = {
    driverId:"undefined",
    firstName:"undefined",
    lastName: 'undefined',
    height: 5,
    weight: 10,
    pedalBoxPos: 3
  }

  const performLogin = async () => {
    try{
      const email = await handleGoogleLogin();
      setCurrUserId(email);
    }
    catch(error){
      console.error(error)
    }
  }

  return (
    <PageBase style={{
      height: '100vh',
      overflow: 'hidden'
    }}>
      <h1>My Account</h1>
      {currUserId 
        ? (
          <>     
            {/** If signed in, should be able to edit profile data */}     
            <SpecificDriverProfile driver={tempDriver}/>
            {/* <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button> */}
          </>
        )
        : (
            <div className="flex flex-col items-center justify-center h-full">
              <button
                onClick={performLogin}
                className="flex px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow hover:bg-gray-50 flex items-center justify-center gap-2 mx-auto"
              >
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  className="w-5 h-5" 
                />
                Sign in with Google
              </button>
          </div>
        )
      }

      <div className='flex flex-col items-center justify-center w-full py-8'>
        <div className='grid grid-cols-2 w-full'>
          {/** Section for issues linked to drive */}

          <div className="flex items-center justify-center w-full">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full font-face table-fixed">
                <colgroup>
                  {/** Issue # */}
                  <col style={{ width: "10%" }} />
                  {/** Driver */}
                  {/* <col style={{ width: "10%" }} />  */}
                  {/** Date */}
                  <col style={{ width: "10%" }} /> 
                  {/** Synopsis */}
                  <col style={{ width: "15%" }} /> 
                  {/** Subsystem */}
                  <col style={{ width: "10%" }} /> 
                  {/** Priority */}
                  {/* <col style={{ width: "8%" }} />  */}
                  {/** Status */}
                  {/* <col style={{ width: "15%" }} />  */}
                </colgroup>
              </table>
              <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left font-medium text-lg">
                  Issue #
                </th>
                <th className="px-6 py-4 text-left font-medium">Date</th>
                <th className="px-6 py-4 text-left font-medium">Synop.</th>
                <th className="px-6 py-4 text-left font-medium">Subsys.</th>
              </tr>
            </thead>
            </div>
          </div>

          {/** Section for linked runs */}

          <div className="flex items-center justify-center w-full">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full font-face table-fixed">
                  <colgroup>
                    {/** Issue # */}
                    <col style={{ width: "50%" }} />
                    {/** Driver */}
                    {/* <col style={{ width: "10%" }} />  */}
                    {/** Date */}
                    <col style={{ width: "50%" }} /> 
                    {/** Synopsis */}
                    {/* <col style={{ width: "15%" }} />  */}
                    {/** Subsystem */}
                    {/* <col style={{ width: "10%" }} />  */}
                    {/** Priority */}
                    {/* <col style={{ width: "8%" }} />  */}
                    {/** Status */}
                    {/* <col style={{ width: "15%" }} />  */}
                  </colgroup>
                </table>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left font-medium text-lg">
                      Run Title
                    </th>
                    <th className="px-6 py-4 text-left font-medium">Date</th>
                  </tr>
                </thead>
            </div>
          </div>
        </div>
      </div>
    </PageBase>
  );
}

export default MyAccountPage;


