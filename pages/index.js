import Head from 'next/head'
import Image from 'next/image'
import miserables from '../data/miserables.json'
import euro from '../data/euro.json'
import { parser } from './api/parser'
import * as d3 from "d3"
import { useEffect, useState, useCallback } from 'react'
import { zoom } from 'd3'

export default function Home() {

  let [graphState, setGraphState] = useState({nodes:[],links:[]})
  let [graphAttributes, setGraphAttributes] = useState({})
  let [selectedNode, setSelectedNode] = useState({})
  let [connectedNodes, setConnectedNodes] = useState([])
  let [hoveredNode, setHoveredNode] = useState('None')

  let displayed = false

  useEffect(() => {
     // Copyright 2021 Observable, Inc.
  // Released under the ISC license.
  // https://observablehq.com/@d3/force-directed-graph
  function ForceGraph({
    nodes, // an iterable of node objects (typically [{id}, …])
    links // an iterable of link objects (typically [{source, target}, …])
  }, {
    nodeId = d => d.id, // given d in nodes, returns a unique identifier (string)
    nodeGroup, // given d in nodes, returns an (ordinal) value for color
    nodeGroups, // an array of ordinal values representing the node groups
    nodeTitle, // given d in nodes, a title string
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 5, // node radius, in pixels
    nodeStrength,
    linkSource = ({source}) => source, // given d in links, returns a node identifier string
    linkTarget = ({target}) => target, // given d in links, returns a node identifier string
    linkStroke = "#999", // link stroke color
    linkStrokeOpacity = 0.6, // link stroke opacity
    linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
    linkStrokeLinecap = "round", // link stroke linecap
    linkStrength,
    colors = d3.schemeTableau10, // an array of color strings, for the node groups
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    invalidation // when this promise resolves, stop the simulation
  } = {}) {
    // Compute values.
    const N = d3.map(nodes, nodeId).map(intern);
    const LS = d3.map(links, linkSource).map(intern);
    const LT = d3.map(links, linkTarget).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);

    // Replace the input nodes and links with mutable objects for the simulation.
    nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
    links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));

    // Compute default domains.
    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

    // Construct the scales.
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

    // Construct the forces.
    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(links).id(({index: i}) => N[i]);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);

    const simulation = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center",  d3.forceCenter())
        .on("tick", ticked);

    const svg = d3.create("svg")
        //- .attr("width", width)
        //- .attr("height", height)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        /*.call(d3.zoom().on('zoom', (e) => {
          d3.select('svg g').attr('transform', e.transform);
        }))*/
        .call(d3.zoom().on("zoom", function () {
          svg.attr("transform", d3.zoomTransform(this))
        }))
        
    
    const link = svg.append("g")
        .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        .attr("stroke-opacity", linkStrokeOpacity)
        .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
        .attr("stroke-linecap", linkStrokeLinecap)
        .attr("class", "lines")
        .selectAll("line")
        .data(links)
        .join("line")
        .on('click', link => {
          console.log(link)
        })

    const node = svg.append("g")
        .attr("fill", nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth)
        .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", nodeRadius)
        .attr("class", "graphG")
        .on('mouseover', (node) => setHoveredNode(`${node.srcElement['__data__'].id}`))
        .on('mouseout', () => setHoveredNode('None'))
        .on('click', node => {
          let renderedAttributes = retrieveNodeAttributes(node.srcElement['__data__'].id)
          console.log(node)
          setSelectedNode( {'node': node,
                           'attributes' : renderedAttributes})
          
          //setConnectedNodes([node.srcElement['__data__'].id])
          findConnectedNodes(node.srcElement['__data__'].id)
        }
          )
        .call(drag(simulation));

    if (W) link.attr("stroke-width", ({index: i}) => W[i]);
    if (L) link.attr("stroke", ({index: i}) => L[i]);
    if (G) node.attr("fill", ({index: i}) => color(G[i]));
    if (T) node.append("title").text(({index: i}) => T[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());     

    function intern(value) {
      return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    function ticked() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    }

    function drag(simulation) {    
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return Object.assign(svg.node(), {scales: {color}});
  }

  const retrieveNodeAttributes = function(id){
    let nodeAttr = graphAttributes[id]
    const excluded = ['label','size','color','x','y','z']
    if(Object.keys(nodeAttr).length < 1){
     return (<div><h3>Attributes</h3><p>No attributes available</p></div>)
    }
    else if(Object.keys(nodeAttr).filter(elem => !excluded.includes(elem)).length < 1){
      return(<div><h3>Attributes</h3>{nodeAttr.label ? <p>{nodeAttr.label}</p> : <p>No attributes available</p>}</div>)

    }
    return (<div>
     <h3>Attributes</h3>
     <details>
      <summary>{nodeAttr.label ? nodeAttr.label : 'Node Attributes'}</summary>
     {
      (() => {
       let attributes = []
       let count = 0
       for(let [attr,value] of Object.entries(nodeAttr)){
         if(excluded.includes(attr)){
          continue
         }
         attributes.push(  
           <p key={count} onClick={()=> {groupGraphAroundAttribute(attr)}}>{attr}: {value}</p>
         )
         count++
      }
      return attributes
     })() 
     }
     </details>
    </div>)
}

const groupGraphAroundAttribute = function(attr){
  let groupNumbers = {}
  let count = 1
  for(let attributes of Object.values(graphAttributes)){
        let reference = attributes[attr]
        if(!reference){
          continue
        }
        if(Object.keys(groupNumbers).includes(attributes[attr])){
          continue
        }
        else{
          groupNumbers[reference] = count
          count++
        }
  }
  
  
  let newNodes = graphState.nodes.map(function(nodeObj){
    const id = Object.values(nodeObj)[0]
    let reference = graphAttributes[id][attr]
    let value = groupNumbers[reference]
    value ? Object.assign(nodeObj,{group : value}) : nodeObj
    return nodeObj
  })
  
  setGraphState(graphState => Object.assign({},graphState, {nodes : newNodes}))
}

    let chart = ForceGraph(graphState, {
      nodeId: d => d.id,
      nodeGroup: d => d.group,
      nodeTitle: d => `ID: ${d.id}`,
      linkStrokeWidth: l => Math.sqrt(l.value),
      width: 1000,
      height: 600,
      invalidation: null // a promise to stop the simulation when the cell is re-run
    })
    let displaySvg = document.getElementById('svg')

    if ( displaySvg.innerHTML === '' ) {
      displaySvg.appendChild(chart)
    }
    
  }, [graphState, graphAttributes])

 
  const displayConnectedNodes = (nodeId) => {
    if (!nodeId) return
    
    let svg = d3.select('svg g').selectAll('line')
    //Array.from(svg['_groups'][0]).forEach(line => console.log(line['__data__']))
    
    return Array.from(svg['_groups'][0]).map(line => {
      let source = line['__data__'].source.id
      let target = line['__data__'].target.id
      let sourceLabel = graphAttributes[source].label
      let targetLabel = graphAttributes[target].label

      if ( source === nodeId ) return targetLabel ? <div className='app__sidebar--connectedNode'><p className='app__sidebar--connectedNode--label'>{targetLabel}</p><p className='app__sidebar--connectedNode--id'>id: { target }</p></div> : <p className='app__sidebar--connectedNode--id'>id :{ target }</p>
      if ( target === nodeId ) return sourceLabel ? <div className='app__sidebar--connectedNode'><p className='app__sidebar--connectedNode--label'>{sourceLabel}</p><p className='app__sidebar--connectedNode--id'>id: { source }</p></div> : <p className='app__sidebar--connectedNode--id'>id :{ source }</p>
      
    })
    
  }

  const findConnectedNodes = async (nodeId) => {
    if (!nodeId) return
    
    let svg = d3.select('svg g').selectAll('line')

    let foundNodes = []
    
    // Get all nodes linked to selectedNode
    Array.from(svg['_groups'][0]).map(line => {
      let source = line['__data__'].source.id
      let target = line['__data__'].target.id

      if ( source === nodeId ) foundNodes.push(target)
      if ( target === nodeId ) foundNodes.push(source)
    })
    setConnectedNodes([nodeId, ...foundNodes])
  }

  const updateNodeColors = useCallback(() => {
    if (!connectedNodes) return
    let nodes = d3.select('.nodes').selectAll('circle')
    nodes.style("fill", (d) => {
      if ( connectedNodes.includes(d.id) ) {
        return "#FF0000"
      }
      return d.color
    })
  })

  useEffect(() => {
    updateNodeColors()
  }, [connectedNodes, updateNodeColors])

  useEffect(() => {
    if ( graphAttributes[hoveredNode] ) setHoveredNode(graphAttributes[hoveredNode].label)
  }, [graphAttributes, hoveredNode])

  const resetDisplaySVG = function(){
    let displaySvg = document.getElementById('svg')
    displaySvg.innerHTML = '';
    return
  }

  const importGexf = function(event){
    let fileReader = new FileReader()
    let file = event.target.files[0]
    fileReader.onload = function(){
      let parsedFile = parser(fileReader.result)
      setGraphState(parsedFile.graph)
      setGraphAttributes(parsedFile.attributes)

    }
    if(file){
      resetDisplaySVG()
      fileReader.readAsText(file)
    }
    else{
      console.log('Problem with parsing file import')
    }
    return

  }

  return (
    <div className='app'>
      <Head>
        <title>Bellingcat Hackathon</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app__sidebar">
        <h1 className='app__sidebar--title'>Network Analysis Tool</h1>
        <input type="file" onChange={(e) => {importGexf(e)}} accept=".gexf"/>
        <h2 className='app__sidebar--subtitle'>Selected Node</h2>
        <p>{ `id: ${ selectedNode.node && selectedNode.node.srcElement ? selectedNode.node.srcElement['__data__'].id : 'Not selected' }`}</p>
        <p className='app__sidebar--attributes'>{selectedNode.node && selectedNode.node.srcElement ? selectedNode.attributes : false}</p>
        <div>
        <h2 className='app__sidebar--subtitle'>Connected nodes</h2>
        <div className="app__sidebar__connectedNodes">
          { displayConnectedNodes( selectedNode.node && selectedNode.node.srcElement ? selectedNode.node.srcElement['__data__'].id : null ) }
        </div>
        </div>
        <h1>{ hoveredNode }</h1>
      </div>

      <div className='app__svg' id="svg">
      </div>

      
    </div>
  )
}
