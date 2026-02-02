'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesSearch() {
  const [allSpecies, setAllSpecies] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(52)

  useEffect(() => {
    async function loadInitialData() {
      // Load active states
      const { data: sData } = await supabase.from('dropdown_states').select('state').eq('is_active', true).order('state')
      // Load weeks
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      
      // Load species from your specific dropdown view
      const { data: spData } = await supabase.from('v_dropdown_species_group').select('value').order('value')
      
      if (sData) setStates(sData.map(s => s.state))
      if (wData) setWeeks(wData)
      if (spData) setAllSpecies(spData.map(s => s.value))
    }
    loadInitialData()
  }, [])

  const runPowerQuery = async () => {
    if (!selectedSpecies) {
      alert("Please select a species first!")
      return
    }

    const { data, error } = await supabase.rpc('rpc_best_places_for_species', {
      p_species: selectedSpecies,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: selectedState ? [selectedState] : null,
      p_limit: 50
    })
    
    if (error) {
      console.error(error)
      alert("Query error: " + error.message)
    } else {
      setResults(data || [])
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31' }}>Find the Best Places for a Species</h1>

      <div style={{ marginBottom: '25px' }}>
        <label><strong>1. Select Bird Species:</strong></label>
        <select 
          value={selectedSpecies} 
          onChange={(e) => setSelectedSpecies(e.target.value)} 
          style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '1rem' }}
        >
          <option value="">-- Select a bird --</option>
          {allSpecies.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label><strong>2. Filter by State</strong></label>
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
            <option value="">-- All Active States --</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label>From Week</label>
          <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
        <div>
          <label>To Week</label>
          <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
      </div>

      <button onClick={runPowerQuery}
        style={{ width: '100%', padding: '15px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
        FIND BEST LOCATIONS
      </button>

      {results.length > 0 && (
        <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
              <th style={{ padding: '10px' }}>Rank</th>
              <th>Site Name</th>
              <th>State</th>
              <th>Avg Likelihood</th>
              <th>Weekly Checklists</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px', textAlign: 'center' }}>{r.rank}</td>
                <td style={{ padding: '10px' }}>{r.site_name}</td>
                <td style={{ textAlign: 'center' }}>{r.state}</td>
                {/* No decimal rounding here */}
                <td style={{ textAlign: 'center' }}>{Math.round(r.avg_likelihood_see * 100)}%</td>
                <td style={{ textAlign: 'center' }}>{Math.round(r.avg_weekly_checklists)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}