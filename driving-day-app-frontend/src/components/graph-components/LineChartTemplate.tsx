import React from 'react';
import { StandardChartProps } from '../../utils/DataTypes';
import ReusableChartTemplate from './ReusableChartTemplate';


const LineChartTemplate: React.FC<StandardChartProps> = ({
    verticalLabel,
    horizontalLabel,
    chartPoints,
    pageNumber
}) => {


  return (
    <ReusableChartTemplate
      verticalLabel={verticalLabel}
      horizontalLabel={horizontalLabel}
      chartPoints={chartPoints}
      pageNumber={pageNumber}
      chartType={'line'}
      />
  )
};

export default LineChartTemplate;
