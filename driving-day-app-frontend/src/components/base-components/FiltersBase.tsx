import React from 'react'

interface FiltersBaseProps{
    children: React.ReactNode;
}

export default function FiltersBase({children} : FiltersBaseProps){
    return (
        <div className='flex flex-col md:flex-row gap-4 mb-6'>
            {children}
        </div>
    )
}