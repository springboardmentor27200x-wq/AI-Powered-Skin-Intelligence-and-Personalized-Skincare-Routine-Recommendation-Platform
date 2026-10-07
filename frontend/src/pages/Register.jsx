import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/api";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({name:"",email:"",password:"",confirmPassword:"",age:"",gender:""});
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=async e=>{
    e.preventDefault(); setError("");
    if(form.password!==form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try { await register({name:form.name,email:form.email,password:form.password,age:Number(form.age),gender:form.gender}); nav("/login"); }
    catch(err){ setError(err.response?.data?.detail || "Registration failed."); }
    finally{setLoading(false);}
  };
  return <Form title="Create your account" error={error} onSubmit={submit} loading={loading}>
    <input name="name" placeholder="Full Name" value={form.name} onChange={change} required />
    <input name="email" type="email" placeholder="Email" value={form.email} onChange={change} required />
    <input name="password" type="password" placeholder="Password (8+ characters)" value={form.password} onChange={change} minLength="8" required />
    <input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={change} required />
    <input name="age" type="number" placeholder="Age" value={form.age} onChange={change} min="1" max="120" required />
    <select name="gender" value={form.gender} onChange={change} required><option value="">Select Gender</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select>
    <button className="primary" disabled={loading}>{loading?"Creating...":"Register"}</button>
    <p>Already registered? <Link to="/login">Login</Link></p>
  </Form>;
}
function Form({title,error,children,onSubmit,loading}){return <section className="card form-card"><h2>{title}</h2>{error&&<div className="error">{error}</div>}<form onSubmit={onSubmit}>{children}</form></section>}
