// MoneyTrack frontend. Create a Supabase project, run supabase.sql, then put your keys below.
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const categories = ["Food","Transport","Bills","Shopping","Education","Health","Entertainment","Salary","Allowance","Other"];
let supabaseClient = null, currentUser = null, transactions = [], currentType = "income", authMode = "login";

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(n)||0);
const fmtDate = d => new Date(d+"T00:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
const today = () => new Date().toISOString().slice(0,10);

function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function monthKey(d){return d.slice(0,7)}
function thisMonth(){return monthKey(today())}

function populateCategories(){
  $("category").innerHTML = categories.map(c=>`<option>${c}</option>`).join("");
  $("categoryFilter").innerHTML = `<option value="all">All categories</option>`+categories.map(c=>`<option>${c}</option>`).join("");
}
function showAuthMessage(msg=""){ $("authMessage").textContent=msg; }

async function boot(){
  populateCategories(); $("date").value=today();
  if(SUPABASE_URL.startsWith("YOUR_")) {
    showAuthMessage("Connect Supabase in app.js to enable accounts and cloud sync.");
    $("authSubmit").disabled=true;
    return;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  const {data:{session}} = await supabaseClient.auth.getSession();
  if(session) await enterApp(session.user);
  supabaseClient.auth.onAuthStateChange(async (event,session)=>{
    if(session) await enterApp(session.user); else leaveApp();
  });
}
async function enterApp(user){
  currentUser=user; $("authView").classList.add("hidden"); $("appView").classList.remove("hidden");
  $("userEmail").textContent=user.email||""; $("avatar").textContent=(user.email||"U")[0].toUpperCase();
  $("greeting").textContent=`Good ${new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}`;
  await loadTransactions();
}
function leaveApp(){$("appView").classList.add("hidden");$("authView").classList.remove("hidden");transactions=[]}

async function loadTransactions(){
  const {data,error}=await supabaseClient.from("transactions").select("*").order("date",{ascending:false}).order("created_at",{ascending:false});
  if(error){toast(error.message);return} transactions=data||[]; renderAll();
}
function renderAll(){renderDashboard();renderTable();renderAnalytics()}

function renderDashboard(){
  const balance=transactions.reduce((s,t)=>s+(t.type==="income"?+t.amount:-+t.amount),0);
  const m=transactions.filter(t=>monthKey(t.date)===thisMonth());
  const inc=m.filter(t=>t.type==="income").reduce((s,t)=>s+ +t.amount,0);
  const exp=m.filter(t=>t.type==="expense").reduce((s,t)=>s+ +t.amount,0);
  $("balance").textContent=money(balance);$("income").textContent=money(inc);$("expense").textContent=money(exp);
  $("savingsRate").textContent=(inc?Math.round((inc-exp)/inc*100):0)+"%";
  const recent=transactions.slice(0,6);
  $("recentList").classList.toggle("empty",!recent.length);
  $("recentList").innerHTML=recent.length?recent.map(txRow).join(""):"No transactions yet.";
  const map={};m.filter(t=>t.type==="expense").forEach(t=>map[t.category]=(map[t.category]||0)+ +t.amount);
  const vals=Object.entries(map).sort((a,b)=>b[1]-a[1]), max=vals[0]?.[1]||1;
  $("categoryList").classList.toggle("empty",!vals.length);
  $("categoryList").innerHTML=vals.length?vals.map(([c,v])=>`<div class="category-item"><div><div class="cat-top"><span>${escapeHtml(c)}</span><b>${money(v)}</b></div><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div></div></div>`).join(""):"No expenses this month.";
}
function txRow(t){
  const sign=t.type==="income"?"+":"−", cls=t.type==="income"?"income-text":"expense-text";
  return `<div class="transaction-row"><div class="tx-left"><div class="tx-icon">${t.type==="income"?"＋":"−"}</div><div><div class="tx-title">${escapeHtml(t.description)}</div><div class="tx-date">${escapeHtml(t.category)} · ${fmtDate(t.date)}</div></div></div><strong class="${cls}">${sign}${money(t.amount)}</strong></div>`;
}
function filtered(){
  const q=$("search").value.toLowerCase(), type=$("typeFilter").value, cat=$("categoryFilter").value;
  return transactions.filter(t=>(!q||(`${t.description} ${t.category} ${t.notes||""}`).toLowerCase().includes(q))&&(type==="all"||t.type===type)&&(cat==="all"||t.category===cat));
}
function renderTable(){
  const rows=filtered();
  $("transactionTable").innerHTML=rows.length?`<table class="tx-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th></th></tr></thead><tbody>${rows.map(t=>`<tr><td>${fmtDate(t.date)}</td><td><b>${escapeHtml(t.description)}</b><br><span class="muted">${escapeHtml(t.notes||"")}</span></td><td>${escapeHtml(t.category)}</td><td>${t.type}</td><td class="${t.type==="income"?"income-text":"expense-text"}">${t.type==="income"?"+":"−"}${money(t.amount)}</td><td><button class="delete-btn" data-delete="${t.id}" title="Delete">🗑</button></td></tr>`).join("")}</tbody></table>`:`<div class="empty">No matching transactions.</div>`;
}
function renderAnalytics(){
  const months=[]; const now=new Date();
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(d.toISOString().slice(0,7))}
  const data=months.map(m=>({m,inc:0,exp:0}));
  transactions.forEach(t=>{const x=data.find(x=>x.m===monthKey(t.date));if(x)x[t.type==="income"?"inc":"exp"]+=+t.amount});
  const max=Math.max(1,...data.flatMap(x=>[x.inc,x.exp]));
  $("flowBars").innerHTML=data.map(x=>`<div class="month-bar"><div class="bar-stack"><div class="income-bar" style="height:${x.inc/max*100}%"></div><div class="expense-bar" style="height:${x.exp/max*100}%"></div></div><div class="month-label">${new Date(x.m+"-01").toLocaleDateString("en",{month:"short"})}</div></div>`).join("");
  const map={};transactions.filter(t=>t.type==="expense").forEach(t=>map[t.category]=(map[t.category]||0)+ +t.amount);
  const vals=Object.entries(map).sort((a,b)=>b[1]-a[1]), maxv=vals[0]?.[1]||1;
  $("analyticsCategories").innerHTML=vals.length?vals.map(([c,v])=>`<div class="category-item"><div><div class="cat-top"><span>${escapeHtml(c)}</span><b>${money(v)}</b></div><div class="bar-track"><div class="bar-fill" style="width:${v/maxv*100}%"></div></div></div></div>`).join(""):`<div class="empty">No expense data yet.</div>`;
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function saveTransaction(e){
  e.preventDefault();
  const payload={user_id:currentUser.id,type:currentType,amount:+$("amount").value,description:$("description").value.trim(),category:$("category").value,date:$("date").value,notes:$("notes").value.trim()};
  const {error}=await supabaseClient.from("transactions").insert(payload);
  if(error){toast(error.message);return}
  $("transactionDialog").close();$("transactionForm").reset();$("date").value=today();toast("Transaction saved");await loadTransactions();
}
async function deleteTransaction(id){
  if(!confirm("Delete this transaction?"))return;
  const {error}=await supabaseClient.from("transactions").delete().eq("id",id);
  if(error){toast(error.message);return}toast("Transaction deleted");await loadTransactions();
}
function exportCSV(){
  const rows=filtered(), header=["Date","Description","Category","Type","Amount","Notes"];
  const csv=[header,...rows.map(t=>[t.date,t.description,t.category,t.type,t.amount,t.notes||""])].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`moneytrack-${today()}.csv`;a.click();
}

document.addEventListener("click",async e=>{
  const authTab=e.target.closest("[data-auth-tab]"); if(authTab){authMode=authTab.dataset.authTab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===authTab));$("authSubmit").textContent=authMode==="login"?"Log in":"Create account";$("password").autocomplete=authMode==="login"?"current-password":"new-password";showAuthMessage("");return}
  const nav=e.target.closest("[data-section]"); if(nav){document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x===nav));document.querySelectorAll(".page").forEach(x=>x.classList.toggle("hidden",x.id!==nav.dataset.section));return}
  if(e.target.closest("[data-section-link]")){document.querySelector('[data-section="transactions"]').click();return}
  if(e.target.closest("#addBtn")||e.target.closest("#addBtn2")){$("transactionDialog").showModal();return}
  if(e.target.closest("#closeDialog")||e.target.closest("#cancelDialog")){$("transactionDialog").close();return}
  const type=e.target.closest("[data-type]");if(type){currentType=type.dataset.type;document.querySelectorAll(".type-btn").forEach(x=>x.classList.toggle("active",x===type));return}
  const del=e.target.closest("[data-delete]");if(del)await deleteTransaction(del.dataset.delete);
  if(e.target.closest("#logoutBtn"))await supabaseClient.auth.signOut();
  if(e.target.closest("#themeBtn")){document.body.classList.toggle("dark");localStorage.setItem("moneytrack-dark",document.body.classList.contains("dark"))}
  if(e.target.closest("#exportBtn"))exportCSV();
});
$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();showAuthMessage("");
  if(!supabaseClient){showAuthMessage("Connect Supabase in app.js first.");return}
  const email=$("email").value.trim(),password=$("password").value;
  const result=authMode==="login"?await supabaseClient.auth.signInWithPassword({email,password}):await supabaseClient.auth.signUp({email,password});
  if(result.error)showAuthMessage(result.error.message);else if(authMode==="signup"&&!result.data.session)showAuthMessage("Account created. Check your email to confirm your account.");
});
$("transactionForm").addEventListener("submit",saveTransaction);
["search","typeFilter","categoryFilter"].forEach(id=>$(id).addEventListener("input",renderTable));
if(localStorage.getItem("moneytrack-dark")==="true")document.body.classList.add("dark");
boot();
