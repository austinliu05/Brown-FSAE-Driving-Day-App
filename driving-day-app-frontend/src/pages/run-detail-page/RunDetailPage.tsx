import React, {useState, useEffect, useContext} from 'react'
import ChartContext from '../../components/contexts/ChartContext';
import { useParams, useLocation } from 'react-router-dom';
import SpecificRunBubble from '../../components/run-components/SpecificRunBubble';
import PageBase from '../../components/base-components/PageBase';
import './ChartElements.css';
import { getSpecificRunDataPaginated } from '../../api/api';
import { CATEGORIES, ReusableChartProps, StandardChartProps } from '../../utils/DataTypes';
import { CHARTS, ChartCategory } from '../../utils/ChartTypes';
import Pagination from '../../components/pagination-components/Pagination';

/**
 * 
 * @returns A React component that displays relevant details for a specific run, such as:
 *      - Graphs of <ColumnData> vs <Time>
 *      - Associated driver
 */
const RunDetailPage: React.FC = () => {
    
    const { chartMapping, globalCategories, globalPageSize } = useContext(ChartContext)
    const { runTitle } = useParams()
    const location = useLocation()

    /**
     * useState for Run Data metadata
     */
    const [isLoading, setLoading] = useState<boolean>(true);
    const [isUpdating, setUpdating] = useState<boolean>(false);
    const [runDate, setRunDate] = useState<string>("")
    const [driverId, setDriverId] = useState<string>("")
    
    /**
     * useState for Pagination
     */
    const [pageNumber, setPageNumber] = useState<number>(1)


    // Adapt this into DataTypes.ts
    const keyCategories = ["Highest Coolant Temperature"]
    /**
     * useState variables for run-data
     */
    const [runDataPoints, setRunDataPoints] = useState<any[]>([])
    const [keyPoints, setKeyPoints] = useState<JSON>(JSON.parse("{}"))
    // States to store the currently-toggled column
    const [verticalLabel, setVerticalLabel] = useState<string>("")
    const [horizontalLabel, setHorizontalLabel] = useState<string>("Time")
    

    /**
     * useState variables for chart-data
     */
    const chartCategories : ChartCategory[] = Object.values(CHARTS)
    const [currChartInd, setCurrChartInd] = useState<number>(0)
    const CurrentChart : React.FC<StandardChartProps> = chartMapping[currChartInd]

    /**
     * useState variables for chart-columns
     */
    const [chartColumns, setChartColumns] = useState<string[]>([])


    const updateChartColumns = (allColumns : string[]) => {
        setChartColumns(allColumns.filter((col) => globalCategories.has(col)))
    }

    
    const updatePageNumber = (newPageNumber : number) => {
        let currLastDoc : string = ""
        if(runDataPoints.length > 0){
            currLastDoc = runDataPoints[runDataPoints.length-1]['id']
        }

        if(newPageNumber < pageNumber){
            const updatedFirstDoc : number = Number(currLastDoc.substring(5)) - (2*globalPageSize)
            if(updatedFirstDoc > 0){
                const startAfterDoc : string =  `data_${updatedFirstDoc.toString().padStart(6, "0")}`                    
                fetchSpecificRunDataPaginated(startAfterDoc, "")
            }
            else{
                fetchSpecificRunDataPaginated("", "")
            }
        }
        else{
            fetchSpecificRunDataPaginated(currLastDoc, "")
        }

        setPageNumber(newPageNumber)
    }

    /**
     * Perform fetch call to pull specific run data, but paginated (only specific rows are pulled, when toggled)
     */
    const fetchSpecificRunDataPaginated = async (startAfterDoc : string, endBeforeDoc: string) => {
        setUpdating(true)
        
        const response = await getSpecificRunDataPaginated({
            runTitle: runTitle || "sample_data",
            pageSize: globalPageSize,
            startAfterDoc: startAfterDoc,
            endBeforeDoc: endBeforeDoc,
            categories: globalCategories
        })

        if(response.status === 200){
            //if(response.data.runDataPoints.length > 0){
            const pulledRunData = response.data.runDataPoints
            const pulledColumns = Object.keys(pulledRunData[0]) 

            updateChartColumns(pulledColumns)
            setRunDataPoints(pulledRunData)
            setKeyPoints(response.data.keyPoints)

            if(verticalLabel.length === 0)
                setVerticalLabel(pulledColumns[0])
            //}
            
        }

        setUpdating(false)
    }

    // TODO: Create fetch API call to obtain run meta-data by runTitle (called when necessary)

    useEffect(() => {
        // USE localStorage to cache in the future
        // Flush data out after 1 week or browser reaches max memory
        /**
         * Item Structure:
         *      key: runTitle,
         *      expiry: <1 Week date time>
         *      value: JSON.stringify(<content>)
         */
        if(location.state){
            setRunDate(location.state['run-date'])
            setDriverId(location.state['driver-id'])
        }

        fetchSpecificRunDataPaginated("", "")
    }, [])

    if (isLoading) {
        return (
            <PageBase>
                <div className="flex items-center justify-center h-64">
                    Loading run data...
                </div>
            </PageBase>    
        );
    }

    return (
        <PageBase>
            <div className="run-detail-chart">
                <h1>{`"${runTitle}" Details`}</h1>

                {runTitle ? (
                    <SpecificRunBubble
                        runTitle={runTitle}
                        runDate={runDate}
                        driverId={driverId}
                        keyPoints={keyPoints}
                        keyCategories={keyCategories}
                        />
                ) : (
                    <p className="text-lg text-gray-600">Run details not found.</p>
                )}

                <div className="pt-16">
                    <h1>Graphs</h1>
                    <div className='flex flex-col'>
                        <div className="flex py-2">
                            <section className='px-4 py-2'>Columns:</section>

                            <select className="text-lg px-4 py-2 border border-gray-200 rounded-md text-blue-800 font-semibold text-1xl"
                                onChange={(event) =>  {setVerticalLabel(event.target.value)}}
                            >
                                {chartColumns.map((validColumn, index) => {
                                    return (
                                        <option key={index} value={validColumn}>{validColumn}</option>
                                    )
                                })}

                            </select>

                            <section className="px-4 py-2"> vs </section>
                            <select className="text-lg px-4 py-2 border border-gray-200 rounded-md text-red-800 font-semibold text-1xl"
                                // onChange={(event) => setHorizontalLabel(event.target.value)}
                            >
                                <option value=""> {"Time"} </option>
                            </select>
                        </div>
                        <div className='flex py-2'>
                            <section className='px-4 py-2'>Chart Type:</section>
                            <select className="text-lg px-4 py-2 border border-gray-200 rounded-md text-purple-800 font-semibold text-1xl"
                                onChange={(event) => setCurrChartInd(Number(event.target.value))}
                            >
                                {chartCategories.map((category, index) => {
                                    return (
                                        <option key={index} value={index}> {category} </option>
                                    )
                                })}
                            </select>
                        </div>
                    </div>           

                    <CurrentChart 
                        verticalLabel={verticalLabel}
                        horizontalLabel={horizontalLabel}
                        chartPoints={runDataPoints}
                        pageNumber={pageNumber}
                    />      
                    {/* {...props} : Method of passing in props as an object*/}

                    {/** TODO: Create component to pull NEXT PAGE */}
                    {(!isUpdating) && 
                        <Pagination
                            pageSize={globalPageSize}
                            pageNumber={pageNumber}
                            pageQuantity={runDataPoints.length}
                            updatePageNumber={updatePageNumber}
                            />
                    }
                </div>
            </div>
        </PageBase>
    );

};

export default RunDetailPage;