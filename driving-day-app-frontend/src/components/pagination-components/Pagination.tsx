import React, {useState, useEffect, useContext} from 'react'
import ChartContext from '../contexts/ChartContext'
import './Pagination.css'

interface PaginationProps {
    pageSize: number,
    pageNumber: number,
    pageQuantity: number,
    updatePageNumber: (arg0: number) => void
}

const Pagination : React.FC<PaginationProps> = ({pageSize, pageNumber, pageQuantity, updatePageNumber} : PaginationProps) => {

    return (
        <div className='flex py-6'>
            <div className='flex justify-center w-full'>
                {(pageNumber > 1) && 
                    <button className="page-button bg-blue-500" onClick={() => updatePageNumber(pageNumber-1)}>Prev</button>
                }

                {/* <li>{pageNumber}</li> */}

                {(pageQuantity >= pageSize) && 
                    <button className="page-button bg-blue-500" onClick={() => updatePageNumber(pageNumber+1)}>Next</button>
                }

            </div>
        </div>
    )
}

export default Pagination;