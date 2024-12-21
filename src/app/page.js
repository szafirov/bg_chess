'use client'

import { useState } from 'react'

import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, colorSchemeDarkWarm, iconSetMaterial, themeBalham } from 'ag-grid-community';

import events from '../data/events.json'

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export default function Page() {

    const theme = themeBalham.withPart(iconSetMaterial).withPart(colorSchemeDarkWarm)

    // Row Data: The data to be displayed.
    const [rowData] = useState(events);
    // console.debug('rowData', rowData);

    // Column Definitions: Defines the columns to be displayed.
    const [colDefs] = useState([
        { field: "name" },
        { field: "url" , cellRenderer: (params) => <a href={params.value}>{params.value}</a>},
        { field: "start_date_iso",  valueFormatter: (params) => {
            const d = new Date(params.value);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
        }},
        { field: "year", filter: true },
        { field: "event_type", filter: true },
        { field: "game_type", filter: true },
        { field: "game_time_class", filter: true },
    ]);

    return (
        <div style={{ height: window.innerHeight }}>
            <AgGridReact
                rowData={rowData}
                columnDefs={colDefs}
                theme={theme}
            />
        </div>
    )
}