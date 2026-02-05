'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function GroupsSearch() {
  const [groups, setGroups] = useState<any[]>([])
  const [states, setStates] = useState<any[]>([]) 
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [groupSet, setGroupSet] = useState('major') 
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['All']) 
  const [selectedStates, setSelectedStates] = useState<string[]>([]) 
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(52)

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

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
      setSelectedGroups(['All'])
      const { data } = await supabase.from(`v_dropdown_${groupSet}_group`).select('*')
      if (data) setGroups(data)
    }
    fetchGroups()
  }, [groupSet])

  const toggleGroup = (val: string) => {
    if (val === 'All') {
      setSelectedGroups(['All'])
      return
    }
    let newSelection = selectedGroups.filter(g => g !== 'All')
    if (newSelection.includes(val)) {
      newSelection = newSelection.filter(g => g !== val)
    } else {
      newSelection.push(val)
    }
    if (newSelection.length === 0) newSelection = ['All']
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

    const apiGroups = selectedGroups.includes('All') ? null : selectedGroups
    
    const apiStates = selectedStates.length > 0 
      ? selectedStates.map(s => s.split(' - ')[0]) 
      : null

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
      console.error(error)
      alert("Query error: " + error.message)
    } else {
      setResults(data || [])
    }
  }

  // Helper to determine "All" button label and visibility
  const getAllButtonLabel = () => {
    if (groupSet === 'major') return "All Groups";
    if (groupSet === 'user') return "All Wetland Groups";
    return null; 
  };

  return (
    <div style={{ padding: '15px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31', marginBottom: '20px', fontSize: '1.5rem' }}>Best Places for Bird Groups</h1>

      {/* 1. Group Type - BOLDED LABEL */}
      <div style={{ marginBottom: '15px', background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>1. Select Group Type:</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px' }}>
          <label style={{ cursor: 'pointer' }}><input type="radio" checked={groupSet === 'major'} onChange={() => setGroupSet('major')} /> Major Groups</label>
          <label style={{ cursor: 'pointer' }}><input type="radio" checked={groupSet === 'user'} onChange={() => setGroupSet('user')} /> Coastal/Wetland</label>
          <label style={{ cursor: 'pointer' }}><input type="radio" checked={groupSet === 'species'} onChange={() => setGroupSet('species')} /> Species Groups</label>
        </div>
      </div>

      {/* 2. Group Selection - BOLDED LABEL */}
      <div style={{ marginBottom: '15px', background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>2. Select groups:</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          
          {/* Individual Group Buttons */}
          {groups.map((g, i) => {
            const val = Object.values(g)[0] as string
            const isActive = selectedGroups.includes(val)
            return (
              <button key={i} onClick={() => toggleGroup(val)}
                style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid #ccc', fontSize: '0.85rem', cursor: 'pointer',
                         backgroundColor: isActive ? '#4a7c59' : 'white', color: isActive ? 'white' : '#333' }}>
                {val}
              </button>
            )
          })}

          {/* "All" button placed LAST and dropped for 'species' */}
          {getAllButtonLabel() && (
            <button onClick={() => toggleGroup('All')}
              style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid #2e4a31', fontSize: '0.85rem', cursor: 'pointer',
                       backgroundColor: selectedGroups.includes('All') ? '#2e4a31' : 'white',
                       color: selectedGroups.includes('All') ? 'white' : '#2e4a31' }}>
              {getAllButtonLabel()}
            </button>
          )}
        </div>
      </div>

      {/* 3. States & Weeks */}
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          3. Select States
          <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#065f46', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', border: '1px solid #10b981' }}>
            26 Active
          </span>
        </label>
        
        <div style={{ 
          height: '85px', 
          overflowY: 'auto', 
          background: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '6px', 
          padding: '10px', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px' 
        }}>
          {states.map(s => (
            <label key={s.state} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedStates.includes(s.state)} onChange={() => toggleState(s.state)} style={{ marginRight: '8px', width: '18px', height: '18px' }} />
              {s.state}
            </label>
          ))}
        </div>

        {/* THICKER DROPDOWNS WITH BUMPED LABEL FONT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>From Week</label>
            <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} 
              style={{ width: '100%', padding: '12px', marginTop: '4px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>To Week</label>
            <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} 
              style={{ width: '100%', padding: '12px', marginTop: '4px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '16px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'CALCULATING...' : 'SEARCH SIGHTINGS'}
      </button>

      {/* Results Section */}
      {hasSearched && results.length === 0 && !loading && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff4f4', border: '1px solid #facaca', borderRadius: '8px', color: '#d32f2f', textAlign: 'center' }}>
          No locations matched. Try a different group or state.
        </div>
      )}

      {results.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '25px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Rank</th>
                <th>Place</th>
                <th style={{ textAlign: 'center' }}>State</th>
                <th style={{ textAlign: 'center' }}>Exp. Species</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{r.rank}</td>
                  <td style={{ fontWeight: '600', padding: '8px 4px' }}>{r.place}</td>
                  <td style={{ textAlign: 'center' }}>{r.state}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#2e4a31' }}>{Number(r.expected_species).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}