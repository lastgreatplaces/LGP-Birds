'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function BestPlacesForSpecies() {
  const [speciesList, setSpeciesList] = useState<any[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(2)

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [limit] = useState(50)

  const COLORS = { primary: '#2e4a31', bg: '#f4f4f4', border: '#ccc', text: '#333' }

  const getLikelihoodColor = (val: number) => {
    if (val >= 0.80) return '#1b5e20'
    if (val >= 0.60) return '#4caf50'
    if (val >= 0.33) return '#fbc02d'
    return '#d32f2f'
  }

  useEffect(() => {
    async function loadInitialData() {
      // Fetch active species for the dropdown
      const { data: specData } = await supabase
        .from('dropdown_species')
        .select('species_name')
        .eq('is_active', true)
        .order('species_name')
      
      const { data: wData } = await supabase
        .from('weeks_months')
        .select('week, label_long')
        .order('week')

      if (specData) setSpeciesList(specData)
      if (wData) setWeeks(wData)
    }
    loadInitialData()
  }, [])

  const runPowerQuery = async () => {
    if (!selectedSpecies) { 
        alert('Please select a species.'); 
        return; 
    }
    
    if (toWeek < fromWeek) {
      alert('Search Error: The "To" week cannot precede the "From" week.');
      return;
    }

    setLoading(true); 
    setHasSearched(false);

    const weekArray = Array.from({ length: toWeek - fromWeek + 1 }, (_, i) => fromWeek + i)

    // Using the specific RPC for finding places for a species
    const { data, error } = await supabase.rpc('rpc_best_places_for_species', {
      p_species_name: selectedSpecies, 
      p_weeks: weekArray, 
      p_limit: limit
    })

    setLoading(false); 
    setHasSearched(true)
    
    if (error) {
        console.error(error);
    } else {
        setResults(data || [])
    }
  }

  return (
    <div style={{ padding: '12px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: COLORS.text }}>
      <Link href="/explore" style={{ display: 'inline-block', backgroundColor: '#2e4a31', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none', marginBottom: '10px' }}>
        EXPLORE
      </Link>

      <h1 style={{ color: COLORS.primary, fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>
        Best Places for Species
      </h1>

      {/* 1. Select Species */}
      <div style={{ marginBottom: '12px', backgroundColor: COLORS.bg, padding: '12px', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>1. Select a Species</span>
        
        <select value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)} 
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
          <option value="">-- Choose a Species --</option>
          {speciesList.map(s => (
            <option key={s.species_name} value={s.species_name}>{s.species_name}</option>
          ))}
        </select>
      </div>

      {/* 2. Choose Weeks */}
      <div style={{ marginBottom: '16px', backgroundColor: COLORS.bg, padding: '12px', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>2. Choose Weeks</span>
        
        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '4px' }}>From</label>
        <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} 
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, marginBottom: '10px' }}>
          {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
        </select>

        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '4px' }}>To</label>
        <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} 
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
          {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
        </select>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '15px', backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>
        {loading ? 'LOCATING...' : 'FIND BEST PLACES'}
      </button>

      {/* Results Table */}
      {hasSearched && (
        <div style={{ marginTop: '24px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', fontSize: '0.9rem' }}>
              No top locations found for this species in the selected time frame.
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.primary, color: 'white' }}>
                    <th style={{ padding: '10px 4px', width: '30px' }}>Rank</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Location</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Likelihood</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: '#888' }}>{idx + 1}</td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 'bold' }}>{r.site_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{r.state}</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px' }}>
                          <span style={{ 
                            backgroundColor: getLikelihoodColor(r.avg_likelihood_see), 
                            color: 'white', 
                            padding: '5px 8px', 
                            borderRadius: '6px', 
                            fontWeight: 'bold', 
                            fontSize: '0.8rem',
                            display: 'inline-block',
                            minWidth: '45px'
                          }}>
                            {Math.round(r.avg_likelihood_see * 100)}%
                          </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '16px', fontSize: '0.7rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                Minimum 20% likelihood for reporting.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}