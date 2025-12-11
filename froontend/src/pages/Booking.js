import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Booking(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  async function fetchSlot() {
    try {
      const res = await api.get('/slots');
      const found = (res.data || []).find(s => String(s.id) === String(id));
      setSlot(found || null);
    } catch (err) {
      console.error('fetchSlot error', err);
      alert('Failed to load slot. Check backend.');
    }
  }

  useEffect(()=>{
    fetchSlot();
    const iv = setInterval(fetchSlot, 15000);
    return () => clearInterval(iv);
  },[id]);

  async function handleCreatePending() {
    if(!name) return alert('Enter name');
    if(!slot || slot.available <= 0) return alert('Slot is full');
    setLoading(true);
    try {
      const res = await api.post('/bookings', { slot_id: Number(id), user_name: name, user_contact: contact });
      setBooking(res.data); // PENDING booking returned
    } catch (err) {
      console.error('create pending error', err);
      alert(err?.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
      fetchSlot();
    }
  }

  async function handleConfirm() {
    if (!booking) return;
    setLoading(true);
    try {
      const res = await api.post(`/bookings/${booking.id}/confirm`);
      setBooking(res.data);
      alert('Booking confirmed');
      fetchSlot();
    } catch (err) {
      console.error('confirm error', err);
      alert(err?.response?.data?.error || 'Failed to confirm booking');
      fetchSlot();
    } finally {
      setLoading(false);
    }
  }

  if(!slot) return <div className="card">Loading slot…</div>;

  return (
    <div style={{ marginTop:8 }}>
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ margin:0 }}>{slot.doctor_name}</h3>
            <p style={{ margin:0, color:'#6b7280' }}>{slot.speciality || 'General'}</p>
            <div style={{ marginTop:8, color:'#0f1724', fontWeight:600 }}>{new Date(slot.start_time).toLocaleString()}</div>
          </div>
          <div>
            <button className="btn" onClick={()=> navigate('/')}>Back</button>
          </div>
        </div>

        <div style={{ marginTop:12, color:'#6b7280' }}>
          <strong>Availability:</strong> {slot.available > 0 ? `${slot.available} available` : 'Full'}
          <span style={{ marginLeft:10, fontSize:12, color:'#9ca3af' }}>
            ({slot.confirmed_count || 0} confirmed{slot.pending_count ? ` • ${slot.pending_count} pending` : ''})
          </span>
        </div>

        <div className="form-row" style={{ marginTop:16 }}>
          <input className="input" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Contact (phone/email)" value={contact} onChange={e=>setContact(e.target.value)} />

          {!booking ? (
            <button className="btn primary" onClick={handleCreatePending} disabled={loading || (slot.available <= 0)}>
              {loading ? 'Processing…' : 'Reserve (hold 2 min)'}
            </button>
          ) : booking.status === 'PENDING' ? (
            <button className="btn primary" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Confirming…' : 'Confirm Booking'}
            </button>
          ) : (
            <div style={{ padding: 8, color: '#047857' }}>Booking {booking.status}</div>
          )}
        </div>

        {booking && (
          <div className="result" style={{ marginTop: 12 }}>
            <div><strong>Status:</strong> {booking.status}</div>
            <div><b>Booking ID:</b> {booking.id}</div>
          </div>
        )}
      </div>
    </div>
  );
}
