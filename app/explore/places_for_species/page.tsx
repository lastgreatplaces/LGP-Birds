"use client";

import React, { useState } from "react";

export default function SpeciesSearch() {
  const [birdSpecies, setBirdSpecies] = useState("American Crow");
  const [selectedStates, setSelectedStates] = useState(["All States"]);
  const [fromWeek, setFromWeek] = useState(20);
  const [toWeek, setToWeek] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data for display based on your successful version
  const [results, setResults] = useState([
    { id: 1, name: "Beech Fork State Park", st: "WV", avg: 95, integrity: 80 }
  ]);

  const handleSearch = () => {
    // FIX: Only trigger error if 'To' is less than 'From' 
    // and 'To' isn't the start of the year (Week 1)
    if (fromWeek > toWeek && toWeek !== 1) {
      setError("DATE ERROR: Your 'From' week is later than your 'To' week. The database cannot search backwards!");
      return;
    }
    
    setError(null);
    // Search logic execution...
  };

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans text-gray-800">
      <h1 className="text-2xl font-bold text-green-800 mb-6">Best Places for Species</h1>

      {/* 1. Bird Species */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
        <label className="block font-bold mb-2">1. Bird Species</label>
        <select 
          className="w-full p-2 border rounded bg-white"
          value={birdSpecies}
          onChange={(e) => setBirdSpecies(e.target.value)}
        >
          <option>American Crow</option>
          <option>American Coot</option>
          <option>American Black Duck</option>
        </select>
      </div>

      {/* 2. States & Date Range */}
      <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 mb-4">
        <label className="block font-bold mb-2 text-green-900">2. States & Date Range</label>
        
        {/* States Multi-select Box */}
        <div className="bg-white border rounded mb-4 h-32 overflow-y-scroll p-2">
          {["All States", "AL", "AR", "AZ", "CA", "FL", "GA"].map((st) => (
            <label key={st} className="flex items-center gap-2 py-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedStates.includes(st)}
                onChange={() => {}} 
                className="rounded text-blue-600"
              />
              <span className="text-sm">{st}</span>
            </label>
          ))}
        </div>

        {/* Date Selects */}
        <select 
          className="w-full p-2 border rounded bg-white mb-3"
          value={fromWeek}
          onChange={(e) => setFromWeek(Number(e.target.value))}
        >
          <option value={20}>From: May – Late (Week 20)</option>
          <option value={15}>From: April – Mid to Late (Week 15)</option>
        </select>

        <select 
          className="w-full p-2 border rounded bg-white"
          value={toWeek}
          onChange={(e) => setToWeek(Number(e.target.value))}
        >
          <option value={1}>To: January – Early (Week 1)</option>
          <option value={7}>To: February – Mid to Late (Week 7)</option>
        </select>
      </div>

      {/* Error Message Section */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-4 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="font-bold text-sm uppercase leading-tight">{error}</p>
        </div>
      )}

      <button 
        onClick={handleSearch}
        className="w-full bg-[#2d4a31] text-white font-bold py-3 rounded-lg mb-6 uppercase tracking-widest hover:bg-[#1e3321]"
      >
        Find Best Places
      </button>

      {/* Results Header/Sort */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-sm font-bold text-gray-600">Sort:</span>
        <div className="flex-1 flex bg-gray-200 rounded-lg p-1">
          <button className="flex-1 bg-white text-blue-600 py-1 rounded shadow text-sm font-bold">Probability</button>
          <button className="flex-1 text-gray-500 py-1 text-sm font-bold">Integrity</button>
          <button className="flex-1 text-gray-500 py-1 text-sm font-bold">Optimal</button>
        </div>
      </div>

      {/* Results Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#2d4a31] text-white text-xs uppercase">
            <th className="p-3 text-left w-8">#</th>
            <th className="p-3 text-left">Click on a Place to see Best Weeks or Calendar</th>
            <th className="p-3 text-center w-12">ST</th>
            <th className="p-3 text-center w-20">Avg %</th>
            <th className="p-3 text-center w-20">Integrity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {results.map((r) => (
            <tr key={r.id} className="text-sm">
              <td className="p-3 text-gray-400">{r.id}</td>
              <td className="p-3 font-bold text-gray-700">{r.name}</td>
              <td className="p-3 text-center text-gray-500">{r.st}</td>
              <td className="p-3 text-center">
                <span className="bg-green-700 text-white px-3 py-1 rounded text-xs font-bold">{r.avg}%</span>
              </td>
              <td className="p-3 text-center">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">{r.integrity}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}