import useSWR from 'swr';
import moment from 'moment';

const baseURL = 'http://humidity-gateway.local:3001/api'

const jsonFetcher = async (url) => {
    const res = await fetch(url);
    return await res.json();
}

function insertGaps(data, gap) {
    if (data.length === 0) return [];

    let newData = [data[0]];

    for (let i = 1; i < data.length; i++) {
        if (data[i].timestamp > data[i - 1].timestamp + gap) {
            newData.push({ timestamp: (data[i].timestamp + data[i - 1].timestamp) / 2 });
        }
        newData.push(data[i]);
    }
    return newData;
}

function groupByField(data) {
    const newData = {};
    const fields = ['temperature', 'humidity', 'battery1_level', 'battery2_level'];
    fields.forEach(field => {
        const res = {};
        data.forEach(nodeData => {
            res[nodeData[0].nodeId] = nodeData.map(entry => ({ timestamp: entry.timestamp, value: entry[field] }))
        });
        newData[field] = res;
    });

    return newData;
}

function getLimits(data, field) {
    const defaultLimits = {
        temperature: { min: 15, max: 30 },
        humidity: { min: 20, max: 80 },
        battery1_level: { min: 1.0, max: 1.65 },
        battery2_level: { min: 1.0, max: 1.65 },
    };

    const values = data.map(entry => entry[field]);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    const min = Math.min(defaultLimits[field].min, dataMin - 0.1 * (dataMax - dataMin));
    const max = Math.max(defaultLimits[field].max, dataMax + 0.1 * (dataMax - dataMin));

    return [min, max];
}

function getTickSettings(start, end) {
    const duration = moment.duration(end - start, 'seconds');

    let tickValues = [];
    let tickFormat = 'D MMM';

    const momStart = moment.unix(start)
    const momEnd = moment.unix(end);

    let startUnit = 'year';
    let addUnit = 'month';
    let addAmount = 1;

    if (duration.as('hours') < 5) {
        startUnit = 'hour';
        addAmount = 15;
        addUnit = 'minutes';
        tickFormat = 'HH:mm'
    } else if (duration.as('hours') < 13) {
        startUnit = 'day';
        addAmount = 1;
        addUnit = 'hour';
        tickFormat = 'HH:mm'
    } else if (duration.as('hours') < 25) {
        startUnit = 'day';
        addAmount = 2;
        addUnit = 'hour';
        tickFormat = 'HH:mm'
    } else if (duration.as('days') < 4) {
        startUnit = 'day';
        addAmount = 6;
        addUnit = 'hour';
        tickFormat = 'HH:mm'
    } else if (duration.as('days') < 8) {
        startUnit = 'day';
        addAmount = 1;
        addUnit = 'day';
        tickFormat = 'D MMM'
    } else if (duration.as('days') < 32) {
        startUnit = 'month';
        addAmount = 2;
        addUnit = 'day';
        tickFormat = 'D MMM'
    }

    for (let t = momStart.clone().startOf(startUnit); t.isSameOrBefore(momEnd); t.add(addAmount, addUnit)) {
        if (t.isBetween(momStart, momEnd)) {
            tickValues.push(t.unix())
        }
    }

    return { tickValues, tickFormat };
}

function getPlotSettings(data) {
    if (!data) return {};

    const start = data[0].timestamp;
    const end = data[data.length - 1].timestamp;
    const xDomain = [start - 0.025 * (end - start), end + 0.025 * (end - start)];

    const { tickValues, tickFormat } = getTickSettings(start, end);

    const bat1Limits = getLimits(data, 'battery1_level');
    const bat2Limits = getLimits(data, 'battery2_level');
    const batLimits = [
        Math.min(bat1Limits[0], bat2Limits[0]),
        Math.max(bat1Limits[1], bat2Limits[1]),
    ];

    const batSettings = {
        xDomain,
        yDomain: batLimits,
        tickValues,
        tickFormat,
        unit: 'V',
        title: 'Battery',
    }

    const settings = {
        temperature: {
            xDomain,
            yDomain: getLimits(data, 'temperature'),
            tickValues,
            tickFormat,
            unit: 'C',
            title: 'Temperature',
        },
        humidity: {
            xDomain,
            yDomain: getLimits(data, 'humidity'),
            tickValues,
            tickFormat,
            unit: '%',
            title: 'Humidity',
        },
        battery1_level: batSettings,
        battery2_level: batSettings,
    };

    return settings;
}

function reducePlotData(rawData, plotPeriod) {
    if (!rawData) return [];

    const nodeIds = rawData.map(d => d.nodeId).filter((value, index, self) => self.indexOf(value) === index);
    const dataGroupedByNode = nodeIds.map(id => rawData.filter(val => val.nodeId === id));

    const maxGap = (plotPeriod < 7 * 24 * 60 * 60) ? 60 * 60 : 6 * 60 * 60;
    const dataWithGaps = dataGroupedByNode.map(nodeData => insertGaps(nodeData, maxGap));

    const data = groupByField(dataWithGaps);

    const settings = getPlotSettings(rawData);

    return { data, settings };
}


export const usePlotData = ({ plotPeriod }) => {
    const { data } = useSWR(() => `${baseURL}/measurements/bulk?period=${plotPeriod}`, jsonFetcher, { refreshInterval: 30 * 1000 });
    const reducedData = reducePlotData(data, plotPeriod);
    return reducedData;
}

export const useNewestData = () => {
    return useSWR(() => `${baseURL}/measurements/newest`, jsonFetcher, { refreshInterval: 30 * 1000 })
}