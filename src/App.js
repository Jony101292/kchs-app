import { useState } from "react";

const ROOMS = [
  "001","002","003","004","005","006","007",
  "101","102","103","104","105","106",
  "201","202","203","204","205","206",
  "301","302","303","304"
];
const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const YEARS = Array.from({length:10},(_,i)=>2024+i);

const DEFAULT_PARTICULARS = {
  muniAssessment:   {label:"Muni. Assessment",          default:""},
  maintenanceCharges:{label:"Maintenance Charges",      default:"1800"},
  sinkingFund:      {label:"Sinking Fund",              default:""},
  welfareFund:      {label:"Welfare Fund",              default:""},
  parkingCharges:   {label:"Parking Charges",           default:""},
  lateCharges:      {label:"Late Charges (Vilamb Akar)",default:""},
  repairFund:       {label:"Imarat Durusti Nidhi",      default:"200"},
  transferFee:      {label:"Sadanika Transfer Fee",     default:""},
  transferPremium:  {label:"Sadanika Transfer Premium", default:""},
  caretaker:        {label:"Care Taker",                default:"200"},
  extra1:           {label:"",                          default:""},
  extra2:           {label:"",                          default:""},
};

const blankParticulars = () =>
  Object.fromEntries(Object.entries(DEFAULT_PARTICULARS).map(([k,v])=>[k,v.default]));

const getTotal = p =>
  Object.values(p).reduce((s,v)=>s+(parseFloat(v)||0),0);

const todayStr = () => new Date().toISOString().split("T")[0];

const STORAGE_KEY = "kchs_records_v2";

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch{ return []; }
}
function saveRecords(r) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch{}
}

