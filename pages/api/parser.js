
const Graph = require('graphology')
const gefx = require('graphology-gexf')

const parser = function(gexfFile){

    let graph = {
        nodes: [],
        links : []
    }

    let semiParsedGraph = gefx.parse(Graph,gexfFile)

    semiParsedGraph.forEachNode(node => graph.nodes.push({
        "id" : node,
    }))
    semiParsedGraph.forEachEdge((ed,atts,source,target) => graph.links.push({
        "source": source,
        "target": target
    }))

    return graph
}

    
module.exports = {
    parser
}












