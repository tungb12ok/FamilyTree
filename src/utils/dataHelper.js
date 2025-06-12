// src/utils/dataHelper.js

// Function to prepare tree data
const prepareTreeData = (members) => {
  const nodes = [];
  const edges = [];

  // Processing logic for nodes and edges
  members.forEach((member) => {
    nodes.push({
      id: `${member.id}`,
      type: 'default',
      data: { label: member.FullName, ...member },
      position: { x: Math.random() * 500, y: Math.random() * 500 },  // Random position for visualization
    });
  });

  members.forEach((member) => {
    if (member.FatherID) {
      edges.push({ id: `${member.FatherID}-${member.id}`, source: `${member.FatherID}`, target: `${member.id}`, animated: true });
    }
    if (member.MotherID) {
      edges.push({ id: `${member.MotherID}-${member.id}`, source: `${member.MotherID}`, target: `${member.id}`, animated: true });
    }
  });

  return { nodes, edges };
};

// Default export of the function
export default prepareTreeData;
