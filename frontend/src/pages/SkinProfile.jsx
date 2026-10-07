import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProfile, getProfile, updateProfile } from "../services/api";

const concerns=["Acne","Hyperpigmentation","Dark Spots","Dry Skin","Oily Skin","Sensitive Skin","Wrinkles","Fine Lines","Redness","Uneven Skin Tone"];
const empty={skin_type:"",age_group:"",skin_concerns:[],allergies:"",sensitivities:"",lifestyle_habits:"",sleep_quality:"",water_intake:"",sun_exposure:"",pollution_exposure:""};

export default function SkinProfile(){
  const [form,setForm]=useState(empty),[exists,setExists]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false),[loading,setLoading]=useState(true);
  const nav=useNavigate();
  useEffect(()=>{getProfile().then(r=>{setForm({...r.data,water_intake:String(r.data.water_intake)});setExists(true)}).catch(()=>{}).finally(()=>setLoading(false))},[]);
  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const toggle=c=>setForm({...form,skin_concerns:form.skin_concerns.includes(c)?form.skin_concerns.filter(x=>x!==c):[...form.skin_concerns,c]});
  const submit=async e=>{e.preventDefault();setError("");setSaved(false);try{const fn=exists?updateProfile:createProfile;await fn({...form,water_intake:Number(form.water_intake)});setSaved(true);setExists(true);setTimeout(()=>nav("/dashboard"),700)}catch(err){setError(err.response?.data?.detail||"Could not save profile.")}};
  if(loading)return <div className="card">Loading...</div>;
  return <section className="card profile-card"><p className="eyebrow">SKIN PROFILE</p><h1>{exists?"Edit your profile":"Create your skin profile"}</h1>{error&&<div className="error">{error}</div>}{saved&&<div className="success">Profile saved successfully.</div>}
  <form onSubmit={submit}>
    <label>Skin Type<select name="skin_type" value={form.skin_type} onChange={change} required><option value="">Select</option>{["Normal","Dry","Oily","Combination","Sensitive"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Age Group<input name="age_group" value={form.age_group} onChange={change} placeholder="e.g. 18–24" required/></label>
    <fieldset><legend>Skin Concerns</legend><div className="checks">{concerns.map(c=><label className="check" key={c}><input type="checkbox" checked={form.skin_concerns.includes(c)} onChange={()=>toggle(c)}/>{c}</label>)}</div></fieldset>
    <label>Allergies<textarea name="allergies" value={form.allergies} onChange={change} placeholder="List known allergies, or write None"/></label>
    <label>Sensitivities<textarea name="sensitivities" value={form.sensitivities} onChange={change} placeholder="List skin sensitivities, or write None"/></label>
    <label>Lifestyle Habits<textarea name="lifestyle_habits" value={form.lifestyle_habits} onChange={change} placeholder="Basic lifestyle information"/></label>
    <label>Sleep Quality<select name="sleep_quality" value={form.sleep_quality} onChange={change} required><option value="">Select</option>{["Poor","Average","Good","Excellent"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Daily Water Intake (litres)<input name="water_intake" type="number" min="0" max="100" step="0.1" value={form.water_intake} onChange={change} required/></label>
    <label>Sun Exposure<input name="sun_exposure" value={form.sun_exposure} onChange={change} placeholder="e.g. Low / Moderate / High"/></label>
    <label>Pollution Exposure<input name="pollution_exposure" value={form.pollution_exposure} onChange={change} placeholder="e.g. Low / Moderate / High"/></label>
    <button className="primary">{exists?"Update Profile":"Save Profile"}</button>
  </form></section>;
}
