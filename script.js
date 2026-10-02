/*
  Struktur:
  - item biasa = nomor utama
  - subitems = point a/b/c, TIDAK dianggap nomor checklist terpisah
  - subitems tetap bisa diberi hasil karena pada formulir asli ada tanda V di kolom hasil.
*/

const persiapan = [
  {num:"1", title:"Form Izin Kerja", options:["Ada","Tidak"]},
  {num:"2", title:"Ketersediaan Train Watcher", options:["Ada","Tidak"]},
  {num:"3", title:"Bendera Kerja", options:["Ada","Tidak"]},
  {num:"4", title:"APD Pekerja", options:["Ada","Tidak"]},
  {num:"5", title:"Pengukuran Suhu Rel", options:["≤ 45°C","> 45°C"]},
  {num:"6", title:"Dengan Semboyan", subitems:[
    {label:"a S2A", options:["Ada","Tidak ada"]},
    {label:"b S2B", options:["Ada","Tidak ada"]},
    {label:"c S3", options:["Ada","Tidak ada"]},
    {label:"d Lain-lain", text:true, placeholder:"... km/jam"}
  ]}
];

const akhir = [
  {num:"1", title:"Pemadatan", options:["Baik","Kurang Baik"]},
  {num:"2", title:"Pemeriksaan Geometri", options:["Baik","Kurang Baik"]},
  {num:"3", title:"Penambat", options:["Lengkap","Tidak"]},
  {num:"4", title:"Profil balas", subitems:[
    {label:"a isi balas antara bantalan", options:["Baik","Kurang Baik"]},
    {label:"b bahu balas ( min 15 cm)", options:["Baik","Kurang Baik"]}
  ]},
  {num:"5", title:"Taspat (penstabilan)", subitems:[
    {label:"a S2A", options:["Ada","Tidak ada"]},
    {label:"b S2B", options:["Ada","Tidak ada"]},
    {label:"c Lain-lain", text:true, placeholder:"... km/jam"}
  ]},
  {num:"6", title:"Laporan selesai pekerjaan", options:["Sudah","Belum"]}
];

function radioHTML(name, options) {
  return `<div class="options">${options.map((op,j) =>
    `<label><input type="radio" name="${name}" value="${op}"> ${op}</label>`
  ).join("")}</div>`;
}

function render(items, targetId, prefix) {
  const target = document.getElementById(targetId);
  target.innerHTML = "";

  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "item";

    let html = `<div class="item-title">${item.num}. ${item.title}</div>`;

    if (item.options) html += radioHTML(`${prefix}-${i}`, item.options);

    if (item.subitems) {
      html += `<div class="point-options">`;
      item.subitems.forEach((sub, j) => {
        html += `<div class="subitem"><div>${sub.label}</div>`;
        if (sub.text) {
          html += `<input id="${prefix}-${i}-sub-${j}-text" placeholder="${sub.placeholder}">`;
        } else {
          html += radioHTML(`${prefix}-${i}-sub-${j}`, sub.options);
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    div.innerHTML = html;
    target.appendChild(div);
  });
}

render(persiapan, "persiapan", "p");
render(akhir, "akhir", "a");

function checked(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function collect(items, prefix) {
  return items.map((item, i) => ({
    ...item,
    value: item.options ? checked(`${prefix}-${i}`) : "",
    subvalues: (item.subitems || []).map((sub, j) => ({
      label: sub.label,
      value: sub.text
        ? (document.getElementById(`${prefix}-${i}-sub-${j}-text`)?.value || "")
        : checked(`${prefix}-${i}-sub-${j}`)
    }))
  }));
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function pdfItemHTML(item) {
  let html = `<div class="row main">
    <div class="num">${esc(item.num)}</div>
    <div class="desc">${esc(item.title)}</div>
    <div class="choice">${item.value ? "✓ " + esc(item.value) : ""}</div>
  </div>`;

  (item.subvalues || []).forEach((sub, j) => {
    html += `<div class="row sub">
      <div class="num"></div>
      <div class="desc">${esc(sub.label)}</div>
      <div class="choice">${sub.value ? (sub.value === "✓" ? "✓" : esc(sub.value)) : ""}</div>
    </div>`;
  });

  return html;
}

function makeSection(title, items) {
  return `<h2>${esc(title)}</h2>
  <div class="checklist">
    <div class="columns"><div></div><div></div><div class="head">hasil</div></div>
    ${items.map(pdfItemHTML).join("")}
  </div>`;
}

function buatPDF() {
  const judul = document.getElementById("judul").value || "CHECKLIST PEKERJAAN";
  const wilayah = document.getElementById("wilayah").value;
  const nama = document.getElementById("nama").value;
  const nipp = document.getElementById("nipp").value;
  const catatan = document.getElementById("catatan").value;

  const P = collect(persiapan, "p");
  const A = collect(akhir, "a");

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${esc(judul)}</title>
  <style>
    @page { size:A4; margin:13mm 15mm; }
    * { box-sizing:border-box; }
    body { font-family:Arial,Helvetica,sans-serif; color:#000; font-size:11pt; }
    h1 { font-size:16pt; margin:0 0 15px; }
    h2 { font-size:12pt; font-weight:normal; margin:20px 0 7px; }
    .identity { margin-bottom:8px; }
    .identity div { display:grid; grid-template-columns:145px 12px 1fr; margin:3px 0; }
    .checklist { width:100%; }
    .columns, .row { display:grid; grid-template-columns:42px 1fr 190px; }
    .columns { font-weight:bold; min-height:5px; }
    .columns .head { text-align:center; }
    .row { min-height:27px; align-items:center; }
    .row.main .desc { font-weight:normal; }
    .row.sub .desc { padding-left:28px; }
    .row .choice { text-align:center; }
    .row.sub .choice { text-align:center; }
    .note { margin-top:18px; }
    button { padding:8px 15px; }
    @media print { .no-print { display:none; } }
  </style></head><body>
    <h1>${esc(judul)}</h1>
    <div class="identity">
      <div><span>Wilayah UPT</span><span>:</span><span>${esc(wilayah || "...")}</span></div>
      <div><span>Nama Pengawas</span><span>:</span><span>${esc(nama || "...")}</span></div>
      <div><span>NIPP Pengawas</span><span>:</span><span>${esc(nipp || "...")}</span></div>
    </div>
    ${makeSection("Persiapan", P)}
    ${makeSection("Pemeriksaan Akhir", A)}
    <div class="note"><b>Catatan:</b><br>${esc(catatan).replace(/\n/g,"<br>")}</div>
    <div class="no-print" style="margin-top:20px">
      <button onclick="window.print()">Cetak / Simpan sebagai PDF</button>
    </div>
  </body></html>`);
  win.document.close();
}
