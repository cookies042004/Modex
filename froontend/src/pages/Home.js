import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import SlotCard from "../components/SlotCard";

export default function Home(){
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const slotsRef = useRef([]);

  useEffect(()=>{
    let mounted = true;
    async function load(){
      setLoading(true);
      try{
        const res = await api.get('/slots');
        if(mounted) {
          setSlots(res.data || []);
          slotsRef.current = res.data || [];
        }
      }catch(err){
        console.error(err);
        alert('Failed to fetch slots');
      }finally{
        if(mounted) setLoading(false);
      }
    }
    load();

    const es = new EventSource((process.env.REACT_APP_API_BASE || 'http://localhost:4000/api') + '/stream');
    es.onmessage = e => {
      try {
        const payload = JSON.parse(e.data);
        if (payload && payload.type === 'slot_update' && payload.slot) {
          const updated = slotsRef.current.map(s => s.id === payload.slot.id ? payload.slot : s);
          const exists = slotsRef.current.some(s => s.id === payload.slot.id);
          const newSlots = exists ? updated : [...slotsRef.current, payload.slot];
          slotsRef.current = newSlots;
          setSlots(newSlots);
        }
      } catch (err) {
      }
    };
    es.onerror = err => {
      console.warn('SSE error', err);
    };

    return ()=> {
      mounted = false;
      es.close();
    };
  },[]);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <h2 style={{ margin:0 }}>Available Appointments</h2>
        <div style={{ color:'#6b7280' }}>{loading ? 'Loading...' : `${slots.length} slots`}</div>
      </div>

      {loading ? (
        <div className="card">Loading slots…</div>
      ) : slots.length === 0 ? (
        <div className="card">No slots available. Create some in the Admin view.</div>
      ) : (
        <div className="grid">
          {slots.map(s => <SlotCard key={s.id} slot={s} />)}
        </div>
      )}
    </div>
  );
}
