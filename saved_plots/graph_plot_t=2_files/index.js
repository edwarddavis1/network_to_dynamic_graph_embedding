import { scatterPlot } from "./scatterPlot.js";
// import { networkPlot } from "./network.js";
import { networkPlot } from "./networkNoAnimate.js";

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Load data from data.json
async function loadGraph(n) {
    const data = await d3.json("./data/graph_t=" + n + ".json");
    return data;
}

async function loadSpringPositions(t) {
    const data = await d3.csv("./data/pos_df_t=" + t + ".csv");
    return data;
}

// Create a network plot from the data
async function main() {
    let t = 2;

    const graphData = await loadGraph(t);
    const springPositions = await loadSpringPositions(t);

    const network = networkPlot()
        .width(width)
        .height(height)
        .xDomain(d3.extent(springPositions, (d) => d.x))
        .yDomain(d3.extent(springPositions, (d) => d.y))

        .data(graphData)
        .margin({
            top: height,
            right: 50,
            bottom: height,
            left: 30,
        })
        .precomputedPositions(springPositions);

    svg.call(network);

    // const K = 3;
    // let graphDataList = [];
    // let springPositionsList = [];
    // for (let t = 0; t < K; t++) {
    //     graphDataList.push(await loadGraph(t));
    //     springPositionsList.push(await loadSpringPositions(t));
    // }
}

main();
