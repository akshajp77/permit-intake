"use server";
import {supabase,configured} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
export async function sendCode(form:FormData){
 if(!configured()) redirect("/login?error=Configure+Supabase+first");
 const email=String(form.get("email")??"").trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/login?error=Enter+a+valid+email");
 const db=await supabase(); const {error}=await db.auth.signInWithOtp({email});
 if(error) redirect("/login?error=Unable+to+send+code.+Check+SMTP+and+rate+limits.");
 redirect("/login?sent=1");
}
export async function verifyCode(form:FormData){
 const db=await supabase();const {error}=await db.auth.verifyOtp({email:String(form.get("email")??"").trim(),token:String(form.get("token")??"").trim(),type:"email"});
 if(error) redirect("/login?error=Invalid+or+expired+code");
 redirect("/workspace");
}
export async function logout(){const db=await supabase();await db.auth.signOut();redirect("/login");}
