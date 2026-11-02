import { useEffect, useState } from 'react';
import { supabase } from './backend';
export type Auth={status:'loading'|'out'|'pending'|'admin';email:string;checkFailed:boolean;signIn:(email:string,password:string)=>Promise<void>;signUp:(email:string,password:string)=>Promise<'signed-in'|'confirm-email'|'exists'>;signOut:()=>Promise<void>;recheck:()=>void};
export function useAuth():Auth{
const [status,setStatus]=useState<Auth['status']>(()=>supabase?'loading':sessionStorage.getItem('th_admin')==='demo'?'admin':'out');const [userId,setUserId]=useState<string|null>(null);const [email,setEmail]=useState('');const [checkFailed,setCheckFailed]=useState(false);const [attempt,setAttempt]=useState(0);
// Supabase must not be queried from inside this callback (it holds the auth lock), so the role lookup runs in the effect below.
useEffect(()=>{if(!supabase)return;const {data}=supabase.auth.onAuthStateChange((_event,session)=>{setUserId(session?.user.id??null);setEmail(session?.user.email??'');if(!session)setStatus('out')});return()=>data.subscription.unsubscribe()},[]);
useEffect(()=>{if(!supabase||!userId)return;let live=true;setStatus('loading');setCheckFailed(false);supabase.from('profiles').select('role').eq('id',userId).maybeSingle().then(({data,error})=>{if(!live)return;setCheckFailed(!!error);setStatus(data?.role==='admin'?'admin':'pending')});return()=>{live=false}},[userId,attempt]);
async function signIn(address:string,password:string){if(!supabase){sessionStorage.setItem('th_admin','demo');setStatus('admin');return}const {error}=await supabase.auth.signInWithPassword({email:address,password});if(error)throw error}
async function signUp(address:string,password:string){if(!supabase){await signIn(address,password);return 'signed-in' as const}const {data,error}=await supabase.auth.signUp({email:address,password,options:{emailRedirectTo:window.location.origin+'/admin/login'}});if(error)throw error;if(data.session)return 'signed-in' as const;return data.user?.identities?.length===0?'exists' as const:'confirm-email' as const}
async function signOut(){if(supabase){await supabase.auth.signOut();return}sessionStorage.removeItem('th_admin');setStatus('out')}
return {status,email,checkFailed,signIn,signUp,signOut,recheck:()=>setAttempt(n=>n+1)}}
