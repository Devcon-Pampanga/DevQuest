"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const WAVE_COLORS = ["#F5C518","#F97316","#22C55E","#9333EA","#06B6D4"];
const PIE_COLORS  = ["#7c5cf4","#22c55e","#f59e0b","#06b6d4","#f97316","#ec4899","#a78bfa","#34d399","#fbbf24","#60a5fa","#f87171","#818cf8"];

interface AvatarOptions { backgroundColor:string; backgroundType:"solid"|"gradientLinear"; eyes:string; mouth:string; }
interface UserData { username:string; role:"volunteer"|"coordinator"; chapterId:string; avatarOptions?:AvatarOptions; }
interface EventRole { roleName:string; slots:number; xpReward:number; }
interface EventDoc { eventId:string; name:string; description:string; date:Timestamp; location:string; chapterId:string; roles:EventRole[]; bannerUrl?:string; }
interface ReflectionEntry { userId:string; username:string; firstName:string; lastName:string; eventId:string; eventName:string; chapter:string; rolePosition:string; ratings:Record<string,number>; mood:string; insights:string; submittedAt?:{toDate:()=>Date}; }

const CHAPTERS = ["DEVCON Kids Baguio","DEVCON Kids Cagayan de Oro","DEVCON Kids Cebu","DEVCON Kids Davao","DEVCON Kids Iloilo","DEVCON Kids Manila","DEVCON Kids Pampanga","DEVCON Kids Quezon City","DEVCON Kids Tacloban","DEVCON Kids Zamboanga"] as const;
const MOODS = [{key:"drained",emoji:"🥱",label:"Drained",color:"#6b7280"},{key:"okay",emoji:"🙂",label:"Okay",color:"#f59e0b"},{key:"good",emoji:"😊",label:"Good",color:"#22c55e"},{key:"energized",emoji:"🔥",label:"Energized",color:"#a78bfa"}];
const PRE_Qs = [{key:"q1",short:"Role Clarity",full:"My Volunteer Role/s and Responsibility/ies were clearly stated"},{key:"q2",short:"Reporting Clarity",full:"Reporting instructions were clearly stated"},{key:"q3",short:"Reporting Complete",full:"Reporting instructions were complete (what to wear, time, location, access to location)"},{key:"q4",short:"Prep Readiness",full:"I received enough materials, time, and support to adequately prepare for my role"}];
const DURING_Qs = [{key:"q5",short:"Overwhelm",full:"I felt overwhelmed",invert:true},{key:"q6",short:"Impact",full:"I felt my work was essential for the success of the event",invert:false},{key:"q7",short:"Time Given",full:"I was given enough time to do tasks assigned to me",invert:false},{key:"q8",short:"Access to Help",full:"I had access to help anytime I needed it",invert:false}];

type PageTab = "events"|"data";
type FilterType = "all"|"upcoming"|"past";

