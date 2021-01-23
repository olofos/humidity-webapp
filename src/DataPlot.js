import React, { useState } from 'react';
import { XYPlot, XAxis, YAxis, LineSeries, MarkSeries, Hint } from 'react-vis';
import moment from 'moment';

import '../node_modules/react-vis/dist/style.css';

import { usePlotData } from './api';
import { getNodeColor } from './color'

const DataPlot = ({ fields, plotPeriod, visibleNodes }) => {
    const plotData = usePlotData({ plotPeriod });
    const [hintValue, setHintValue] = useState();

    if (!plotData || !plotData.settings) return (<XYPlot width={400} height={300}><XAxis /><YAxis /></XYPlot>);

    const settings = plotData.settings[fields[0]];

    const allData = fields.map(field => visibleNodes.map(nodeId => plotData.data[field][nodeId].map(pt => ({ ...pt, nodeId })))).flat(2);

    return (<XYPlot
        dontCheckIfEmpty
        width={400}
        height={300}
        getX={d => d.timestamp}
        getY={d => d.value}

        yDomain={settings.yDomain}
        xDomain={settings.xDomain}

        onMouseLeave={() => setHintValue(null)}
    >

        <XAxis
            tickValues={settings.tickValues}
            tickFormat={t => moment.unix(t).format(settings.tickFormat)}
            tickLabelAngle={-45}
        />
        <YAxis
        />
        {hintValue && <Hint
            value={hintValue}
            format={data => [
                { title: 'Node', value: `#${data.nodeId}` },
                { title: 'Timestamp', value: moment.unix(data.timestamp).format('YYYY-MM-DD HH:mm:ss') },
                { title: settings.title, value: `${data.value}${settings.unit}` }
            ]}
        />}
        {hintValue && <MarkSeries
            data={[hintValue]}
            color={getNodeColor(hintValue.nodeId)}
        />}


        <MarkSeries
            data={allData}
            size={0}
            onNearestXY={(datapoint) => setHintValue(datapoint)}
        />

        {
            fields.map(field => visibleNodes.map(nodeId => {
                if (!(nodeId in plotData.data[field])) return null;

                return <LineSeries
                    key={`${nodeId}-${field}`}
                    color={getNodeColor(nodeId)}
                    data={plotData.data[field][nodeId]}
                    getNull={d => d.value !== undefined}
                />
            }))
        }

    </XYPlot>);
};

export default DataPlot;