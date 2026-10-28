"use server";
import {supabase} from "@/lib/supabase/server";
import {ProjectInput} from "@/lib/contracts/review";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
export async function createProject(form:FormData){
 const db=await supabase(); const {data:{user}}=await db.auth.getUser(); if(!user)redirect("/login");
 const input=ProjectInput.safeParse({name:form.get("name"),reference:form.get("reference")});
 if(!input.success)redirect("/workspace?error=Invalid+project+details");
 const {data:membership,error:memberError}=await db.from("memberships").select("org_id").eq("user_id",user.id).single();
 if(memberError||!membership)redirect("/workspace?error=Workspace+membership+not+available");
 const {error}=await db.from("projects").insert({org_id:membership.org_id,name:input.data.name,external_reference:input.data.reference,created_by:user.id});
 if(error)redirect("/workspace?error=Could+not+save.+Check+for+a+duplicate+reference.");
 revalidatePath("/workspace");
}
