import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../services/api";
export default function Dashboard({user}) {
  const [profile,setProfile]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{getProfile().then(r=>setProfile(r.data)).catch(()=>setProfile(null)).finally(()=>setLoading(false));},[]);
  return <section><div className="dashboard-head"><div><p className="eyebrow">DASHBOARD</p><h1>Welcome, {user?.name || "User"} 👋</h1><p className="lead">Your Milestone 1 skin profile workspace.</p></div><Link className="primary" to="/profile">{profile?"Edit Profile":"Create Skin Profile"}</Link></div>
  {loading?<div className="card">Loading profile...</div>:profile?<div className="grid">{[
    ["Skin Type",profile.skin_type],["Age Group",profile.age_group],["Concerns",profile.skin_concerns.join(", ")||"None added"],["Sleep Quality",profile.sleep_quality],["Water Intake",`${profile.water_intake} L/day`],["Sun Exposure",profile.sun_exposure||"Not provided"],["Pollution Exposure",profile.pollution_exposure||"Not provided"],["Lifestyle",profile.lifestyle_habits||"Not provided"]
  ].map(([k,v])=><div className="card stat" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>:<div className="card empty"><h3>No skin profile yet</h3><p>Create your profile to store your skin and lifestyle information.</p></div>}</section>;
}
