  import React, { useEffect, useState } from "react";
  import FamilyTreeD3 from "./components/FamilyTreeD3";

  function App() {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const loadTreeData = async () => {
        try {
          const response = await fetch("/data/treefamily.json");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setTreeData(data);
        } catch (err) {
          console.error("Error loading tree data:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      loadTreeData();
    }, []);

    if (loading) {
      return (
        <div className="App bg-slate-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
            <div className="text-lg text-blue-900">Loading tree data...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="App bg-slate-50 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">Error loading family tree data</div>
            <div className="text-gray-600">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="App bg-slate-50 min-h-screen">
        <h1 className="font-bold text-3xl text-center py-8 text-blue-900">
          Gia phả - Family Tree Diagram
        </h1>
        {treeData && <FamilyTreeD3 data={treeData} />}
      </div>
    );
  }

  export default App;