export default function App() {
  const [tab, setTab] = useState("new");
  const [records, setRecords] = useState(loadRecords);
  const [receiptNo, setReceiptNo] = useState(()=>{
    const r = loadRecords();
    return r.length ? Math.max(...r.map(x=>x.receiptNo))+1 : 1001;
  });
  const [showReceipt, setShowReceipt] = useState(null);
  const [filterYear,  setFilterYear]  = useState(String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState("All");
  // const receiptRef = useRef();

  const [form, setForm] = useState({
    flatNo:"101", memberName:"", forMonth:MONTHS[new Date().getMonth()],
    forYear:new Date().getFullYear(), paymentDate:todayStr(),
    paymentMode:"online", chequeNo:"", bank:"", folioNo:"",
    particulars: blankParticulars(),
  });

  function setF(k,v){ setForm(f=>({...f,[k]:v})); }
  function setP(k,v){ setForm(f=>({...f,particulars:{...f.particulars,[k]:v}})); }

  function handleSave(){
    if(!form.memberName.trim()){alert("Please enter member name.");return;}
    const rec = {...form, receiptNo, savedAt:new Date().toISOString()};
    const updated = [rec,...records];
    setRecords(updated);
    saveRecords(updated);
    setShowReceipt(rec);
    setReceiptNo(n=>n+1);
  }

  function handleNewReceipt(){
    setShowReceipt(null);
    setForm(f=>({...f,memberName:"",folioNo:"",paymentDate:todayStr(),
      chequeNo:"",bank:"",particulars:blankParticulars()}));
    setTab("new");
  }

  // PDF generation using jsPDF + html2canvas
  async function handleSavePDF(rec){
    const { default: html2canvas } = await import("html2canvas");
const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default?.jsPDF || jsPDFModule.jsPDF || window.jspdf?.jsPDF;

    const el = document.getElementById("receipt-print-area");
    if(!el) return;

    const canvas = await html2canvas(el, {scale:2, useCORS:true, backgroundColor:"#ffffff"});
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({orientation:"portrait",unit:"mm",format:"a5"});
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pw/canvas.width*2, ph/canvas.height*2);
    const iw = canvas.width*ratio/2;
    const ih = canvas.height*ratio/2;
    const mx = (pw-iw)/2;
    pdf.addImage(imgData,"PNG",mx,8,iw,ih);

    const fname = `KCHS_Receipt_${rec.receiptNo}_Flat${rec.flatNo}_${rec.forMonth}${rec.forYear}.pdf`;
    pdf.save(fname);
  }

  // Group records by year → month
  const grouped = records.reduce((acc,r)=>{
    const y = String(r.forYear);
    const m = r.forMonth;
    if(!acc[y]) acc[y]={};
    if(!acc[y][m]) acc[y][m]=[];
    acc[y][m].push(r);
    return acc;
  },{});

  const availYears  = Object.keys(grouped).sort((a,b)=>b-a);
  //const availMonths = filterYear&&grouped[filterYear] ? Object.keys(grouped[filterYear]) : [];
  const displayRecs = filterYear && grouped[filterYear]
    ? filterMonth==="All"
      ? Object.values(grouped[filterYear]).flat()
      : (grouped[filterYear][filterMonth]||[])
    : [];

  const total = getTotal(form.particulars);

  return (
    <div style={{minHeight:"100vh",background:"#f4efe6",fontFamily:"'Georgia',serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        *{box-sizing:border-box;}body{margin:0;}
        .hdr{background:linear-gradient(135deg,#1b3d2a 0%,#0d2218 100%);color:#fff;padding:16px 20px;display:flex;align-items:center;gap:14px;}
        .hdr-logo{width:50px;height:50px;border-radius:50%;background:#c8973a;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:900;font-size:21px;color:#fff;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.35);}
        .hdr-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;}
        .hdr-sub{font-size:10px;color:#a8c4a0;letter-spacing:1.4px;text-transform:uppercase;margin-top:2px;}
        .tabs{display:flex;border-bottom:2px solid #c8973a;background:#fff;}
        .tab{padding:11px 26px;font-family:'Source Serif 4',serif;font-size:13px;border:none;background:none;cursor:pointer;color:#777;font-weight:600;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .2s;}
        .tab.on{color:#1b3d2a;border-bottom-color:#c8973a;}
        .card{background:#fff;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.08);margin:18px;padding:22px;}
        .sec{font-family:'Playfair Display',serif;font-size:14px;color:#1b3d2a;border-bottom:1px solid #e0d8c8;padding-bottom:7px;margin-bottom:15px;font-weight:700;}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
        .fg{display:flex;flex-direction:column;gap:4px;}
        .fg label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;}
        .fg select,.fg input{border:1.5px solid #ddd;border-radius:6px;padding:8px 11px;font-family:'Source Serif 4',serif;font-size:13px;color:#1b3d2a;background:#fafaf7;transition:border-color .2s;}
        .fg select:focus,.fg input:focus{outline:none;border-color:#c8973a;}
        .ptbl{width:100%;border-collapse:collapse;font-size:12.5px;}
        .ptbl th{background:#1b3d2a;color:#fff;padding:7px 11px;font-family:'Source Serif 4',serif;font-weight:600;text-align:left;}
        .ptbl th:last-child{text-align:right;width:130px;}
        .ptbl td{padding:5px 11px;border-bottom:1px solid #f0ebe0;}
        .ptbl tr:hover td{background:#fdf8f0;}
        .amt{width:100%;text-align:right;border:1px solid #ddd;border-radius:4px;padding:5px 7px;font-family:'Source Serif 4',serif;font-size:12.5px;}
        .amt:focus{outline:none;border-color:#c8973a;}
        .trow td{background:#f5f0e8;font-weight:700;font-size:13.5px;}
        .btn1{background:linear-gradient(135deg,#1b3d2a,#0d2218);color:#fff;border:none;border-radius:8px;padding:12px 28px;font-family:'Playfair Display',serif;font-size:14px;cursor:pointer;letter-spacing:.4px;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:opacity .2s;}
        .btn1:hover{opacity:.87;}
        .btn2{background:#fff;color:#1b3d2a;border:2px solid #1b3d2a;border-radius:8px;padding:10px 20px;font-family:'Playfair Display',serif;font-size:13px;cursor:pointer;transition:background .2s;}
        .btn2:hover{background:#f0ebe0;}
        .btn-pdf{background:linear-gradient(135deg,#c8973a,#a67730);color:#fff;border:none;border-radius:8px;padding:10px 20px;font-family:'Playfair Display',serif;font-size:13px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.15);transition:opacity .2s;}
        .btn-pdf:hover{opacity:.87;}
        .badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:700;}
        .b-cash{background:#fef3c7;color:#92400e;}
        .b-online{background:#d1fae5;color:#065f46;}
        .b-cheque{background:#dbeafe;color:#1e40af;}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:14px;overflow-y:auto;}
        .rpaper{background:#fff;width:100%;max-width:500px;border-radius:6px;box-shadow:0 8px 32px rgba(0,0,0,.3);}
        .rinner{padding:22px 26px;font-family:'Source Serif 4',serif;}
        .ract{display:flex;gap:10px;flex-wrap:wrap;padding:12px 20px;border-top:1px solid #eee;background:#fafaf7;border-radius:0 0 6px 6px;}
        .folder-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;}
        .folder-box{background:#1b3d2a;color:#fff;border-radius:8px;padding:8px 16px;font-size:12px;font-family:'Source Serif 4',serif;font-weight:600;cursor:pointer;border:2px solid transparent;transition:all .2s;}
        .folder-box.sel{background:#fff;color:#1b3d2a;border-color:#1b3d2a;}
        .month-chip{background:#f5f0e8;color:#1b3d2a;border-radius:20px;padding:5px 13px;font-size:11px;cursor:pointer;border:1.5px solid transparent;font-weight:600;}
        .month-chip.sel{background:#c8973a;color:#fff;border-color:#c8973a;}
        .rec-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0ebe0;flex-wrap:wrap;gap:6px;}
        .audit-section{background:#f9f5ee;border:1px solid #e0d8c8;border-radius:8px;padding:14px;margin-bottom:14px;}
        .audit-title{font-family:'Playfair Display',serif;font-size:13px;color:#1b3d2a;font-weight:700;margin-bottom:8px;}
        .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;}
        .stat-box{background:#fff;border-radius:6px;padding:8px 12px;text-align:center;border:1px solid #e8e0d0;}
        .stat-num{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:#1b3d2a;}
        .stat-lbl{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.8px;}
        @media(max-width:480px){.grid2{grid-template-columns:1fr;}.card{margin:10px;padding:14px;}.ract{flex-direction:column;}}
        @media print{
          body *{visibility:hidden;}
          #receipt-print-area,#receipt-print-area *{visibility:visible;}
          #receipt-print-area{position:fixed;inset:0;padding:10mm;}
          .ract,.overlay > *:not(.rpaper){display:none;}
        }
      `}</style>

      <div className="hdr">
        <div className="hdr-logo">K</div>
        <div>
          <div className="hdr-name">Kedarnath Co-Op. Housing Society Ltd.</div>
          <div className="hdr-sub">Maintenance & Receipt Management · Est. March 2005</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab==="new"?" on":""}`} onClick={()=>setTab("new")}>🧾 New Receipt</button>
        <button className={`tab${tab==="rec"?" on":""}`} onClick={()=>setTab("rec")}>📁 Records & Audit ({records.length})</button>
      </div>

      {/* ── NEW RECEIPT TAB ── */}
      {tab==="new" && (<>
        <div className="card">
          <div className="sec">Member & Payment Details</div>
          <div className="grid2">
            <div className="fg">
              <label>Flat / Room No.</label>
              <select value={form.flatNo} onChange={e=>setF("flatNo",e.target.value)}>
                {ROOMS.map(r=><option key={r}>Flat {r}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Member Name</label>
              <input placeholder="Shri / Smt." value={form.memberName} onChange={e=>setF("memberName",e.target.value)}/>
            </div>
            <div className="fg">
              <label>Maintenance Month</label>
              <select value={form.forMonth} onChange={e=>setF("forMonth",e.target.value)}>
                {MONTHS.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Year</label>
              <select value={form.forYear} onChange={e=>setF("forYear",parseInt(e.target.value))}>
                {YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Date of Payment</label>
              <input type="date" value={form.paymentDate} onChange={e=>setF("paymentDate",e.target.value)}/>
            </div>
            <div className="fg">
              <label>Mode of Payment</label>
              <select value={form.paymentMode} onChange={e=>setF("paymentMode",e.target.value)}>
                <option value="online">Online / UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque / DD</option>
              </select>
            </div>
            {form.paymentMode==="cheque"&&<>
              <div className="fg"><label>Cheque No.</label><input value={form.chequeNo} onChange={e=>setF("chequeNo",e.target.value)}/></div>
              <div className="fg"><label>Bank</label><input value={form.bank} onChange={e=>setF("bank",e.target.value)}/></div>
            </>}
            <div className="fg"><label>Folio No.</label><input placeholder="Optional" value={form.folioNo} onChange={e=>setF("folioNo",e.target.value)}/></div>
          </div>
        </div>

        <div className="card" style={{marginTop:0}}>
          <div className="sec">Particulars (Tapshil)</div>
          <table className="ptbl">
            <thead><tr><th>#</th><th>Particular</th><th>Amount (₹)</th></tr></thead>
            <tbody>
              {Object.entries(DEFAULT_PARTICULARS).map(([k,{label}],i)=>(
                <tr key={k}>
                  <td style={{color:"#aaa",fontSize:"11px"}}>{i+1}.</td>
                  <td style={{color:label?"#333":"#bbb",fontStyle:label?"normal":"italic"}}>{label||`Item ${i+1}`}</td>
                  <td><input className="amt" type="number" min="0" value={form.particulars[k]} onChange={e=>setP(k,e.target.value)} placeholder="—"/></td>
                </tr>
              ))}
              <tr className="trow">
                <td colSpan={2} style={{textAlign:"right",paddingRight:"12px",color:"#1b3d2a"}}>TOTAL (Ekunn Rupaye)</td>
                <td style={{textAlign:"right",color:"#1b3d2a"}}>₹ {total.toLocaleString("en-IN")}/-</td>
              </tr>
            </tbody>
          </table>
          <div style={{display:"flex",gap:"12px",marginTop:"18px",justifyContent:"flex-end",flexWrap:"wrap"}}>
            <button className="btn2" onClick={()=>setForm(f=>({...f,particulars:blankParticulars()}))}>Reset</button>
            <button className="btn1" onClick={handleSave}>Generate Receipt →</button>
          </div>
        </div>
      </>)}

      {/* ── RECORDS & AUDIT TAB ── */}
      {tab==="rec" && (
        <div className="card">
          <div className="sec">Records — Year / Month Folders</div>

          {/* Year selector */}
          <div className="folder-bar">
            <span style={{fontSize:"11px",color:"#888",fontWeight:600}}>YEAR:</span>
            {availYears.map(y=>(
              <div key={y} className={`folder-box${filterYear===y?" sel":""}`} onClick={()=>{setFilterYear(y);setFilterMonth("All");}}>
                📁 {y}
              </div>
            ))}
            {availYears.length===0&&<span style={{color:"#bbb",fontSize:"12px",fontStyle:"italic"}}>No records yet.</span>}
          </div>

          {filterYear && grouped[filterYear] && (<>
            {/* Month chips */}
            <div className="folder-bar" style={{marginBottom:"14px"}}>
              <span style={{fontSize:"11px",color:"#888",fontWeight:600}}>MONTH:</span>
              <span className={`month-chip${filterMonth==="All"?" sel":""}`} onClick={()=>setFilterMonth("All")}>All</span>
              {MONTHS.filter(m=>grouped[filterYear]?.[m]).map(m=>(
                <span key={m} className={`month-chip${filterMonth===m?" sel":""}`} onClick={()=>setFilterMonth(m)}>{m}</span>
              ))}
            </div>

            {/* Audit summary */}
            {(() => {
              const recs = filterMonth==="All" ? Object.values(grouped[filterYear]).flat() : (grouped[filterYear][filterMonth]||[]);
              const totalAmt = recs.reduce((s,r)=>s+getTotal(r.particulars),0);
              const byMode = recs.reduce((a,r)=>{a[r.paymentMode]=(a[r.paymentMode]||0)+1;return a;},{});
              return (
                <div className="audit-section">
                  <div className="audit-title">📊 Audit Summary — {filterYear} {filterMonth!=="All"?`/ ${filterMonth}`:""}</div>
                  <div className="stat-grid">
                    <div className="stat-box"><div className="stat-num">{recs.length}</div><div className="stat-lbl">Receipts</div></div>
                    <div className="stat-box"><div className="stat-num">₹{(totalAmt/1000).toFixed(1)}k</div><div className="stat-lbl">Total Collected</div></div>
                    <div className="stat-box"><div className="stat-num">{new Set(recs.map(r=>r.flatNo)).size}</div><div className="stat-lbl">Unique Flats</div></div>
                  </div>
                  <div style={{fontSize:"11px",color:"#666",display:"flex",gap:"12px",flexWrap:"wrap"}}>
                    {Object.entries(byMode).map(([m,c])=>(
                      <span key={m}><span className={`badge b-${m}`}>{m.toUpperCase()}</span> {c} receipt{c>1?"s":""}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Record rows */}
            {displayRecs.length===0
              ? <div style={{textAlign:"center",padding:"30px",color:"#bbb",fontStyle:"italic"}}>No records for this period.</div>
              : displayRecs.map((r,i)=>(
                <div key={i} className="rec-row">
                  <div>
                    <div style={{fontWeight:700,color:"#1b3d2a",fontSize:"13px"}}>#{r.receiptNo} · Flat {r.flatNo}</div>
                    <div style={{fontSize:"11px",color:"#888"}}>{r.memberName} · {r.forMonth} {r.forYear}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                    <span className={`badge b-${r.paymentMode}`}>{r.paymentMode.toUpperCase()}</span>
                    <span style={{fontWeight:700,color:"#1b3d2a",fontSize:"13px"}}>₹{getTotal(r.particulars).toLocaleString("en-IN")}/-</span>
                    <button onClick={()=>setShowReceipt(r)} style={{background:"#1b3d2a",color:"#fff",border:"none",borderRadius:"5px",padding:"4px 11px",fontSize:"11px",cursor:"pointer"}}>View</button>
                  </div>
                </div>
              ))
            }
          </>)}
        </div>
      )}

      {/* ── RECEIPT MODAL ── */}
      {showReceipt && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowReceipt(null);}}>
          <div className="rpaper">
            <div id="receipt-print-area" className="rinner">
              {/* Top note */}
              <div style={{textAlign:"right",fontSize:"8.5px",color:"#888",marginBottom:"5px"}}>Sthapana - March 2005</div>
              {/* Society header */}
              <div style={{display:"flex",alignItems:"flex-start",gap:"11px",marginBottom:"10px"}}>
                <div style={{width:"42px",height:"42px",borderRadius:"50%",border:"2px solid #1b3d2a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"16px",color:"#1b3d2a",flexShrink:0}}>K</div>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"15px",fontWeight:900,color:"#1b3d2a",lineHeight:1.2}}>कैदारनाथ को-ऑप. हौसिंग सोसायटी लिमिटेड</div>
                  <div style={{fontSize:"8.5px",color:"#555",marginTop:"2px",lineHeight:1.5}}>
                    Reg. No.: T.N.A./K.L.N./H.S.G./(T.C.)/ 16290 / Sn 04-04-2004<br/>
                    Office: Vasundri Cross Road, Manda, Titwala (W), Dist. Thane.
                  </div>
                </div>
              </div>
              <hr style={{border:"none",borderTop:"1.5px solid #1b3d2a",margin:"6px 0"}}/>

              {/* Receipt meta */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px",fontSize:"9.5px",marginBottom:"7px"}}>
                {[["Receipt No.", showReceipt.receiptNo],["Folio No.", showReceipt.folioNo||"—"],
                  ["Date", new Date(showReceipt.paymentDate+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"})]
                ].map(([l,v])=>(
                  <div key={l}><div style={{color:"#888",fontSize:"8px",textTransform:"uppercase"}}>{l}</div><div style={{fontWeight:700,color:"#1b3d2a"}}>{v}</div></div>
                ))}
              </div>
              <hr style={{border:"none",borderTop:"0.5px solid #ccc",margin:"5px 0"}}/>

              {/* Member */}
              <div style={{marginBottom:"6px",fontSize:"10px"}}>
                <span style={{fontSize:"8px",color:"#888",textTransform:"uppercase"}}>Flat No. / Member (Shri/Shrimati)</span>
                <div style={{fontWeight:700,fontSize:"12.5px",color:"#1b3d2a"}}>Flat {showReceipt.flatNo} — {showReceipt.memberName}</div>
              </div>

              <div style={{fontSize:"9.5px",color:"#555",marginBottom:"7px"}}>
                <strong style={{color:"#1b3d2a"}}>For Month:</strong> {showReceipt.forMonth} {showReceipt.forYear} &nbsp;|&nbsp;
                <strong style={{color:"#1b3d2a"}}>Mode:</strong> {showReceipt.paymentMode.toUpperCase()}
                {showReceipt.chequeNo&&<> | Chq: {showReceipt.chequeNo}</>}
                {showReceipt.bank&&<> | Bank: {showReceipt.bank}</>}
              </div>

              {/* Particulars table */}
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"10.5px",margin:"6px 0"}}>
                <thead>
                  <tr style={{background:"#1b3d2a",color:"#fff"}}>
                    <th style={{padding:"5px 8px",textAlign:"left",width:"24px"}}>#</th>
                    <th style={{padding:"5px 8px",textAlign:"left"}}>Tapshil (Particular)</th>
                    <th style={{padding:"5px 8px",textAlign:"right"}}>Rupaye</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(DEFAULT_PARTICULARS).map(([k,{label}],i)=>{
                    const val=parseFloat(showReceipt.particulars[k]);
                    if(!val) return null;
                    return (
                      <tr key={k} style={{borderBottom:"0.5px solid #e8e0d0"}}>
                        <td style={{padding:"4px 8px",color:"#aaa"}}>{i+1}.</td>
                        <td style={{padding:"4px 8px"}}>{label||`Item ${i+1}`}</td>
                        <td style={{padding:"4px 8px",textAlign:"right"}}>₹ {val.toLocaleString("en-IN")}/-</td>
                      </tr>
                    );
                  })}
                  <tr style={{background:"#f5f0e8",fontWeight:700,fontSize:"12px",borderTop:"1.5px solid #1b3d2a"}}>
                    <td colSpan={2} style={{padding:"6px 8px",textAlign:"right",color:"#1b3d2a"}}>Ekunn Rupaye (Total)</td>
                    <td style={{padding:"6px 8px",textAlign:"right",color:"#1b3d2a"}}>₹ {getTotal(showReceipt.particulars).toLocaleString("en-IN")}/-</td>
                  </tr>
                </tbody>
              </table>

              <hr style={{border:"none",borderTop:"0.5px solid #ccc",margin:"10px 0 6px"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",fontSize:"9px"}}>
                <div style={{color:"#555",lineHeight:1.7}}>
                  Subject to Realization of Cheque<br/>
                  <strong>Kedarnath Co-Op. Housing Society Ltd.</strong>
                </div>
                <div style={{textAlign:"center",marginTop:"24px"}}>
                  <div style={{width:"90px",borderTop:"1px solid #333",paddingTop:"3px",color:"#555"}}>Hon. Secretary / Chairperson</div>
                </div>
              </div>
            </div>

            <div className="ract">
              <button className="btn-pdf" onClick={()=>handleSavePDF(showReceipt)}>💾 Save as PDF</button>
              <button className="btn1" style={{fontSize:"13px",padding:"10px 18px"}} onClick={()=>window.print()}>🖨 Print</button>
              <button className="btn2" style={{fontSize:"12px",padding:"8px 14px"}} onClick={()=>{setShowReceipt(null);setTab("rec");}}>📁 Records</button>
              <button className="btn2" style={{fontSize:"12px",padding:"8px 14px"}} onClick={handleNewReceipt}>+ New</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
