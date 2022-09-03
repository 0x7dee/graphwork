import Head from 'next/head'
import Image from 'next/image'
import miserables from '../data/miserables.json'
import euro from '../data/euro.json'
import * as d3 from "d3"
import { useEffect, useState } from 'react'
import { zoom } from 'd3'

export default function Home() {

  let [selectedNode, setSelectedNode] = useState({})
  let [connectedNodes, setConnectedNodes] = useState([])

  let displayed = false

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
        .on('click', node => {
          console.log(node)
          setSelectedNode(node)
          setConnectedNodes([node.srcElement['__data__'].id])
        })
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

  useEffect(() => {
    let chart = ForceGraph(euro, {
      nodeId: d => d.id,
      nodeGroup: d => d.group,
      nodeTitle: d => `${d.id}\n${d.group}`,
      linkStrokeWidth: l => Math.sqrt(l.value),
      width: 1000,
      height: 600,
      invalidation: null // a promise to stop the simulation when the cell is re-run
    })
    let displaySvg = document.getElementById('svg')

    if ( displaySvg.innerHTML === '' ) {
      displaySvg.appendChild(chart)
    }
    
  }, [])

  const displayConnectedLinks = (nodeId) => {
    if (!nodeId) return
    
    let svg = d3.select('svg g').selectAll('line')
    //Array.from(svg['_groups'][0]).forEach(line => console.log(line['__data__']))
    
    return Array.from(svg['_groups'][0]).map(line => {
      let source = line['__data__'].source.id
      let target = line['__data__'].target.id

      if ( source === nodeId ) return <p>{ target }</p>
      if ( target === nodeId ) return <p>{ source }</p>
      
    })
    
  }

  const findConnectedNodes = async (nodeId) => {
    if (!nodeId) return
    
    let lines = d3.select('svg g').selectAll('line')
    
    // Get all nodes linked to selectedNode
    Array.from(lines['_groups'][0]).map(line => {
      let source = line['__data__'].source.id
      let target = line['__data__'].target.id

      if ( source === nodeId ) setConnectedNodes([...connectedNodes, target])
      if ( target === nodeId ) setConnectedNodes([...connectedNodes, source])
    })

    console.log({ connectedNodes })

  }

  const updateNodeColors = () => {
    let nodes = d3.select('.nodes').selectAll('circle')
    nodes.style("fill", (d) => {
      if ( connectedNodes.includes(d.id) ) {
        console.log(d)
        return "#FF0000"
      }
      return d.color
    })
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
        <input type="file" />
        <h2>Selected Node</h2>
        <p>{ `Node id: ${ selectedNode.srcElement ? selectedNode.srcElement['__data__'].id : 'Not selected' }`}</p> 
        <p>Nodes connected to:</p>
        { displayConnectedLinks( selectedNode.srcElement ? selectedNode.srcElement['__data__'].id : null ) }
        <button onClick={() => findConnectedNodes(selectedNode.srcElement['__data__'].id)}>Find all connected nodes</button>
        <button onClick={() => updateNodeColors() }>Get circles</button>
      </div>

      <div className='app__svg' id="svg">
      </div>

      
    </div>
  )
}
