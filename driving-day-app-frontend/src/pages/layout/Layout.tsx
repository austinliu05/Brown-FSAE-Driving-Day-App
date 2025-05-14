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
import axios from "axios";

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
    useEffect(() => {
        const fetchCSRFToken = async () => {
            try {
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

        fetchCSRFToken();
    }, []);

    const [drivers, setDrivers] = useState<Driver[]>([])
    const [isLoading, setLoading] = useState<boolean>(true)

    const fetchDrivers = async () => {
        const response = await getAllDrivers()
        if (response.status === 200) {
            setDrivers(response.data.drivers)
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchDrivers();
    }, [])

    return (
        <div className="wrapper">
            <ChartContext.Provider value={{
                chartMapping: chartMapping,
                globalCategories: globalCategories,
                globalPageSize: globalPageSize
            }}>
                <AppDataContext.Provider value={{
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