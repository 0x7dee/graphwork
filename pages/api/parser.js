
const Graph = require('graphology')
const gexf = require('graphology-gexf')

const parser = function(gexfFile){

    let attributes = {

    }

    let graph = {
        nodes: [],
        links : []
    }

    let semiParsedGraph = gexf.parse(Graph,gexfFile)


    const nodeParser = function(node){
        graph.nodes.push({
            "id" : node
        })

        attributes[node] = semiParsedGraph.getNodeAttributes(node)
    }

    semiParsedGraph.forEachNode(node => nodeParser(node))
    semiParsedGraph.forEachEdge((ed,atts,source,target) => graph.links.push({
        "source": source,
        "target": target
    }))

    return {
        graph,
        attributes
    }
}

    
module.exports = {
    parser
}












