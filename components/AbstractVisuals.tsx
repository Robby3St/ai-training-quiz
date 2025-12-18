import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { VisualMode } from '../types';

interface AbstractVisualsProps {
  mode: VisualMode;
  className?: string;
}

interface Node extends d3.SimulationNodeDatum {
  id: number;
  r: number;
  baseR: number;
  color: string;
  targetX?: number;
  targetY?: number;
}

const AbstractVisuals: React.FC<AbstractVisualsProps> = ({ mode, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);
  const rainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Config persistence to keep flower consistent during resize
  const flowerConfigRef = useRef({
    baseHue: 0,
    petalCount: 6,
    petalSpread: 0.5,
    hasDoubleLayer: false,
    hasStalk: false,
    stalkCurve: 0
  });

  const prevModeRef = useRef<VisualMode>(mode);

  // Handle Resize
  useEffect(() => {
    if (!svgRef.current) return;
    
    const observeTarget = svgRef.current;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
        });
      }
    });
    
    resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize DOM structure and Simulation
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    if (!svgRef.current) return;

    const numNodes = 80;
    const nodes: Node[] = Array.from({ length: numNodes }, (_, i) => ({
        id: i,
        baseR: Math.random() * 8 + 6,
        r: 0, 
        color: "#60a5fa",
        x: dimensions.width / 2 + (Math.random() - 0.5) * 50,
        y: dimensions.height / 2 + (Math.random() - 0.5) * 50,
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Styles
    svg.append("defs").append("style").text(`
      @keyframes float-spin {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.05); }
        100% { transform: rotate(360deg) scale(1); }
      }
      @keyframes breathe {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      .animate-flower-head {
        animation: float-spin 20s linear infinite;
      }
      .animate-cloud {
        animation: breathe 8s ease-in-out infinite;
      }
      .stalk-path {
         stroke-linecap: round;
         fill: none;
         stroke-width: 8;
         opacity: 0.7;
         transition: all 1s ease;
      }
    `);
    
    // Layers
    // 0. Rain Layer (New) - Behind everything
    svg.append("g").attr("class", "rain-layer");
    
    // 1. Stalk Layer (Static)
    svg.append("g").attr("class", "stalk-layer");

    // 2. Head Layer (Animated)
    const headG = svg.append("g").attr("class", "head-layer");

    const nodeElements = headG
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("fill", d => d.color)
        .attr("opacity", 0.6);

    const simulation = d3.forceSimulation<Node>(nodes)
        .velocityDecay(0.2)
        .on("tick", () => {
             nodeElements
                .attr("cx", d => d.x!)
                .attr("cy", d => d.y!)
                .attr("r", d => d.r);
        });
    
    simulationRef.current = simulation;
    
    return () => {
        simulation.stop();
        if (rainIntervalRef.current) clearInterval(rainIntervalRef.current);
    };
  }, [dimensions.width, dimensions.height]);

  // Mode Logic
  useEffect(() => {
    if (!simulationRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const minDim = Math.min(width, height);
    const scale = Math.max(0.3, minDim / 800); 

    const simulation = simulationRef.current;
    const svg = d3.select(svgRef.current);
    const rainLayer = svg.select(".rain-layer");
    const stalkLayer = svg.select(".stalk-layer");
    const headLayer = svg.select(".head-layer");

    // Clean up previous rain
    if (rainIntervalRef.current) {
        clearInterval(rainIntervalRef.current);
        rainIntervalRef.current = null;
    }
    rainLayer.selectAll("*").interrupt().remove();

    // Check for new FLOWER session to randomize config
    // We only generate new random flower properties if we are just entering FLOWER mode
    if (mode === VisualMode.FLOWER && prevModeRef.current !== VisualMode.FLOWER) {
        flowerConfigRef.current = {
            baseHue: Math.random() * 360,
            petalCount: Math.floor(Math.random() * 4) + 5, // 5 to 8 petals
            petalSpread: Math.random() * 0.5 + 0.5,
            hasDoubleLayer: Math.random() < 0.6, // 60% chance of double petals
            hasStalk: Math.random() < 0.7, // 70% chance of stalk
            stalkCurve: (Math.random() - 0.5) * 100 // random curve for stalk
        };
    }
    prevModeRef.current = mode;
    const config = flowerConfigRef.current;

    // Reset forces
    simulation.force("charge", null);
    simulation.force("center", null);
    simulation.force("collide", null);
    simulation.force("x", null);
    simulation.force("y", null);

    // Default node size update
    simulation.nodes().forEach(n => n.r = n.baseR * scale);

    // --- IDLE MODE ---
    if (mode === VisualMode.IDLE) {
       headLayer.attr("class", "head-layer"); // Remove animation
       headLayer.style("transform-origin", null);
       stalkLayer.selectAll("*").remove(); // No stalk

       simulation
        .force("charge", d3.forceManyBody().strength(-20 * scale))
        .force("center", d3.forceCenter(centerX, centerY))
        .force("collide", d3.forceCollide().radius((d: any) => d.r + 5 * scale).iterations(2))
        .alpha(0.5).restart();
      
      headLayer.selectAll("circle")
        .transition().duration(1000)
        .attr("fill", (d, i) => i % 2 === 0 ? "#60a5fa" : "#34d399")
        .attr("opacity", 0.4);
    } 

    // --- CLOUD MODE ---
    else if (mode === VisualMode.CLOUD) {
       headLayer.attr("class", "head-layer animate-cloud");
       headLayer.style("transform-origin", `${centerX}px ${centerY}px`);
       
       stalkLayer.selectAll("*").remove();

       const nodes = simulation.nodes();
       nodes.forEach((d, i) => {
          const theta = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * 120 * scale;
          d.targetX = centerX + r * Math.cos(theta) * 1.5; 
          d.targetY = centerY + r * Math.sin(theta) * 0.6; 
       });

      simulation
        .force("collide", d3.forceCollide().radius((d: any) => d.r).strength(1))
        .force("x", d3.forceX((d: any) => d.targetX!).strength(0.1))
        .force("y", d3.forceY((d: any) => d.targetY!).strength(0.1))
        .force("center", d3.forceCenter(centerX, centerY).strength(0.1))
        .alpha(1).restart();

      headLayer.selectAll("circle")
        .transition().duration(2000)
        .attr("fill", (d, i) => ["#94a3b8", "#64748b", "#475569"][i % 3])
        .attr("opacity", 0.85);

      // Start Rain
      rainIntervalRef.current = setInterval(() => {
          // Cloud spread is roughly +/- 180 * scale horizontally
          const xOffset = (Math.random() - 0.5) * 220 * scale; 
          const yOffset = (Math.random() * 50 - 20) * scale;
          
          rainLayer.append("line")
            .attr("x1", centerX + xOffset)
            .attr("y1", centerY + yOffset)
            .attr("x2", centerX + xOffset)
            .attr("y2", centerY + yOffset + 5 * scale)
            .attr("stroke", "#64748b") // Slate 500
            .attr("stroke-width", 1.5 * scale)
            .attr("stroke-linecap", "round")
            .attr("opacity", 0)
            .transition().duration(200).attr("opacity", 0.6)
            .transition().duration(700).ease(d3.easeLinear)
            .attr("y1", centerY + yOffset + 150 * scale)
            .attr("y2", centerY + yOffset + 160 * scale)
            .attr("opacity", 0)
            .remove();
      }, 30);
    }

    // --- FLOWER MODE ---
    else if (mode === VisualMode.FLOWER) {
      headLayer.attr("class", "head-layer animate-flower-head");
      // Critical: Set transform origin to center of screen so it spins around the stalk tip
      headLayer.style("transform-origin", `${centerX}px ${centerY}px`);

      // 1. Render Stalk (Static)
      stalkLayer.selectAll("*").remove();
      if (config.hasStalk) {
          const stalkHeight = 300 * scale;
          const curveX = centerX + config.stalkCurve * scale;
          // Curve from center downwards
          const pathData = `M ${centerX} ${centerY} Q ${curveX} ${centerY + stalkHeight/2} ${centerX} ${centerY + stalkHeight}`;
          
          stalkLayer.append("path")
              .attr("d", pathData)
              .attr("class", "stalk-path")
              .attr("stroke", d3.hsl(120, 0.4, 0.4).toString()) // Natural green
              .attr("stroke-width", 12 * scale); // Thick stem
      }

      // 2. Define Colors
      const centerColor = d3.hsl((config.baseHue + 180) % 360, 0.8, 0.7).toString();
      const petalColor1 = d3.hsl(config.baseHue, 0.7, 0.6).toString();
      const petalColor2 = d3.hsl(config.baseHue + 30, 0.8, 0.5).toString();
      const petalColor3 = d3.hsl(config.baseHue - 20, 0.6, 0.7).toString(); // Outer petals

      const nodes = simulation.nodes();
      
      // Node Distribution for Layers
      // Pistil: 20%
      // If double layer: Inner (35%), Outer (45%)
      // If single layer: Petals (80%)
      
      let pistilEndIdx = Math.floor(nodes.length * 0.2); 
      let innerPetalEndIdx = nodes.length; 
      
      if (config.hasDoubleLayer) {
          innerPetalEndIdx = Math.floor(nodes.length * 0.55); 
      }

      nodes.forEach((d, i) => {
         // --- Pistil ---
         if (i < pistilEndIdx) {
             d.targetX = centerX;
             d.targetY = centerY;
         } 
         // --- Inner Petals (or only layer) ---
         else if (i < innerPetalEndIdx) {
             const idx = i - pistilEndIdx;
             const total = innerPetalEndIdx - pistilEndIdx;
             const angle = (idx / total) * Math.PI * 2;
             
             // Rose curve shape
             const k = config.petalCount;
             const rBase = 100 * scale;
             const rVar = 60 * scale * config.petalSpread;
             const lobe = Math.cos(k * angle);
             const r = rBase + rVar * lobe;
             
             d.targetX = centerX + r * Math.cos(angle);
             d.targetY = centerY + r * Math.sin(angle);
         }
         // --- Outer Petals (optional) ---
         else {
             const idx = i - innerPetalEndIdx;
             const total = nodes.length - innerPetalEndIdx;
             // Offset angle to stagger petals
             const angleOffset = Math.PI / config.petalCount; 
             const angle = (idx / total) * Math.PI * 2 + angleOffset;
             
             const k = config.petalCount;
             const rBase = 160 * scale; // Larger base radius
             const rVar = 70 * scale * config.petalSpread;
             const lobe = Math.cos(k * angle);
             const r = rBase + rVar * lobe;
             
             d.targetX = centerX + r * Math.cos(angle);
             d.targetY = centerY + r * Math.sin(angle);
         }
      });

      simulation
        .force("charge", d3.forceManyBody().strength(-5 * scale)) 
        .force("collide", d3.forceCollide().radius((d: any) => d.r + 2 * scale).strength(0.8))
        .force("x", d3.forceX((d: any) => d.targetX!).strength(0.3)) 
        .force("y", d3.forceY((d: any) => d.targetY!).strength(0.3))
        .alpha(1).restart();

      // Apply Colors
      headLayer.selectAll("circle")
        .transition().duration(2000)
        .attr("fill", (d: any, i: number) => {
             if (i < pistilEndIdx) return centerColor;
             if (i < innerPetalEndIdx) return i % 2 === 0 ? petalColor1 : petalColor2;
             return petalColor3;
        })
        .attr("opacity", 0.9);
    }
    
    return () => {
         if (rainIntervalRef.current) clearInterval(rainIntervalRef.current);
    };
  }, [mode, dimensions]);

  return (
    <svg
      ref={svgRef}
      className={className || "w-full h-full"}
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }} 
    />
  );
};

export default AbstractVisuals;