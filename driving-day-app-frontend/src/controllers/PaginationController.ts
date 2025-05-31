
interface PaginationControllerProps{
    dataPoints: any[],
    globalPageSize: number,
    currPageNumber: number,
    newPageNumber: number,
    fetchDataPaginated: (startAfterDoc: string, endBeforeDoc: string) => void,
    setPageNumber: React.Dispatch<React.SetStateAction<number>>
}

export const updatePageNumber = ({
    dataPoints,
    globalPageSize, 
    currPageNumber, 
    newPageNumber,
    fetchDataPaginated,
    setPageNumber
} : PaginationControllerProps) => {

    let currLastDoc : string = ""
    if(dataPoints.length > 0){
        currLastDoc = dataPoints[dataPoints.length-1]['id']
    }

    if(newPageNumber < currPageNumber){
        const updatedFirstDoc : number = Number(currLastDoc.substring(5)) - (2*globalPageSize)
        if(updatedFirstDoc > 0){
            const startAfterDoc : string =  `data_${updatedFirstDoc.toString().padStart(6, "0")}`                    
            fetchDataPaginated(startAfterDoc, "")
        }
        else{
            fetchDataPaginated("", "")
        }
    }
    else{
        fetchDataPaginated(currLastDoc, "")
    }

    setPageNumber(newPageNumber)
}