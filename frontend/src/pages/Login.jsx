import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/api";
export default function Login({onLogin}) {
  const nav=useNavigate(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const submit=async e=>{
    e.preventDefault();setError("");setLoading(true);
    try{
      const r=await login({email,password});
      localStorage.setItem("token",r.data.access_token);
      onLogin(r.data.user);
      nav("/dashboard");
    }catch(err){
      const msg = err.response?.data?.detail 
        || (err.message === "Network Error" ? "Cannot connect to server. The backend may be spinning up (please wait 30 seconds) or API URL is incorrect." : "Login failed.");
      setError(msg);
    }finally{setLoading(false);}
  };
  return <section className="card form-card"><h2>Welcome back</h2>{error&&<div className="error">{error}</div>}<form onSubmit={submit}><input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="primary" disabled={loading}>{loading?"Signing in...":"Login"}</button><p>New user? <Link to="/register">Create an account</Link></p></form></section>;
}
