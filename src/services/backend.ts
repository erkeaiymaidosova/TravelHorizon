import { createClient } from '@supabase/supabase-js';
import type { Photos, Tour } from '../types';
const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
export const supabase=url&&key?createClient(url,key):null;
// Booking/contact writes are intentionally handled by local storage in demo mode.
// Production: route writes through an Edge Function to validate data and send Telegram notifications server-side.

// The catalogue and photo choices live in site_content: anyone can read it, and RLS only lets admins write it.
export async function loadSiteContent(){if(!supabase)return null;const {data,error}=await supabase.from('site_content').select('key,content').in('key',['tours','photos']);if(error)throw new Error(error.message);const row=(k:string)=>data.find(r=>r.key===k)?.content;return {tours:row('tours') as Tour[]|undefined,photos:row('photos') as Photos|undefined}}
export async function saveSiteContent(k:'tours'|'photos',content:Tour[]|Photos){if(!supabase)return;const {error}=await supabase.from('site_content').upsert({key:k,content,updated_at:new Date().toISOString()});if(error)throw new Error(error.message)}

export const UNREADABLE_IMAGE='unreadable-image';export const MAX_UPLOAD_BYTES=20*1024*1024;
async function compress(file:File,maxEdge:number){let bitmap:ImageBitmap;try{bitmap=await createImageBitmap(file)}catch{throw new Error(UNREADABLE_IMAGE)}const scale=Math.min(1,maxEdge/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error(UNREADABLE_IMAGE)),'image/jpeg',.85))}
const toDataUrl=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(blob)});
// Without Supabase the photo is kept in localStorage, so it is shrunk further to fit that browser's small quota.
export async function uploadPhoto(file:File){if(!file.type.startsWith('image/')||file.type==='image/svg+xml')throw new Error(UNREADABLE_IMAGE);if(!supabase)return toDataUrl(await compress(file,1200));const path=`${crypto.randomUUID()}.jpg`;const {error}=await supabase.storage.from('tour-images').upload(path,await compress(file,2200),{contentType:'image/jpeg',cacheControl:'31536000'});if(error)throw new Error(error.message);return supabase.storage.from('tour-images').getPublicUrl(path).data.publicUrl}
