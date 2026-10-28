import {supabase,configured} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import {createProject} from "./actions";
import {logout} from "../login/actions";
export const dynamic="force-dynamic";
export default async function Workspace({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 if(!configured())return <main><h1>Connect your workspace.</h1><p>Add Supabase credentials and apply the migration in README.md to enable live projects.</p><div className="notice">The sample is available now. Live accounts and uploads are not simulated.</div></main>;
 const db=await supabase();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const q=await searchParams;const {data:projects,error}=await db.from("projects").select("id,name,external_reference,created_at").order("created_at",{ascending:false});
 return <main><div className="heading"><div><div className="eyebrow">LIVE WORKSPACE</div><h1>Your projects</h1><p>{user.email}</p></div><form action={logout}><button className="button">Sign out</button></form></div>{(error||q.error)&&<p role="alert" className="notice">{q.error||"Database unavailable. Apply the migration and retry."}</p>}<section className="panel padded"><h2>Create a project</h2><form action={createProject}><label>Project name<input name="name" required maxLength={120}/></label><label>Permit reference<input name="reference" required maxLength={60}/></label><button className="button primary">Create project</button></form></section><section className="panel padded"><h2>Project queue</h2>{projects?.length?projects.map(p=><div className="project" key={p.id}><b>{p.name}</b><small>{p.external_reference}</small><span className="badge">Created · Uploads coming in Day 2</span></div>):<p>No projects yet. Create your first project above.</p>}</section></main>;
}
