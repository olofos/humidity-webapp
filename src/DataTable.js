import React from 'react';
import Moment from 'react-moment';
import moment from 'moment';

import { useNewestData } from './api';
import { getNodeColor } from './color'

const Timestamp = ({ timestamp }) => {
    return <Moment unix fromNow>{Math.min(timestamp, moment().unix())}</Moment>;
}


const DataTable = ({ visibleNodes, onChangeVisibleNode }) => {
    const { data } = useNewestData();
    return (
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Temp</th>
                    <th>Hum</th>
                    <th>V<sub>1</sub></th>
                    <th>V<sub>2</sub></th>
                    <th>Time</th>
                </tr>
                {
                    data && data.map(row => (
                        <tr key={row.nodeId}>
                            <td><input type="checkbox" checked={visibleNodes.some(id => id === row.nodeId)} onChange={(ev,) => onChangeVisibleNode(row.nodeId, ev.target.checked)} /></td>
                            <td style={{ color: getNodeColor(row.nodeId) }}>{row.nodeId}</td>
                            <td>{row.name}</td>
                            <td>{row.temperature.toFixed(1)}</td>
                            <td>{row.humidity.toFixed(1)}</td>
                            <td>{row.battery1_level.toFixed(2)}</td>
                            <td>{row.battery2_level.toFixed(2)}</td>
                            <td><Timestamp timestamp={row.timestamp} /></td>
                        </tr>
                    ))
                }
            </thead>
        </table>
    );
};

export default DataTable;