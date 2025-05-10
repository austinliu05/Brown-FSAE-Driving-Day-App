import React from 'react'

interface PageBaseProps{
    style?: React.CSSProperties,
    children: React.ReactNode;
}

export default function PageBase({style, children} : PageBaseProps){
    return (
        <div className='page-content-main'>
            <div className='page-content-body' style={style}>
                {children}
            </div>
        </div>
    )
}