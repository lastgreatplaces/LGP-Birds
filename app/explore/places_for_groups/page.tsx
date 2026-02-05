'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'

export default function GroupsSearch() {
  const [groups, setGroups] = useState<any[]>([])
  const [states, setStates] = useState<any[]>([]) 
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [groupSet, setGroupSet] = useState('major') 
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]) 
  const [selectedStates, setSelectedStates] = useState<string[]>([]) 
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(52)

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'avg' | 'integrity' | 'combo'>('avg')

  const parseRawScore = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  // Transform Footprint (0.0 - 1.0) to Integrity (100 - 0)
  const calculateIntegrity = (footprint: number | null): number | null => {
    if (footprint === null) return null;
    const score = 100 - (footprint * 100);
    return Math.max(0, Math.min(100, score));
  }

  const getIntegrityColor = (integrityScore: number | null) => {
    if (integrityScore === null) return '#9e9e9e'; 
    if (integrityScore >= 90) return '#1b5e20'; 
    if (integrityScore >= 80) return '#4caf50'; 
    if (integrityScore >= 66.6) return '#fbc02d'; 
    return '#d32f2f'; 
  }

  const sortedResults = useMemo(() => {
    if (!results.length) return [];

    return [...results].sort((a, b) => {
      const aAvg = parseRawScore(a.expected_species) || 0;
      const bAvg = parseRawScore(b.expected_species) || 0;
      const aFoot = parseRawScore(a.footprint_mean);
      const bFoot = parseRawScore(b.footprint_mean);

      if (sortBy === 'avg') {
        return bAvg - aAvg; 
      } 
      
      if (sortBy === 'integrity') {
        if (aFoot === null) return 1;
        if (bFoot === null) return -1;
        return aFoot - bFoot; 
      }

      if (sortBy === 'combo') {
        const aCombo = aAvg / ((aFoot || 0.5) + 0.1);
        const bCombo = bAvg / ((bFoot || 0.5) + 0.1);
        return bCombo - aCombo;
      }

      return 0;
    });
  }, [results, sortBy]);

  useEffect(() => {
    async function loadInitialData() {
      const { data: sData } = await supabase
        .from('dropdown_states')
        .select('state')
        .eq('is_active', true)
        .order('state')
      
      const { data: wData } = await supabase
        .from('weeks_months')
        .select('week, label_long')
        .order('week')

      if (sData) setStates(sData)
      if (wData) setWeeks(wData)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function fetchGroups() {
      setSelectedGroups([]) // Clear selection when switching group types
      const { data } = await supabase.from(`v_dropdown_${groupSet}_group`).select('*')
      if (data) setGroups(data)
    }
    fetchGroups()
  }, [groupSet])

  const toggleGroup = (val: string) => {
    let newSelection = [...selectedGroups]
    if (newSelection.includes(val)) {
      newSelection = newSelection.filter(g => g !== val)
    } else {
      newSelection.push(val)
    }
    setSelectedGroups(newSelection)
  }

  const toggleState = (val: string) => {
    if (selectedStates.includes(val)) {
      setSelectedStates(selectedStates.filter(s => s !== val))
    } else {
      setSelectedStates([...selectedStates, val])
    }
  }

  const runPowerQuery = async () => {
    if (toWeek < fromWeek) {
      alert('The "To" week cannot be earlier than the "From" week.')
      return
    }
    setLoading(true)
    setHasSearched(false)

    // If selectedGroups is empty, RPC treats as "All"
    const apiGroups = selectedGroups.length > 0 ? selectedGroups : null
    const apiStates = selectedStates.length > 0 ? selectedStates : null

    const { data, error } = await supabase.rpc('rpc_explore_groups', {
      p_group_system: groupSet,
      p_group_values: apiGroups,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: apiStates,
      p_limit: 50
    })
    setLoading(false)
    setHasSearched(true)
    if (error) {
      console.error("RPC Error:", error)
    } else {
      setResults(data || [])
    }
  }

  return (
    <div style={{ padding: '12px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31', marginBottom: '15px', fontSize: '1.3rem', textAlign: 'center' }}>Best Places for Bird Groups</h1>

      {/* 1. Group Type Selection */}
      <div style={{ marginBottom: '12px', background: '#f4f4f4', padding: '12px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>1. Select Group Type:</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
          <label style={{ cursor: 'pointer', fontSize: '0.85rem' }}><input type="radio" checked={groupSet === 'major'} onChange={() => setGroupSet('major')} /> Major</label>
          <label style={{ cursor: 'pointer', fontSize: '0.85rem' }}><input type="radio" checked={groupSet === 'user'} onChange={() => setGroupSet('user')} /> Wetland</label>
          <label style={{ cursor: 'pointer', fontSize: '0.85rem' }}><input type="radio" checked={groupSet === 'species'} onChange={() => setGroupSet('species')} /> Species</label>
        </div>
      </div>

      {/* 2. Group Selection */}
      <div style={{ marginBottom: '12px', background: '#f4f4f4', padding: '12px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>2. Select groups (None = All):</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {groups.map((g, i) => {
            const val = Object.values(g)[0] as string
            const isActive = selectedGroups.includes(val)
            return (
              <button key={i} onClick={() => toggleGroup(val)}
                style={{ padding: '6px 12px', borderRadius: '15px', border: '1px solid #ccc', fontSize: '0.75rem', cursor: 'pointer',
                         backgroundColor: isActive ? '#4a7c59' : 'white', color: isActive ? 'white' : '#333' }}>
                {val}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. States & Weeks */}
      <div style={{ background: '#f4f4f4', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', fontSize: '0.9rem' }}>3. States & Date Range</label>
        
        <div style={{ height: '100px', overflowY: 'auto', background: 'white', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', color: '#2e4a31' }}>
            <input type="checkbox" checked={selectedStates.length === 0} onChange={() => setSelectedStates([])} style={{ marginRight: '6px' }} />
            All Active States
          </label>
          {states.map(s => (
            <label key={s.state} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedStates.includes(s.state)} onChange={() => toggleState(s.state)} style={{ marginRight: '6px' }} />
              {s.state}
            </label>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>From</label>
            <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} 
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>To</label>
            <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} 
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '14px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>
        {loading ? 'CALCULATING...' : 'SEARCH SIGHTINGS'}
      </button>

      {/* Sorting Controls */}
      {results.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#555' }}>Sort:</span>
          <div style={{ display: 'flex', background: '#eee', padding: '2px', borderRadius: '6px', flex: 1 }}>
            <button onClick={() => setSortBy('avg')} style={{ flex: 1, padding: '6px 0', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: sortBy === 'avg' ? 'white' : 'transparent' }}>Avg #</button>
            <button onClick={() => setSortBy('integrity')} style={{ flex: 1, padding: '6px 0', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: sortBy === 'integrity' ? 'white' : 'transparent' }}>Integrity</button>
            <button onClick={() => setSortBy('combo')} style={{ flex: 1, padding: '6px 0', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: sortBy === 'combo' ? 'white' : 'transparent' }}>Optimal</button>
          </div>
        </div>
      )}

      {/* Table Results */}
      {results.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '10px 4px', width: '35px' }}>Rank</th>
                <th style={{ padding: '10px 4px' }}>Site Name</th>
                <th style={{ padding: '10px 4px', textAlign: 'center', width: '25px' }}>ST</th>
                <th style={{ padding: '10px 4px', textAlign: 'center', width: '40px' }}>Avg #</th>
                <th style={{ padding: '10px 4px', textAlign: 'center', width: '50px' }}>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r, idx) => {
                const rawFootprint = parseRawScore(r.footprint_mean);
                const integrityScore = calculateIntegrity(rawFootprint);

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 4px', textAlign: 'center', color: '#666' }}>{idx + 1}</td>
                    <td style={{ fontWeight: '600', padding: '10px 4px', color: '#333' }}>{r.place}</td>
                    <td style={{ textAlign: 'center', color: '#666' }}>{r.state}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#2e4a31' }}>{Number(r.expected_species).toFixed(1)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ 
                        backgroundColor: getIntegrityColor(integrityScore), 
                        color: 'white', 
                        padding: '3px 5px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold', 
                        fontSize: '0.7rem',
                        display: 'inline-block',
                        minWidth: '30px'
                      }}>
                        {integrityScore !== null ? Math.round(integrityScore) : '---'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}