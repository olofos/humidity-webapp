import React, { useState } from 'react';

import DataTable from './DataTable';
import DataPlot from './DataPlot';
import { useNewestData } from './api';

import './App.css';

function Slider({ values, defaultIndex, onChange }) {
    const [index, setIndex] = useState(defaultIndex);

    return <span>
        <input
            type="range"
            value={index}
            min={0}
            max={values.length - 1}
            step={1}
            onChange={ev => setIndex(ev.target.value)}
            onMouseUp={() => onChange(values[index].value)}
            onTouchEnd={() => onChange(values[index].value)}
        />
        <span>{values[index].name}</span>
    </span>
}

function App() {
    const plotPeriodValues = [
        { value: 3 * 60 * 60, name: 'Three hours' },
        { value: 12 * 60 * 60, name: 'Twelve hours' },
        { value: 24 * 60 * 60, name: 'One day' },
        { value: 3 * 24 * 60 * 60, name: 'Three days' },
        { value: 7 * 24 * 60 * 60, name: 'One week' },
        { value: 2 * 7 * 24 * 60 * 60, name: 'Two weeks' },
        { value: 30 * 24 * 60 * 60, name: 'One month' },
        { value: 3 * 30 * 24 * 60 * 60, name: 'Three months' },
        { value: 182 * 24 * 60 * 60, name: 'Half a year' },
        { value: 365 * 24 * 60 * 60, name: 'One year' },
    ];
    const defaultIndex = 3;

    const [plotPeriod, setPlotPeriod] = useState(plotPeriodValues[defaultIndex].value);
    const [hiddenNodes, setHiddenNodes] = useState([]);
    const { data: nodeData } = useNewestData();

    const onChangeVisibleNode = (nodeId, value) => {
        if (value) {
            setHiddenNodes(old => [...old.filter(val => val !== nodeId)])
        } else {
            setHiddenNodes(old => [...old.filter(val => val !== nodeId), nodeId].sort((a, b) => a === b))
        }
    }

    const allNodes = nodeData ? nodeData.map(node => node.nodeId) : [];
    const visibleNodes = allNodes.filter(nodeId => !hiddenNodes.includes(nodeId));

    return (
        <div className="App">
            <DataPlot fields={['temperature']} plotPeriod={plotPeriod} visibleNodes={visibleNodes} />
            <DataPlot fields={['humidity']} plotPeriod={plotPeriod} visibleNodes={visibleNodes} />
            <DataPlot fields={['battery1_level', 'battery2_level']} plotPeriod={plotPeriod} visibleNodes={visibleNodes} />
            <DataTable visibleNodes={visibleNodes} onChangeVisibleNode={onChangeVisibleNode} />

            <Slider
                values={plotPeriodValues}
                defaultIndex={defaultIndex}
                onChange={setPlotPeriod}
            />
        </div>
    );
}

export default App;
