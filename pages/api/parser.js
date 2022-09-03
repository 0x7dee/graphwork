
const Graph = require('graphology')
const gefx = require('graphology-gexf')

let groupNumbers = {}

const groupByAttribute = function(graph,node, attr){
    let value = graph.getNodeAttribute(node,attr)
    if(Object.keys(groupNumbers).includes(value)){
        return groupNumbers[value]
    }
    groupNumbers[value] = Object.keys(groupNumbers).length + 1
    return groupNumbers[value]

}

const parser = function(gefxFile, attr, groupingFunction=groupByAttribute){

    let graph = {
        nodes: [],
        links : []
    }

    let semiParsedGraph = gefx.parse(Graph,gefxFile)

    semiParsedGraph.forEachNode(node => graph.nodes.push({
        "id" : node,
        "group" : groupingFunction(graph,node,attr)
    }))
    semiParsedGraph.forEachEdge((ed,atts,source,target) => graph.links.push({
        "source": source,
        "target": target
    }))

    return graph
}

    
module.exports = {parser}












