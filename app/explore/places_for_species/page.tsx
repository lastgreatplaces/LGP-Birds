'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesSearch() {
  const [allSpecies, setAllSpecies] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [fromWeek, setFromWeek] = useState(17) // Defaulting to May per your screenshot
  const [toWeek, setToWeek] = useState(1)    // Defaulting to Jan per your screenshot
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      const { data: spData } = await supabase.from('species_groups').select('species_name').order('species_name')
      if (wData) setWeeks(wData)
      if (spData) setAllSpecies(spData.map(x => x.species_name))
    }
    loadData()
  }, [])

  const runPowerQuery = async () => {
    setSearchError(null);
    const startW = Number(fromWeek);
    const endW = Number(toWeek);

    // STEP 1: CHECK DATES FIRST (The "Cigar" Check)
    if (endW < startW) {
      setSearchError(`⚠️ DATE ERROR: Your "From" week is later than your "To" week. The database cannot search backwards!`);
      setResults([]);
      return; // STOP HERE
    }

    // STEP 2: CHECK BIRD SECOND
    if (!selectedSpecies) { 
      setSearchError('⚠️ Please select a bird species.'); 
      return; // STOP HERE
    }

    // STEP 3: RUN QUERY ONLY IF STEPS 1 & 2 PASS
    setLoading(true); 
    const { data } = await supabase.rpc('rpc_best_places_for_species', {
      p_species: selectedSpecies,
      p_week_from: startW,
      p_week_to: endW,
      p_limit: 50
    })
    setLoading(false); 
    setResults(data || [])
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#2e4a31' }}>Best Places for Species (V13)</h2>
      
      <div style={{ marginBottom: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>1. Bird Species</label>
        <select value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
          <option value="">-- Choose Bird --</option>
          {allSpecies.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '15px', background: '#eef4ef', padding: '15px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>2. Date Range</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>From: {w.label_long}</option>)}
            </select>
            <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>To: {w.label_long}</option>)}
            </select>
        </div>
      </div>

      {searchError && (
        <div style={{ color: 'white', background: '#d32f2f', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
          {searchError}
        </div>
      )}

      <button onClick={runPowerQuery} disabled={loading} style={{ width: '100%', padding: '15px', background: '#2e4a31', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
        {loading ? 'ANALYZING...' : 'FIND BEST PLACES'}
      </button>

      <div style={{ marginTop: '20px' }}>
        {results.map((r, i) => (
            <div key={i} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                {r.site_name} - {Math.round(r.avg_likelihood_see * 100)}%
            </div>
        ))}
      </div>
    </div>
  )
}