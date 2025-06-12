import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const FamilyTreeD3 = ({ data }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!data || !data.tree) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Dimensions and margins
    const margin = { top: 60, right: 150, bottom: 60, left: 150 };
    const width = 1600 - margin.left - margin.right;
    const height = 1000 - margin.bottom - margin.top;

    // Set up SVG with zoom
    svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tree layout with larger spacing
    const tree = d3.tree()
      .size([width, height])
      .separation((a, b) => {
        // Increase spacing between nodes
        return a.parent === b.parent ? 2 : 3;
      });

    // Transform data to D3 hierarchy - FIXED LAYOUT
    const transformNode = (node, level = 0) => {
      const result = {
        ...node,
        level: level
      };

      if (node.children && node.children.length > 0) {
        result.children = node.children.map(child => transformNode(child, level + 1));
      }

      return result;
    };

    const root = d3.hierarchy(transformNode(data.tree));
    tree(root);

    // Create separate spouse nodes and adjust positions
    const allNodes = [];
    const spouseNodes = [];
    const marriageLinks = [];

    root.descendants().forEach(d => {
      allNodes.push(d);
      
      if (d.data.spouse) {
        // Create spouse node with proper positioning
        const spouseNode = {
          data: {
            ...d.data.spouse,
            isSpouse: true,
            spouseOf: d.data
          },
          x: d.x + 250, // Increased spacing
          y: d.y,
          depth: d.depth,
          parent: d.parent
        };
        
        spouseNodes.push(spouseNode);
        allNodes.push(spouseNode);
        
        // Create marriage link
        marriageLinks.push({
          source: d,
          target: spouseNode
        });
      }
    });

    // Adjust x positions to prevent overlapping
    const nodesByLevel = d3.group(allNodes, d => d.depth);
    nodesByLevel.forEach((nodes, level) => {
      const sortedNodes = nodes.sort((a, b) => a.x - b.x);
      const minSpacing = 280;
      
      for (let i = 1; i < sortedNodes.length; i++) {
        const prevNode = sortedNodes[i - 1];
        const currentNode = sortedNodes[i];
        const requiredX = prevNode.x + minSpacing;
        
        if (currentNode.x < requiredX) {
          const shift = requiredX - currentNode.x;
          // Shift current node and all nodes to its right
          for (let j = i; j < sortedNodes.length; j++) {
            sortedNodes[j].x += shift;
          }
        }
      }
    });

    // Draw generation backgrounds
    const generations = d3.group(
      allNodes.filter(d => !d.data.isSpouse), 
      d => d.data.generation || d.depth + 1
    );
    
    generations.forEach((nodes, generation) => {
      const minY = d3.min(nodes, d => d.y) - 50;
      const maxY = d3.max(nodes, d => d.y) + 50;
      const minX = d3.min(allNodes, d => d.x) - 200;
      const maxX = d3.max(allNodes, d => d.x) + 200;
      
      g.append("rect")
        .attr("x", minX)
        .attr("y", minY)
        .attr("width", maxX - minX)
        .attr("height", maxY - minY)
        .attr("fill", generation % 2 === 1 ? "#f8fafc" : "#f1f5f9")
        .attr("opacity", 0.3)
        .attr("rx", 8);
        
      // Add generation label
      g.append("text")
        .attr("x", minX + 15)
        .attr("y", minY + 25)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#475569")
        .text(`Đời ${generation}`);
    });

    // Draw family tree links (parent-child)
    const links = root.links();
    const linkGenerator = d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y);

    g.selectAll(".link")
      .data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGenerator)
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6);

    // Draw marriage links (horizontal lines)
    g.selectAll(".marriage-link")
      .data(marriageLinks)
      .enter()
      .append("line")
      .attr("class", "marriage-link")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", "#dc2626")
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0.8);

    // Create node groups for all nodes
    const nodeGroups = g.selectAll(".node")
      .data(allNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Add node backgrounds
    nodeGroups
      .append("rect")
      .attr("width", 220)
      .attr("height", 90)
      .attr("x", -110)
      .attr("y", -45)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", d => {
        if (d.data.isSpouse) {
          return d.data.gender ? "#dbeafe" : "#fce7f3";
        }
        return d.data.gender ? "#bfdbfe" : "#f9a8d4";
      })
      .attr("stroke", d => {
        if (d.data.isSpouse) {
          return d.data.gender ? "#3b82f6" : "#ec4899";
        }
        return d.data.gender ? "#2563eb" : "#db2777";
      })
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke-width", 4)
          .attr("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("filter", "none");
      });

    // Add name text
    nodeGroups
      .append("text")
      .attr("dy", "-15")
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text(d => d.data.fullName);

    // Add role text
    nodeGroups
      .append("text")
      .attr("dy", "0")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text(d => d.data.roleFamily);

    // Add birth year
    nodeGroups
      .append("text")
      .attr("dy", "18")
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "#64748b")
      .text(d => {
        if (d.data.birthDate) {
          const year = new Date(d.data.birthDate).getFullYear();
          return `Sinh: ${year}`;
        }
        return "";
      });

    // Add gender icons
    nodeGroups
      .append("circle")
      .attr("cx", 85)
      .attr("cy", -30)
      .attr("r", 10)
      .attr("fill", d => d.data.gender ? "#3b82f6" : "#ec4899")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    nodeGroups
      .append("text")
      .attr("x", 85)
      .attr("y", -24)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text(d => d.data.gender ? "♂" : "♀");

    // Add family name title
    g.append("text")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")

    // Add zoom controls
    const controlsGroup = svg.append("g")
      .attr("transform", "translate(20, 20)");

    // Zoom in button
    const zoomInButton = controlsGroup.append("g")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.5);
      });

    zoomInButton.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("rx", 5)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#1e40af")
      .attr("stroke-width", 1);

    zoomInButton.append("text")
      .attr("x", 20)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text("+");

    // Zoom out button
    const zoomOutButton = controlsGroup.append("g")
      .attr("transform", "translate(0, 50)")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.67);
      });

    zoomOutButton.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("rx", 5)
      .attr("fill", "#ef4444")
      .attr("stroke", "#dc2626")
      .attr("stroke-width", 1);

    zoomOutButton.append("text")
      .attr("x", 20)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text("−");

    // Reset zoom button
    const resetButton = controlsGroup.append("g")
      .attr("transform", "translate(0, 100)")
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
      });

    resetButton.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("rx", 5)
      .attr("fill", "#6b7280")
      .attr("stroke", "#4b5563")
      .attr("stroke-width", 1);

    resetButton.append("text")
      .attr("x", 20)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text("⌂");

    // Add legend
    const legend = g.append("g")
      .attr("transform", `translate(${width - 200}, 20)`);

    legend.append("rect")
      .attr("width", 180)
      .attr("height", 140)
      .attr("fill", "white")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1)
      .attr("rx", 8)
      .attr("opacity", 0.95);

    legend.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#1e293b")
      .text("Chú thích:");

    // Male legend
    legend.append("rect")
      .attr("x", 10)
      .attr("y", 30)
      .attr("width", 20)
      .attr("height", 15)
      .attr("fill", "#bfdbfe")
      .attr("stroke", "#2563eb")
      .attr("rx", 3);

    legend.append("text")
      .attr("x", 35)
      .attr("y", 42)
      .attr("font-size", "11px")
      .attr("fill", "#1e293b")
      .text("Nam giới");

    // Female legend
    legend.append("rect")
      .attr("x", 10)
      .attr("y", 50)
      .attr("width", 20)
      .attr("height", 15)
      .attr("fill", "#f9a8d4")
      .attr("stroke", "#db2777")
      .attr("rx", 3);

    legend.append("text")
      .attr("x", 35)
      .attr("y", 62)
      .attr("font-size", "11px")
      .attr("fill", "#1e293b")
      .text("Nữ giới");

    // Marriage line legend
    legend.append("line")
      .attr("x1", 10)
      .attr("y1", 80)
      .attr("x2", 30)
      .attr("y2", 80)
      .attr("stroke", "#dc2626")
      .attr("stroke-width", 3);

    legend.append("text")
      .attr("x", 35)
      .attr("y", 84)
      .attr("font-size", "11px")
      .attr("fill", "#1e293b")
      .text("Quan hệ vợ chồng");

    // Family line legend
    legend.append("line")
      .attr("x1", 10)
      .attr("y1", 100)
      .attr("x2", 30)
      .attr("y2", 100)
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2);

    legend.append("text")
      .attr("x", 35)
      .attr("y", 104)
      .attr("font-size", "11px")
      .attr("fill", "#1e293b")
      .text("Quan hệ cha con");

    // Instructions
    legend.append("text")
      .attr("x", 10)
      .attr("y", 125)
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .text("Kéo để di chuyển");

  }, [data]);



  return (
    <div ref={containerRef} className="w-full h-screen bg-gray-50 rounded-lg shadow-lg overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md">
        <p className="text-sm text-gray-600">💡 Sử dụng chuột để kéo và cuộn để zoom</p>
      </div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default FamilyTreeD3;