const DEFAULT_AVATAR:AvatarOptions = {backgroundColor:"5e35b1",backgroundType:"solid",eyes:"round",mouth:"smile01"};
function buildAvatarUrl(seed:string,opts:AvatarOptions){return `https://api.dicebear.com/9.x/bottts-neutral/svg?${new URLSearchParams({seed,backgroundColor:opts.backgroundColor,backgroundType:opts.backgroundType,eyes:opts.eyes,mouth:opts.mouth})}`;}
function formatEventDate(ts:Timestamp){return ts.toDate().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
function totalSlots(roles:EventRole[]){return roles.reduce((s,r)=>s+r.slots,0);}
function isUpcoming(ts:Timestamp){return ts.toDate()>new Date();}
function shortChapter(c:string){return c.replace(/^DEVCON Kids\s+/i,"");}
const avg=(v:number[])=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
const rFor=(key:string,data:ReflectionEntry[])=>data.map(r=>r.ratings?.[key]).filter((v):v is number=>typeof v==="number"&&v>=1&&v<=5);

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({event}:{event:EventDoc}){
  const upcoming=isUpcoming(event.date);
  return(
    <Link href={`/events/${event.eventId}`} className="rounded-2xl bg-surface border border-border overflow-hidden flex flex-col hover:border-accent-primary/50 transition-colors duration-200">
      <div className="relative h-36 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.bannerUrl??"/event-banner-placeholder.png"} alt="" className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
        {!event.bannerUrl&&<div className="absolute inset-0 opacity-40" style={{background:upcoming?"linear-gradient(135deg,#7C3AED,#A855F7)":"rgba(39,39,42,0.8)"}}/>}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${upcoming?"bg-green-500/15 text-green-400":"bg-zinc-700/40 text-zinc-400"}`}>{upcoming?"UPCOMING":"PAST"}</span>
        <h2 className="font-heading text-lg text-text-primary leading-tight">{event.name}</h2>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{formatEventDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span className="line-clamp-1">{event.location}</span>
        </div>
        <div className="mt-auto pt-1">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-text-secondary">Slots Available</span>
            <span className="text-accent-highlight font-semibold">{totalSlots(event.roles)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-border"><div className="h-full rounded-full bg-accent-primary" style={{width:upcoming?"60%":"100%"}}/></div>
        </div>
      </div>
    </Link>
  );
}

// ── Donut KPI ─────────────────────────────────────────────────────────────────
function Donut({value,max,label,color}:{value:number;max:number;label:string;color:string}){
  const r=28,c=2*Math.PI*r,pct=max>0?value/max:0;
  return(
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{width:72,height:72}}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{transform:"rotate(-90deg)"}}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="#2e2a42" strokeWidth="7"/>
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${pct*c} ${(1-pct)*c}`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold" style={{color}}>{max===100?`${Math.round(value)}%`:value.toFixed(1)}</span>
          {max!==100&&<span className="text-[9px] text-text-muted">/{max}</span>}
        </div>
      </div>
      <p className="text-[10px] text-text-muted text-center leading-tight max-w-[72px]">{label}</p>
    </div>
  );
}

// ── Horizontal Bar ────────────────────────────────────────────────────────────
function HBar({label,counts,total}:{label:string;counts:number[];total:number}){
  const mx=Math.max(...counts,1);
  return(
    <div className="bg-surface border border-border rounded-xl p-4 mb-3">
      <p className="text-sm font-heading text-text-primary mb-1">{label}</p>
      <p className="text-xs text-text-muted mb-3">{total} responses</p>
      <div className="flex flex-col gap-1.5">
        {counts.map((c,i)=>{
          const pct=total>0?Math.round((c/total)*100):0;
          return(
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-3 shrink-0">{i+1}</span>
              <div className="flex-1 h-5 rounded-sm bg-border overflow-hidden">
                <div className="h-full rounded-sm bg-[#22c55e]" style={{width:`${mx>0?(c/mx)*100:0}%`}}/>
              </div>
              <span className="text-xs text-text-muted w-16 text-right shrink-0">{c>0?`${c} (${pct}%)`:"—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pie Chart ─────────────────────────────────────────────────────────────────
function MiniPie({data}:{data:{label:string;value:number;color:string}[]}){
  const total=data.reduce((s,d)=>s+d.value,0);
  if(!total) return <p className="text-xs text-text-muted text-center py-4">No data</p>;
  const cx=50,cy=50,r=44; let cum=-Math.PI/2;
  const slices=data.map(d=>{
    const a=(d.value/total)*2*Math.PI;
    const x1=cx+r*Math.cos(cum),y1=cy+r*Math.sin(cum); cum+=a;
    const x2=cx+r*Math.cos(cum),y2=cy+r*Math.sin(cum);
    return{...d,path:`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${a>Math.PI?1:0},1 ${x2},${y2} Z`};
  });
  return(
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" style={{width:80,height:80,flexShrink:0}}>
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} stroke="#0f0d14" strokeWidth="1.5"/>)}
      </svg>
      <div className="flex flex-col gap-1 min-w-0">
        {[...data].sort((a,b)=>b.value-a.value).slice(0,6).map(d=>(
          <div key={d.label} className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{background:d.color}}/>
            <span className="text-[10px] text-text-secondary truncate">{d.label}</span>
            <span className="text-[10px] text-text-muted ml-auto flex-shrink-0">{((d.value/total)*100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Data Dashboard ────────────────────────────────────────────────────────────
function DataDashboard({reflections,events}:{reflections:ReflectionEntry[];events:EventDoc[]}){
  const [filterEvent,setFilterEvent]=useState("all");
  const [expandedRow,setExpandedRow]=useState<string|null>(null);

  const filtered=filterEvent==="all"?reflections:reflections.filter(r=>r.eventId===filterEvent);
  const total=filtered.length;

  const roleClarity=avg(rFor("q1",filtered));
  const prepReadiness=avg(rFor("q4",filtered));
  const accessHelp=avg(rFor("q8",filtered));
  const overwhelm=avg(rFor("q5",filtered));
  const notOverwhelm=overwhelm>0?Math.round(((5-overwhelm)/4)*100):0;

  const chapMap:Record<string,number>={};
  filtered.forEach(r=>{chapMap[r.chapter]=(chapMap[r.chapter]??0)+1;});
  const pieData=Object.entries(chapMap).map(([label,value],i)=>({label,value,color:PIE_COLORS[i%PIE_COLORS.length]}));

  const moodCounts:Record<string,number>={drained:0,okay:0,good:0,energized:0};
  filtered.forEach(r=>{if(r.mood in moodCounts) moodCounts[r.mood]++;});

  const card="bg-surface border border-border rounded-2xl p-4";

  return(
    <div className="flex flex-col gap-4">
      {/* Event filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterEvent} onChange={e=>setFilterEvent(e.target.value)}
          className="text-xs bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary" style={{colorScheme:"dark"}}>
          <option value="all">All Events ({reflections.length} responses)</option>
          {events.map(e=>{
            const count=reflections.filter(r=>r.eventId===e.eventId).length;
            return <option key={e.eventId} value={e.eventId}>{e.name} ({count})</option>;
          })}
        </select>
        <span className="text-xs font-mono text-accent-highlight bg-accent-primary/10 border border-accent-primary/20 px-3 py-1.5 rounded-lg">{total} response{total!==1?"s":""}</span>
      </div>

      {total===0?(
        <div className="flex flex-col items-center justify-center py-20 text-text-muted bg-surface border border-border rounded-2xl">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-heading text-text-secondary mb-1">No reflections yet</p>
          <p className="text-sm">Responses will appear here once volunteers submit.</p>
        </div>
      ):(
        <>
          {/* Row 1: KPIs + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Key Performance Indicators</p>
              <div className="grid grid-cols-4 gap-2">
                <Donut value={roleClarity}   max={5}   label="Role Clarity"    color="#7c5cf4"/>
                <Donut value={prepReadiness} max={5}   label="Prep Readiness"  color="#22c55e"/>
                <Donut value={accessHelp}    max={5}   label="Access to Help"  color="#06b6d4"/>
                <Donut value={notOverwhelm}  max={100} label="Not Overwhelmed" color="#f59e0b"/>
              </div>
            </div>
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Volunteer Distribution by Chapter</p>
              <MiniPie data={pieData}/>
            </div>
          </div>

          {/* Row 2: Pre-event + During */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Pre-Event Preparation</p>
              <div className="flex flex-col gap-1.5 mb-4">
                {PRE_Qs.map(q=>{
                  const vals=rFor(q.key,filtered); const mean=avg(vals); const pct=mean/5;
                  const color=pct>=0.8?"#22c55e":pct>=0.6?"#f59e0b":pct>0?"#f87171":"#2e2a42";
                  return(<div key={q.key} className="flex items-center gap-2"><span className="text-[10px] text-text-muted w-32 shrink-0 truncate">{q.short}</span><div className="flex-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct*100}%`,background:color}}/></div><span className="text-xs font-bold w-7 text-right shrink-0" style={{color}}>{mean>0?mean.toFixed(1):"—"}</span></div>);
                })}
              </div>
              {PRE_Qs.map(q=>{const vals=rFor(q.key,filtered);return <HBar key={q.key} label={q.full} counts={[1,2,3,4,5].map(s=>vals.filter(v=>v===s).length)} total={vals.length}/>;  })}
            </div>
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">On-Site Experience</p>
              <div className="flex flex-col gap-1.5 mb-4">
                {DURING_Qs.map(q=>{
                  const vals=rFor(q.key,filtered); const mean=avg(vals);
                  const score=q.invert?(mean>0?(5-mean)/4*100:0):mean/5*100;
                  const color=score>=80?"#22c55e":score>=60?"#f59e0b":score>0?"#f87171":"#2e2a42";
                  return(<div key={q.key} className="flex items-center gap-2"><span className="text-[10px] text-text-muted w-32 shrink-0 truncate">{q.short}</span><div className="flex-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full" style={{width:`${score}%`,background:color}}/></div><span className="text-xs font-bold w-7 text-right shrink-0" style={{color}}>{mean>0?mean.toFixed(1):"—"}</span></div>);
                })}
              </div>
              {DURING_Qs.map(q=>{const vals=rFor(q.key,filtered);return <HBar key={q.key} label={q.full} counts={[1,2,3,4,5].map(s=>vals.filter(v=>v===s).length)} total={vals.length}/>;  })}
            </div>
          </div>

          {/* Row 3: Mood + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Mood After Event</p>
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map(m=>{const count=moodCounts[m.key]??0;const pct=total>0?Math.round((count/total)*100):0;return(<div key={m.key} className="flex flex-col items-center gap-1.5 bg-white/5 border border-border rounded-xl py-3"><span className="text-2xl">{m.emoji}</span><span className="text-sm font-bold" style={{color:m.color}}>{count}</span><span className="text-[10px] text-text-muted">{pct}%</span><span className="text-[10px] text-text-secondary">{m.label}</span></div>);})}
              </div>
            </div>
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Latest Insights & Suggestions</p>
              <div className="flex flex-col gap-2">
                {filtered.filter(r=>r.insights?.trim()).slice(0,3).map((r,i)=>{
                  const name=r.firstName&&r.lastName?`${r.firstName} ${r.lastName}`:r.username;
                  return(<div key={i} className="bg-white/5 border border-border rounded-lg px-3 py-2.5"><p className="text-xs text-text-primary leading-relaxed line-clamp-2">{r.insights}</p><p className="text-[10px] text-text-muted mt-1.5">— {name} · {r.chapter}</p></div>);
                })}
                {filtered.filter(r=>r.insights?.trim()).length===0&&<p className="text-sm text-text-muted text-center py-4">No insights yet.</p>}
              </div>
            </div>
          </div>

          {/* Row 4: Individual responses */}
          <div className={card}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Individual Responses</p>
              <span className="text-xs text-text-muted font-mono">{total} entries</span>
            </div>
            <div className="divide-y divide-border -mx-4 -mb-4">
              {filtered.map((ref,idx)=>{
                const mood=MOODS.find(m=>m.key===ref.mood)??MOODS[1];
                const key=`${ref.userId}-${idx}`;
                const isOpen=expandedRow===key;
                const name=ref.firstName&&ref.lastName?`${ref.firstName} ${ref.lastName}`:ref.username;
                return(
                  <div key={key}>
                    <button onClick={()=>setExpandedRow(isOpen?null:key)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                      <span className="text-lg flex-shrink-0">{mood.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading text-text-primary truncate">{name}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-xs text-text-muted">{ref.rolePosition}</span>
                          <span className="text-xs text-accent-highlight">· {ref.chapter}</span>
                          <span className="text-xs text-text-muted">· {ref.eventName}</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                        {[...PRE_Qs,...DURING_Qs].slice(0,4).map(q=>{const v=ref.ratings[q.key];const bg=v>=4?"#22c55e22":v<=2?"#f8717122":"#f59e0b22";const cl=v>=4?"#22c55e":v<=2?"#f87171":"#f59e0b";return <div key={q.key} className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold" style={{background:bg,color:cl}}>{v??"-"}</div>;})}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted flex-shrink-0 transition-transform" style={{transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {isOpen&&(
                      <div className="border-t border-border bg-white/5 px-4 py-4 flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-accent-highlight mb-2">Pre-Event</p>
                            {PRE_Qs.map(q=>(<div key={q.key} className="flex items-center gap-2 mb-1.5"><span className="text-xs text-text-secondary flex-1 truncate">{q.short}</span><div className="flex gap-0.5">{[1,2,3,4,5].map(n=><div key={n} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{background:ref.ratings[q.key]===n?"#7c5cf4":"transparent",border:`1px solid ${ref.ratings[q.key]===n?"#7c5cf4":"#2e2a42"}`,color:ref.ratings[q.key]===n?"#fff":"#7b76a0"}}>{n}</div>)}</div></div>))}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-accent-highlight mb-2">During Event</p>
                            {DURING_Qs.map(q=>(<div key={q.key} className="flex items-center gap-2 mb-1.5"><span className="text-xs text-text-secondary flex-1 truncate">{q.short}</span><div className="flex gap-0.5">{[1,2,3,4,5].map(n=><div key={n} className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{background:ref.ratings[q.key]===n?"#06b6d4":"transparent",border:`1px solid ${ref.ratings[q.key]===n?"#06b6d4":"#2e2a42"}`,color:ref.ratings[q.key]===n?"#fff":"#7b76a0"}}>{n}</div>)}</div></div>))}
                          </div>
                        </div>
                        {ref.insights&&(<div><p className="text-[10px] font-bold uppercase tracking-widest text-accent-highlight mb-1.5">Insights</p><p className="text-sm text-text-primary leading-relaxed bg-surface border border-border rounded-lg px-3 py-2.5">{ref.insights}</p></div>)}
                        <div className="flex items-center gap-2"><p className="text-[10px] font-bold uppercase tracking-widest text-accent-highlight">Mood:</p><span>{mood.emoji}</span><span className="text-sm font-semibold" style={{color:mood.color}}>{mood.label}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EventsPage(){
  const router=useRouter();
  const [authChecked,setAuthChecked]=useState(false);
  const [userData,setUserData]=useState<UserData|null>(null);
  const [events,setEvents]=useState<EventDoc[]>([]);
  const [loadingEvents,setLoadingEvents]=useState(true);
  const [fetchError,setFetchError]=useState("");
  const [reflections,setReflections]=useState<ReflectionEntry[]>([]);
  const [refLoading,setRefLoading]=useState(false);
  const [pageTab,setPageTab]=useState<PageTab>("events");
  const [search,setSearch]=useState("");
  const [activeFilter,setActiveFilter]=useState<FilterType>("all");
  const [chapterFilter,setChapterFilter]=useState<string>("all");

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async user=>{
      if(!user){router.replace("/");return;}
      const snap=await getDoc(doc(db,"users",user.uid));
      if(!snap.exists()||snap.data()?.onboardingComplete!==true){router.replace("/onboarding");return;}
      setUserData(snap.data() as UserData);
      setAuthChecked(true);
    });
    return ()=>unsub();
  },[router]);

  useEffect(()=>{
    if(!userData) return;
    (async()=>{
      setLoadingEvents(true);
      try{
        const snap=await getDocs(query(collection(db,"events")));
        setEvents(snap.docs.map(d=>({eventId:d.id,...d.data()}) as EventDoc).sort((a,b)=>a.date.toMillis()-b.date.toMillis()));
      }catch(err){console.error(err);setFetchError("Could not load events.");}
      finally{setLoadingEvents(false);}
    })();
  },[userData]);

  // Lazy-load reflections only when Data tab opened (coordinator only)
  useEffect(()=>{
    if(pageTab!=="data"||userData?.role!=="coordinator"||reflections.length>0) return;
    (async()=>{
      setRefLoading(true);
      try{
        const evSnap=await getDocs(collection(db,"events"));
        const results:ReflectionEntry[]=[];
        await Promise.all(evSnap.docs.map(async evDoc=>{
          const ev=evDoc.data();
          const regs=await getDocs(collection(db,"events",evDoc.id,"registrations"));
          await Promise.all(regs.docs.map(async regDoc=>{
            const reg=regDoc.data();
            if(!reg.reflectionSubmitted||!reg.reflectionData) return;
            const rd=reg.reflectionData;
            let username=reg.userId;
            try{const u=await getDoc(doc(db,"users",reg.userId));if(u.exists()) username=u.data().username??reg.userId;}catch{/*ok*/}
            results.push({userId:reg.userId,username,firstName:rd.firstName??"",lastName:rd.lastName??"",eventId:evDoc.id,eventName:ev.name??"Unknown",chapter:rd.chapterId??ev.chapterId??"Unknown",rolePosition:rd.rolePosition??reg.role??"",ratings:rd.ratings??{},mood:rd.mood??"okay",insights:rd.insights??"",submittedAt:rd.submittedAt});
          }));
        }));
        results.sort((a,b)=>(b.submittedAt?.toDate().getTime()??0)-(a.submittedAt?.toDate().getTime()??0));
        setReflections(results);
      }catch(e){console.error(e);}
      finally{setRefLoading(false);}
    })();
  },[pageTab,userData,reflections.length]);

  const filtered=useMemo(()=>{
    const now=new Date();
    return events
      .filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))
      .filter(e=>{if(activeFilter==="upcoming") return e.date.toDate()>now;if(activeFilter==="past") return e.date.toDate()<=now;return true;})
      .filter(e=>chapterFilter==="all"||e.chapterId===chapterFilter);
  },[events,search,activeFilter,chapterFilter]);

  if(!authChecked||!userData) return null;

  const avatarUrl=buildAvatarUrl(userData.username,userData.avatarOptions??DEFAULT_AVATAR);
  const isCoord=userData.role==="coordinator";

  return(
    <div className="flex flex-col flex-1 min-h-0">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="font-heading text-2xl text-text-primary tracking-wide pl-10 lg:pl-0">Events</h1>
        <div className="flex items-center gap-3">
          {isCoord&&(
            <Link href="/events/new" className="flex items-center gap-2 px-4 py-2 bg-accent-highlight hover:bg-accent-primary rounded-xl text-white text-sm font-heading font-medium transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Event
            </Link>
          )}
          <Link href="/notifications" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </Link>
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors"/>
          </Link>
        </div>
      </div>

      {/* Tab bar — coordinators only */}
      {isCoord&&(
        <div className="flex border-b border-border px-6 shrink-0">
          <button onClick={()=>setPageTab("events")}
            className={`px-4 py-3 text-sm font-heading font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${pageTab==="events"?"border-accent-highlight text-text-primary":"border-transparent text-text-secondary hover:text-text-primary"}`}>
            Events
          </button>
          <button onClick={()=>setPageTab("data")}
            className={`px-4 py-3 text-sm font-heading font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${pageTab==="data"?"border-accent-highlight text-text-primary":"border-transparent text-text-secondary hover:text-text-primary"}`}>
            Data
            {reflections.length>0&&<span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-mono">{reflections.length}</span>}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-5">

          {/* Events tab */}
          {pageTab==="events"&&(
            <>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search events..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary/50 transition-colors"/>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(["all","upcoming","past"] as FilterType[]).map(key=>(
                    <button key={key} onClick={()=>setActiveFilter(key)} className={`px-4 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${activeFilter===key?"bg-accent-highlight border-accent-highlight text-white":"border-border text-text-secondary hover:text-text-primary hover:border-text-secondary"}`}>
                      {key.charAt(0).toUpperCase()+key.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-xs text-text-muted font-sans uppercase tracking-widest mr-1">Chapter</span>
                  <button onClick={()=>setChapterFilter("all")} className={`px-4 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${chapterFilter==="all"?"bg-accent-primary/80 border-accent-primary text-white":"border-border text-text-secondary hover:text-text-primary"}`}>All</button>
                  {CHAPTERS.map(chapter=>(
                    <button key={chapter} onClick={()=>setChapterFilter(chapter)} className={`px-4 py-1.5 rounded-full text-sm font-heading font-medium border transition-colors ${chapterFilter===chapter?"bg-accent-primary/80 border-accent-primary text-white":"border-border text-text-secondary hover:text-text-primary"}`}>
                      {shortChapter(chapter)}
                    </button>
                  ))}
                </div>
              </div>
              {loadingEvents?(
                <div className="flex items-center justify-center py-24"><div className="flex gap-2">{WAVE_COLORS.map((c,i)=><span key={i} className="w-2 h-2 rounded-full" style={{backgroundColor:c,animation:"wave-dot 0.6s ease-in-out infinite",animationDelay:`${i*.1}s`}}/>)}</div></div>
              ):fetchError?(
                <div className="flex flex-col items-center justify-center py-24 text-red-400 text-sm">{fetchError}</div>
              ):filtered.length===0?(
                <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p className="text-sm">No events found.</p>
                </div>
              ):(
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(event=><EventCard key={event.eventId} event={event}/>)}
                </div>
              )}
            </>
          )}

          {/* Data tab */}
          {pageTab==="data"&&(
            refLoading?(
              <div className="flex items-center justify-center py-24"><div className="flex gap-2">{WAVE_COLORS.map((c,i)=><span key={i} className="w-2 h-2 rounded-full" style={{backgroundColor:c,animation:"wave-dot 0.6s ease-in-out infinite",animationDelay:`${i*.1}s`}}/>)}</div></div>
            ):(
              <DataDashboard reflections={reflections} events={events}/>
            )
          )}

        </div>
      </div>
    </div>
  );
}