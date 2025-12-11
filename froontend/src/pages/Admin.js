import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function Admin(){
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [slotDoctor, setSlotDoctor] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [analytics, setAnalytics] = useState(null);

  useEffect(()=>{ if (token) fetchDoctors(); },[token]);

  async function login(e){
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUsername(''); setPassword('');
      alert('Logged in');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  async function fetchDoctors(){
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data || []);
    } catch (err) { console.error(err); alert('Failed to fetch doctors'); }
  }

  async function createDoctor(e){
    e.preventDefault();
    if(!name) return alert('Name required');
    try { await api.post('/doctors', { name, speciality: spec }); setName(''); setSpec(''); fetchDoctors(); }
    catch (err) { console.error(err); alert('Failed to create doctor'); }
  }

  async function createSlot(e){
    e.preventDefault();
    if(!slotDoctor || !start || !end) return alert('All fields required');
    try { await api.post('/slots', { doctor_id: Number(slotDoctor), start_time: start, end_time: end, capacity: Number(capacity) }); setStart(''); setEnd(''); alert('Slot created'); }
    catch(err){ console.error(err); alert(err?.response?.data?.error || 'Failed to create slot'); }
  }

  async function fetchAnalytics(){
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) { console.error(err); alert('Failed to fetch analytics'); }
  }

  function logout(){
    localStorage.removeItem('token');
    setToken('');
  }

  return (
    <div style={{ marginTop:8 }}>
      {!token ? (
        <div className="card">
          <h3>Admin Login</h3>
          <form className="form" onSubmit={login}>
            <input className="input" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="input" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} type="password" />
            <button className="btn primary" type="submit">Login</button>
          </form>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
            <button className="btn" onClick={logout}>Logout</button>
            <button className="btn" onClick={fetchAnalytics}>Load Analytics</button>
          </div>

          <div className="card">
            <h3>Create Doctor</h3>
            <form className="form" onSubmit={createDoctor}>
              <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
              <input className="input" placeholder="Speciality" value={spec} onChange={e=>setSpec(e.target.value)} />
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn primary" type="submit">Create Doctor</button>
                <button className="btn" type="button" onClick={fetchDoctors}>Refresh</button>
              </div>
            </form>
          </div>

          <div className="card" style={{ marginTop:12 }}>
            <h3>Create Slot</h3>
            <form className="form" onSubmit={createSlot}>
              <select className="select" value={slotDoctor} onChange={e=>setSlotDoctor(e.target.value)}>
                <option value="">Select doctor</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.speciality || '—'})</option>)}
              </select>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input className="input" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} />
                <input className="input" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />
                <input className="input" type="number" min="1" value={capacity} onChange={e=>setCapacity(e.target.value)} style={{ width:120 }} />
              </div>
              <div>
                <button className="btn primary" type="submit">Create Slot</button>
              </div>
            </form>
          </div>

          {analytics && (
            <div className="card" style={{ marginTop:12 }}>
              <h3>Analytics (last 14 days)</h3>
              <div>
                <h4>Doctor stats</h4>
                <ul>
                  {analytics.doctorStats.map(d => (
                    <li key={d.id}>{d.name} — {d.confirmed_count || 0} confirmed, {d.failed_count || 0} failed</li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop:12 }}>
                <h4>Daily bookings</h4>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:120 }}>
                  {analytics.dailyStats.map(d => (
                    <div key={d.day} style={{ textAlign:'center' }}>
                      <div style={{ height: Math.min(110, (d.confirmed || 0) * 10) + 'px', width:28, background:'#0f62fe', borderRadius:6 }} />
                      <div style={{ fontSize:11 }}>{new Date(d.day).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
