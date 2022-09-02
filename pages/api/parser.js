
const Graph = require('graphology')
const gefx = require('graphology-gexf')

const parser = function(gefxFile){
    let graph = {
        nodes: [],
        links : []
    }

    let semiParsedGraph = gefx.parse(Graph,gefxFile)
    semiParsedGraph.forEachNode(node => graph.nodes.push({
        "id" : node
    }))
    semiParsedGraph.forEachEdge((ed,atts,source,target) => graph.links.push({
        "source": source,
        "target": target
    }))

    return graph
}

    
module.exports = {parser}












