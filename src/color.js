let colors = ['#f89b15', '#e9513e', '#73b127', '#587ee6',];

let colorMap = {};

export const getNodeColor = (id) => {
    if (!(id in colorMap)) {
        colorMap[id] = colors.pop();
    }

    return colorMap[id];
}