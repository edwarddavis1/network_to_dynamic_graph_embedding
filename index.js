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

// Load data from plot_df.csv
async function loadEmbedding() {
    const data = await d3.csv("./data/dynamic_embedding_df.csv");
    return data;
}

// Create a network plot from the data
async function main() {
    let t = 0;

    const embeddingData = await loadEmbedding();
    const filteredData = embeddingData.filter((d) => d.t == t);
    const scatter = scatterPlot()
        .width(width)
        .height(height)
        .data(filteredData)
        .margin({
            top: 30,
            right: 30,
            bottom: 100,
            left: 30,
            left: width / 2,
        })
        .size(5)
        .xValue((d) => d.x_emb)
        .yValue((d) => d.y_emb)
        .yAxisLabel("Embedding Dimension 2")
        .xAxisLabel("Embedding Dimension 1")
        .xDomain(d3.extent(embeddingData, (d) => d.x_emb))
        .yDomain([
            -d3.max(embeddingData, (d) => d.y_emb),
            d3.max(embeddingData, (d) => d.y_emb),
        ])
        .colourValue((d) => d.tau);

    svg.call(scatter);

    const graphData = await loadGraph(t);
    const springPositions = await loadSpringPositions(t);

    const network = networkPlot()
        .width(width / 2)
        .height(height)
        .xDomain(d3.extent(springPositions, (d) => d.x))
        .yDomain(d3.extent(springPositions, (d) => d.y))

        .data(graphData)
        .margin({
            top: height / 4,
            right: 50,
            bottom: height / 4,
            left: 30,
        })
        .precomputedPositions(springPositions);

    svg.call(network);

    let graphDataList = [];
    let springPositionsList = [];
    for (let t = 0; t < 4; t++) {
        graphDataList.push(await loadGraph(t));
        springPositionsList.push(await loadSpringPositions(t));
    }
    // let i = 0;
    function update(i) {
        t = (t + 1) % 4;

        // remove all network class things
        svg.selectAll(".network").remove();

        scatter.data(embeddingData.filter((d) => d.t == t));
        svg.call(scatter);

        network.data(graphDataList[t]);
        network.precomputedPositions(springPositionsList[t]);
        svg.call(network);
    }

    setInterval(update, 1000);
}

main();