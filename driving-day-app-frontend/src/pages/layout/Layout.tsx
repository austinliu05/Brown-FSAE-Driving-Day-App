import { Outlet } from "react-router-dom";
import Navbar from "../../components/navbar-components/Navbar";
import './Layout.css';
import { useState, useEffect } from "react";
import { Driver } from "../../utils/DriverType";
import { api, getAllDrivers } from "../../api/api";
import AppDataContext from "../../components/contexts/AppDataContext";
import ChartContext from "../../components/contexts/ChartContext";
import LineChartTemplate from '../../components/graph-components/LineChartTemplate';
import ScatterChartTemplate from '../../components/graph-components/ScatterChartTemplate';
import { CATEGORIES, StandardChartProps } from "../../utils/DataTypes";
import { auth } from '../../api/firebaseConfig'; 
import { invoke } from '@tauri-apps/api/core';

const chartMapping: { [key: number]: React.FC<StandardChartProps> } = {
    0: LineChartTemplate,
    1: ScatterChartTemplate
}

const globalCategories: Set<string> = new Set([
    CATEGORIES.BR_PRESSURE_BACK,
    CATEGORIES.BR_PRESSURE_FRONT,
    CATEGORIES.COOL_TEMP,
    CATEGORIES.ENG_OIL_PRESSURE
])

const globalPageSize: number = 20


export default function Layout() {

    invoke('maximize_window')
        .then(console.log)
        .catch(console.log)

    const [currUserId, setCurrUserId] = useState<string | null>(null)
    const [currUser, setCurrUser] = useState<Driver | null>(null)
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [isLoading, setLoading] = useState<boolean>(true)

    const fetchDrivers = async () => {
        const response = await getAllDrivers()
        if (response.status === 200) {
            setDrivers(response.data.drivers)
            setLoading(false)
        }
    }

    const fetchCSRFToken = async () => {
        try {
            // TODO: Change this to be a GET request in api.ts
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/get-csrf-token`,
                { credentials: "include" }
            );
            const data = await response.json();
            const csrfToken = data.csrfToken;

            if (csrfToken) {
                api.defaults.headers.common["X-CSRFToken"] = csrfToken; // ✅ use your instance
                //console.log("✅ Set CSRF token on api instance:", csrfToken);
            } else {
                console.error("❌ CSRF token missing in response");
            }
        } catch (error) {
            console.error("❌ Failed to fetch CSRF token:", error);
        }
    };


    useEffect(() => {
        
        fetchCSRFToken();
        fetchDrivers();

        const checkAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("CURRENT USER: ", user.email)
                setCurrUserId(user.email)
            } else {
                setCurrUserId(null);
            }
        });

        checkAuth(); 
    }, []);


    return (
        <div className="wrapper">
            <ChartContext.Provider value={{
                chartMapping: chartMapping,
                globalCategories: globalCategories,
                globalPageSize: globalPageSize
            }}>
                <AppDataContext.Provider value={{
                    currUserId: currUserId,
                    setCurrUserId: setCurrUserId,
                    currUser: currUser,
                    setCurrUser: setCurrUser,
                    drivers: drivers,
                    isLoading: isLoading
                }}>
                    <Navbar />
                    <Outlet />
                </AppDataContext.Provider>
            </ChartContext.Provider>

        </div>

    )
}