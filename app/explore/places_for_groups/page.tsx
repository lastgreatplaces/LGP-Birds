'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function GroupsSearch() {
  const [groups, setGroups] = useState<any[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [groupSet, setGroupSet] = useState('major') 
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['All']) 
  const [selectedState, setSelectedState] = useState('') 
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(52)

  useEffect(() => {
    async function loadInitialData() {
      const { data: sData } = await supabase.from('dropdown_states').select('state').eq('is_active', true).order('state')
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      if (sData) setStates(sData.map(s => s.state))
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

  const runPowerQuery = async () => {
    // If 'All' is selected, we send null to the function to drop the WHERE clause
    const apiGroups = selectedGroups.includes('All') ? null : selectedGroups

    const { data, error } = await supabase.rpc('rpc_explore_groups', {
      p_group_system: groupSet,
      p_group_values: apiGroups,
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
      <h1 style={{ color: '#2e4a31' }}>Explore Bird Groups</h1>

      {/* 1. Category Selection */}
      <div style={{ marginBottom: '25px' }}>
        <label><strong>1. Select Group Type:</strong></label>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <label><input type="radio" checked={groupSet === 'major'} onChange={() => setGroupSet('major')} /> Major Bird Groups</label>
          <label><input type="radio" checked={groupSet === 'user'} onChange={() => setGroupSet('user')} /> Coastal/Wetland Groups</label>
          <label><input type="radio" checked={groupSet === 'species'} onChange={() => setGroupSet('species')} /> Species Groups</label>
        </div>
      </div>

      {/* 2. Group Multi-Select Chips */}
      <div style={{ marginBottom: '25px' }}>
        <label><strong>2. Select one or more groups:</strong></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
          {groups.map((g, i) => {
            const val = Object.values(g)[0] as string
            const isActive = selectedGroups.includes(val)
            return (
              <button key={i} onClick={() => toggleGroup(val)}
                style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ccc', cursor: 'pointer',
                         backgroundColor: isActive ? '#4a7c59' : '#f9f9f9', color: isActive ? 'white' : '#333' }}>
                {val}
              </button>
            )
          })}
          
          {/* "All" button at the end */}
          <button onClick={() => toggleGroup('All')}
            style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #2e4a31', cursor: 'pointer',
                     backgroundColor: selectedGroups.includes('All') ? '#2e4a31' : 'white',
                     color: selectedGroups.includes('All') ? 'white' : '#2e4a31' }}>
            All {groupSet} Groups
          </button>
        </div>
      </div>

      {/* 3. State & Week Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label><strong>3. Select State</strong></label>
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
        SEARCH SIGHTINGS
      </button>

      {/* 4. Results Table */}
      {results.length > 0 && (
        <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
              <th style={{ padding: '10px' }}>Rank</th>
              <th>Place</th>
              <th>State</th>
              <th>Expected Species</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px', textAlign: 'center' }}>{r.rank}</td>
                <td>{r.place}</td>
                <td style={{ textAlign: 'center' }}>{r.state}</td>
                <td style={{ textAlign: 'center' }}>
  {typeof r.expected_species === 'number' 
    ? r.expected_species.toFixed(1) 
    : r.expected_species}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}