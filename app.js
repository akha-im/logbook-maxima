/**
 * SISTEM LOGBOOK & LOGISTIK RADIOLOGI KLINIK MAXIMA
 * Client-Side JavaScript (app.js) - Integrasi API
 */

// =========================================================================
// [KONFIGURASI] API URL GOOGLE APPS SCRIPT WEB APP
// =========================================================================
// MASUKKAN URL HASIL DEPLOY APPS SCRIPT (WEB APP) ANDA DI SINI
const API_URL = "https://script.google.com/macros/s/AKfycbwr_F3sIngxdcukaFsX87wcpcEaOIChKKCftveF2hIYQYryfkDvx3WedIByg_NMoE3V/exec";

// =========================================================================
// [LOGIKA-100] VARIABEL GLOBAL & INISIALISASI (ONLOAD)
// =========================================================================
var currentCabang = ""; 
var currentRole = "";

function getBadgeCabang(cabang) {
    if (!cabang || cabang === "-") return "-";
    var c = cabang.toUpperCase().trim();
    var bg = "#334155";
    var color = "#fff";
    if (c.includes("KDI")) bg = "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    else if (c.includes("MKS")) bg = "#ef4444";
    else if (c.includes("BJM")) bg = "#76b900";
    else if (c.includes("PLU")) { bg = "#eab308"; color = "#000"; }
    else if (c.includes("GTO")) bg = "#166534";
    else if (c.includes("MND")) bg = "#f97316";
    else if (c.includes("LWK")) bg = "#ec4899";
    else if (c.includes("BHD") || c.includes("DIHD")) bg = "#8b4513";
    else if (c.includes("KLK")) bg = "#334155";
    else if (c.includes("MMJ")) bg = "linear-gradient(135deg, #000000, #6b7280)";
    else if (c.includes("PLK")) bg = "linear-gradient(135deg, #0ea5e9, #10b981)";
    else if (c.includes("BUB")) bg = "#ea580c";
    return '<span class="badge" style="background:' + bg + '; color:' + color + '; font-weight:700; padding:6px 10px; border-radius:6px; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">' + cabang + '</span>';
}

window.onload = function() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); 
  var yyyy = today.getFullYear();
  
  var dateToday = yyyy + '-' + mm + '-' + dd;
  var monthToday = yyyy + '-' + mm;
  
  if(document.getElementById('tanggalHarian')) { document.getElementById('tanggalHarian').value = dateToday; }
  if(document.getElementById('tanggalOrder')) { document.getElementById('tanggalOrder').value = dateToday; }
  if(document.getElementById('tanggalLaporServis')) { document.getElementById('tanggalLaporServis').value = dateToday; }
  if(document.getElementById('tanggalUpdateStok')) { document.getElementById('tanggalUpdateStok').value = dateToday; }
  if(document.getElementById('bulanPasien')) { document.getElementById('bulanPasien').value = monthToday; }
  if(document.getElementById('tahunAset')) { document.getElementById('tahunAset').value = yyyy; }
  if(document.getElementById('tahunTLD')) { document.getElementById('tahunTLD').value = yyyy; }
  if(document.getElementById('tahunMCU')) { document.getElementById('tahunMCU').value = yyyy; }
};

// =========================================================================
// [MESIN-API] HELPER KONEKSI KLIEN-SERVER (MENGHINDARI CORS PREFLIGHT)
// =========================================================================
async function callAPI(action, payload = {}) {
  try {
    // Tambahkan parameter waktu (cache buster) agar URL selalu unik
    var t = new Date().getTime();
    
    // 1. Jika Aksi adalah membaca (GET)
    if (action === "GET") {
      var url = new URL(API_URL);
      url.searchParams.append("action", payload.action);
      url.searchParams.append("t", t);
      if (payload.cabang) url.searchParams.append("cabang", payload.cabang);
      if (payload.role) url.searchParams.append("role", payload.role);
      
      var response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal mengambil data dari server: " + response.statusText);
      return await response.json();
    }
    
    // 2. Jika Aksi adalah menulis/mengubah (POST)
    // Kirim menggunakan Mime-type text/plain untuk menghindari CORS Preflight OPTIONS request
    var response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: action, ...payload }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Gagal mengirim data ke server: " + response.statusText);
    return await response.json();
  } catch (error) {
    console.error("API Error: ", error);
    throw error;
  }
}

// =========================================================================
// [LOGIKA-200] SISTEM AUTENTIKASI (LOGIN & LOGOUT)
// =========================================================================
function prosesLogin(e) {
  e.preventDefault(); 
  var btn = document.getElementById('btnLoginBtn');
  var alertBox = document.getElementById('loginAlert');
  var user = document.getElementById('loginUser').value;
  var pass = document.getElementById('loginPass').value;

  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa...';
  btn.disabled = true; 
  alertBox.style.display = 'none';

  callAPI("verifyLogin", { username: user, password: pass })
    .then(function(response) {
      if(response.success) {
        currentRole = response.role; 
        currentCabang = response.cabang;
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';

        if (currentRole === 'Cabang') {
          document.getElementById('menuDashboard').style.display = 'none';
          switchTab('harian-film', document.getElementById('menuHarian'));
          document.getElementById('displayRole').innerHTML = '<i class="fa-solid fa-user-circle"></i> Cabang: ' + currentCabang;
          
          var filter = document.getElementById('filterDashboard');
          if (filter) { filter.value = currentCabang; filter.disabled = true; }
        } 
        else if (currentRole === 'TEKNISI') {
          document.getElementById('displayRole').innerHTML = '<i class="fa-solid fa-wrench"></i> Teknisi Logistik';
          
          document.getElementById("menuDashboard").style.display = "none";
          document.getElementById("menuHarian").style.display = "none";
          document.getElementById("menuLogbook").style.display = "none";
          document.getElementById("menuStok").style.display = "none";
          document.getElementById("menuMCU").style.display = "none";
          document.getElementById("menuLogbookManual").style.display = "none";
          document.getElementById("menuSIP").style.display = "none";
          document.getElementById("menuSOP").style.display = "none";
          
          switchTab('status-pengiriman', document.getElementById('menuPengiriman'));
        } 
        else { 
          document.getElementById('menuDashboard').style.display = 'block';
          switchTab('dashboard', document.getElementById('menuDashboard'));
          document.getElementById('displayRole').innerHTML = '<i class="fa-solid fa-user-shield"></i> Admin Pusat';
          document.getElementById('menuAlatMCU').style.display = 'block';
          
          var filter = document.getElementById('filterDashboard');
          if (filter) { filter.value = "ALL"; filter.disabled = false; }
        }
        
        setTimeout(initDashboardChart, 500); 
        setTimeout(refreshDashboard, 800);
      } else {
        alertBox.innerHTML = response.message; 
        alertBox.style.display = 'block';
        btn.innerHTML = 'Masuk <i class="fa-solid fa-arrow-right"></i>'; 
        btn.disabled = false;
      }
    })
    .catch(function(error) {
      alertBox.innerHTML = "Gagal terhubung ke server API. Pastikan URL Apps Script benar."; 
      alertBox.style.display = 'block';
      btn.innerHTML = 'Masuk <i class="fa-solid fa-arrow-right"></i>'; 
      btn.disabled = false;
    });
}

function logout() {
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('formLogin').reset();
  currentCabang = ""; 
  currentRole = "";
}

// =========================================================================
// [LOGIKA-300] NAVIGASI & TAMPILAN
// =========================================================================
function switchTab(tabId, element) {
  var links = document.querySelectorAll('.sidebar .nav-link');
  links.forEach(function(link) {
    link.classList.remove('active');
  });
  element.classList.add('active');
  
  var sections = document.querySelectorAll('.content-section');
  sections.forEach(function(section) {
    section.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
}

function toggleNamaBarang() {
  var kategori = document.getElementById('kategoriOrder').value;
  var inputText = document.getElementById('namaBarangText');
  var inputSelect = document.getElementById('namaBarangSelect');
  
  if (kategori === 'Film') {
    inputText.classList.add('d-none'); 
    inputText.required = false;
    inputSelect.classList.remove('d-none'); 
    inputSelect.required = true;
  } else {
    inputSelect.classList.add('d-none'); 
    inputSelect.required = false;
    inputText.classList.remove('d-none'); 
    inputText.required = true; 
    inputText.value = ''; 
  }
}

// =========================================================================
// [LOGIKA-400] DASHBOARD UTAMA & GRAFIK (CHART.JS)
// =========================================================================
let chartInstance = null;
let masterData = { 
  labels: ['MXM-KDI', 'MXM-MKS', 'MXM-PLU', 'MXM-GTO', 'MXM-MND', 'MXM-LWK', 'MXM-BHD', 'MXM-BUB', 'MXM-BJM'], 
  pasien: [0, 0, 0, 0, 0, 0, 0, 0, 0], 
  film: [0, 0, 0, 0, 0, 0, 0, 0, 0], 
  totalOrder: 0, 
  totalCR: 0, 
  stokRendah: [], 
  tabelData: { harian: [], order: [], inventori: [], perijinan: [], logbook: [] }
};

function initDashboardChart() {
  const canvas = document.getElementById('chartPemakaian');
  if(!canvas) return; 
  const ctx = canvas.getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  chartInstance = new Chart(ctx, {
    type: 'bar', 
    data: { 
      labels: masterData.labels, 
      datasets: [
        { 
          label: 'Total Pasien', 
          backgroundColor: '#6366f1', 
          borderColor: '#4f46e5',
          borderWidth: 1,
          data: masterData.pasien 
        }, 
        { 
          label: 'Pemakaian Film (Lbr)', 
          backgroundColor: '#0ea5e9', 
          borderColor: '#0284c7',
          borderWidth: 1,
          data: masterData.film 
        }
      ] 
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { 
        legend: { labels: { color: '#0f172a', font: { family: 'Outfit', weight: 'bold' } } } 
      },
      scales: {
        x: { grid: { color: 'rgba(15, 23, 42, 0.08)' }, ticks: { color: '#475569', font: { family: 'Outfit' } } },
        y: { grid: { color: 'rgba(15, 23, 42, 0.08)' }, ticks: { color: '#475569', font: { family: 'Outfit' } } }
      }
    }
  });
}

function refreshDashboard() {
  var btn = document.getElementById('btnRefresh');
  if(btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memuat...';
    btn.disabled = true;
  }

  window.memoriTabel = {}; // Hapus cache lokal

  // TAHAP 1: Ambil data ringkasan dashboard (GET request)
  callAPI("GET", { action: "getDashboardData" })
    .then(function(response) {
      masterData.labels = (response.chart.labels || masterData.labels).map(function(l) { return l === "MXM-GTL" ? "MXM-GTO" : l; });
      masterData.pasien = response.chart.pasien;
      masterData.film = response.chart.film;
      masterData.totalOrder = response.ringkasan.order;
      masterData.totalCR = response.ringkasan.cr;
      masterData.stokRendah = response.stokRendah;
      masterData.tabelData = response.tabelData;
      
      var selFilter = document.getElementById('filterDashboard');
      if (selFilter && masterData.labels.length > 0) {
        var curr = selFilter.value;
        selFilter.innerHTML = '<option value="ALL">📍 Tampilkan Keseluruhan (Semua Cabang)</option>';
        masterData.labels.forEach(function(cbg) {
          var nama = "🏢 " + cbg;
          if(cbg==="MXM-KDI") nama += " (Kendari)";
          else if(cbg==="MXM-MKS") nama += " (Makassar)";
          else if(cbg==="MXM-PLU") nama += " (Palu)";
          else if(cbg==="MXM-GTO" || cbg==="MXM-GTL") nama += " (Gorontalo)";
          else if(cbg==="MXM-MND") nama += " (Manado)";
          else if(cbg==="MXM-LWK") nama += " (Luwuk)";
          else if(cbg==="MXM-BHD") nama += " (Bahodopi)";
          else if(cbg==="MXM-BUB") nama += " (Bau-Bau)";
          else if(cbg==="MXM-BJM") nama += " (Banjarmasin)";
          else if(cbg==="MXM-KLK") nama += " (Kolaka)";
          else if(cbg==="MXM-MMJ") nama += " (Mamuju)";
          else if(cbg==="MXM-PLK") nama += " (Palangkaraya)";
          selFilter.innerHTML += '<option value="'+cbg+'">'+nama+'</option>';
        });
        if (masterData.labels.indexOf(curr) !== -1 || curr === 'ALL') selFilter.value = curr;
      }
      
      updateDashboardView();
      
      if(btn) { 
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Berhasil'; 
        setTimeout(function() { 
          btn.innerHTML = '<i class="fa-solid fa-arrows-rotate me-2"></i> Refresh'; 
          btn.disabled = false; 
        }, 1500); 
      }

      // TAHAP 2: Tarik sisa data di latar belakang
      if (currentRole !== "") {
        muatDataLatarBelakang();
      }
    })
    .catch(function(err) { 
      console.error(err);
      if(btn) { 
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Gagal'; 
        setTimeout(function() { 
          btn.disabled = false; 
          btn.innerHTML = '<i class="fa-solid fa-arrows-rotate me-2"></i> Refresh';
        }, 3000); 
      } 
    });
}

function muatDataLatarBelakang() {
  console.log("Dashboard selesai. Memulai sinkronisasi tabel di latar belakang...");
  setTimeout(function() { panggilJikaBelum('harian', function(){ loadHarianData(); }); }, 1000);
  setTimeout(function() { panggilJikaBelum('stok', function(){ loadStokData(); }); }, 2000);
  setTimeout(function() { panggilJikaBelum('logbook', function(){ loadLogbookPasienData(); }); }, 3000);
  setTimeout(function() { panggilJikaBelum('order', function(){ loadOrderData(); }); }, 4000);
  setTimeout(function() { panggilJikaBelum('servis', function(){ loadServisData(); }); }, 5000);
  setTimeout(function() { panggilJikaBelum('inventori', function(){ loadInventoriData(); }); }, 6000);
  setTimeout(function() { panggilJikaBelum('tld', function(){ loadTldData(); }); }, 7000);
  setTimeout(function() { panggilJikaBelum('mcu', function(){ loadMcuData(); }); }, 8000);
  setTimeout(function() { panggilJikaBelum('pengiriman', function(){ muatHistoriPengiriman(); }); }, 9000);
  setTimeout(function() { panggilJikaBelum('sip', function(){ muatDataSIP(); }); }, 10000);
}

// SISTEM MEMORI CACHE LOKAL
window.memoriTabel = window.memoriTabel || {}; 
function panggilJikaBelum(kunciMenu, fungsiPenarikData) {
  if (!window.memoriTabel[kunciMenu]) {
    window.memoriTabel[kunciMenu] = true; 
    console.log("ðŸ“¥ MENARIK DATA DARI SERVER: " + kunciMenu);
    if (typeof fungsiPenarikData === "function") {
      fungsiPenarikData();
    }
  } else {
    console.log("âš¡ MEMAKAI MEMORI CACHE: " + kunciMenu);
  }
}

function updateDashboardView() {
  var filter = document.getElementById('filterDashboard').value;
  var idx = masterData.labels.indexOf(filter);
  
  if(document.getElementById('badgeOrder')) {
    document.getElementById('badgeOrder').innerText = masterData.totalOrder;
  }

  if(document.getElementById('dashTotalPasien')) {
    var sumPasien = (filter === 'ALL') ? masterData.pasien.reduce((a,b)=>a+b, 0) : masterData.pasien[idx];
    document.getElementById('dashTotalPasien').innerHTML = sumPasien + ' <span class="fs-6 text-success"><i class="fa-solid fa-user"></i> Pasien</span>';
  }

  if(document.getElementById('dashTotalFilm')) {
    var sumFilm = (filter === 'ALL') ? masterData.film.reduce((a,b)=>a+b, 0) : masterData.film[idx];
    document.getElementById('dashTotalFilm').innerHTML = sumFilm + ' <span class="fs-6 text-danger"><i class="fa-solid fa-film"></i> Lembar</span>';
  }

  if(document.getElementById('dashTotalOrder')) {
    document.getElementById('dashTotalOrder').innerHTML = (filter === 'ALL' ? masterData.totalOrder : '-') + ' <span class="fs-6 text-muted">Items</span>';
  }

  if(document.getElementById('dashTotalCR')) {
    document.getElementById('dashTotalCR').innerHTML = (filter === 'ALL' ? masterData.totalCR : '-') + ' <span class="fs-6 text-muted">Cabang</span>';
  }
  
  if(chartInstance) { 
    chartInstance.data.labels = (filter === 'ALL') ? masterData.labels : [masterData.labels[idx]]; 
    chartInstance.data.datasets[0].data = (filter === 'ALL') ? masterData.pasien : [masterData.pasien[idx]]; 
    chartInstance.data.datasets[1].data = (filter === 'ALL') ? masterData.film : [masterData.film[idx]]; 
    chartInstance.update(); 
  }

  try {
    if (masterData && masterData.tabelData) {
      cekPeringatanSistem(masterData.tabelData.stok, masterData.tabelData.perijinan);
    }
  } catch (e) {
    console.log("Peringatan sistem ditunda: " + e);
  }

  renderTabelDashboard(filter);
  renderTabelLogbook(); 
}

function renderTabelDashboard(filter) {
  // 1. Render Peringatan Stok
  var tbodyStok = document.querySelector('#tabelStokRendahDash tbody');
  if(tbodyStok) { 
    tbodyStok.innerHTML = ''; 
    var filtStok = masterData.stokRendah.filter(function(s) {
      return filter === 'ALL' || s.cabang === filter;
    });
    
    if(filtStok.length === 0) {
      tbodyStok.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-2">Stok film cabang aman.</td></tr>';
    } else {
      filtStok.forEach(function(s) {
        var classBadge = (s.sisaBox <= 3.0) ? 'badge-glow-danger' : 'badge-glow-success';
        var textStatus = (s.sisaBox <= 3.0) ? 'Waktunya Order' : 'Aman';
        
        tbodyStok.innerHTML += '<tr>' +
          '<td class="text-center">' + getBadgeCabang(s.cabang) + '</td>' +
          '<td>' + s.jenis + '</td>' +
          '<td><span class="fw-bold text-primary">' + s.sisaBox + ' Box</span><br><small class="text-muted">(' + s.sisaLembar + ' lbr)</small></td>' +
          '<td><span class="badge ' + classBadge + '">' + textStatus + '</span></td>' +
        '</tr>';
      });
    }
  }

  // 2. Render Tabel Harian
  var tbodyHarian = document.querySelector('#tabelHarianDash tbody');
  if (tbodyHarian) {
    tbodyHarian.innerHTML = '';
    var dataHarian = masterData.tabelData.harian;
    
    if (!dataHarian || dataHarian.length === 0) {
      tbodyHarian.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Tidak ada data laporan harian.</td></tr>';
    } else {
      dataHarian.forEach(function(row) {
        if(filter === 'ALL' || row.cabang === filter) {
          tbodyHarian.innerHTML += '<tr>' +
            '<td>' + row.tanggal + '</td>' +
            '<td class="text-center">' + getBadgeCabang(row.cabang) + '</td>' +
            '<td>' + row.jenisFilm + '</td>' +
            '<td>' + row.p1 + '</td>' +
            '<td>' + row.p2 + '</td>' +
            '<td class="fw-bold text-success">' + row.terpakai + '</td>' +
            '<td class="fw-bold text-danger">' + row.rijek + '</td>' +
            '<td class="text-start"><small>' + row.ket + '</small></td>' +
          '</tr>';
        }
      });
    }
  }

  // 3. Render Tabel Order
  var tbodyOrder = document.querySelector('#tabelOrderDash tbody');
  if (tbodyOrder) {
    tbodyOrder.innerHTML = '';
    var dataOrder = masterData.tabelData.order;
    
    if (!dataOrder || dataOrder.length === 0) {
      tbodyOrder.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Tidak ada antrian order logistik.</td></tr>';
    } else {
      dataOrder.forEach(function(row) {
        if(filter === 'ALL' || row.cabang === filter) {
          var badgeClass = (row.status === "Pending") ? "badge-glow-warning" : "badge-glow-success";
          tbodyOrder.innerHTML += '<tr>' +
            '<td>' + row.tanggal + '</td>' +
            '<td class="text-center">' + getBadgeCabang(row.cabang) + '</td>' +
            '<td>' + row.kategori + '</td>' +
            '<td class="text-start">' + row.nama + '</td>' +
            '<td class="fw-bold text-primary">' + row.jumlah + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + row.status + '</span></td>' +
          '</tr>';
        }
      });
    }
  }

  // 4. Render Tabel Aset
  var tbodyInv = document.querySelector('#tabelInventoriDash tbody');
  if (tbodyInv) {
    tbodyInv.innerHTML = '';
    var dataInv = masterData.tabelData.inventori;
    
    if (!dataInv || dataInv.length === 0) {
      tbodyInv.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Database aset kosong.</td></tr>';
    } else {
      dataInv.forEach(function(row) {
        if(filter === 'ALL' || row.cabang === filter) {
          var condColor = "badge-glow-success";
          if (row.kondisi.indexOf("Ringan") !== -1) condColor = "badge-glow-warning";
          if (row.kondisi.indexOf("Berat") !== -1) condColor = "badge-glow-danger";
          
          tbodyInv.innerHTML += '<tr>' +
            '<td class="text-center">' + getBadgeCabang(row.cabang) + '</td>' +
            '<td>' + row.kategori + '</td>' +
            '<td class="fw-bold text-start">' + row.merk + '</td>' +
            '<td>' + row.sn + '</td>' +
            '<td>' + row.tahun + '</td>' +
            '<td><span class="badge ' + condColor + '">' + row.kondisi + '</span></td>' +
          '</tr>';
        }
      });
    }
  }

  // 5. Render Tabel Perizinan
  var tbodyIjin = document.querySelector('#tabelPerijinanDash tbody');
  if (tbodyIjin) {
    tbodyIjin.innerHTML = '';
    var dataIjin = masterData.tabelData.perijinan;
    
    if (!dataIjin || dataIjin.length === 0) {
      tbodyIjin.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-3">Data perizinan kosong.</td></tr>';
    } else {
      var hariIni = new Date();
      hariIni.setHours(0, 0, 0, 0);

      dataIjin.forEach(function(row) {
        if(filter === 'ALL' || row.cabang === filter) {
          var teksStatus = row.status ? String(row.status).toUpperCase() : "-";
          var statusColor = "badge-glow-success";
          
          if (teksStatus.includes("MENDEKATI")) {
            statusColor = "badge-glow-warning";
          } else if (teksStatus.includes("EXPIRED") || teksStatus.includes("MATI") || teksStatus.includes("TIDAK AKTIF")) {
            statusColor = "badge-glow-danger";
          }

          function parseDateIndo(tgl) {
            var d = new Date(tgl);
            if (!isNaN(d.getTime())) return d;
            var parts = tgl.split(/[\/\-]/);
            if (parts.length === 3) {
              var y = parseInt(parts[2], 10);
              if (y < 100) y += 2000;
              return new Date(y, parts[1] - 1, parts[0]);
            }
            return new Date("invalid");
          }

          var classKtunExp = "fw-bold text-success";
          if (row.tglExp && row.tglExp !== "-") {
            var dateKtun = parseDateIndo(row.tglExp);
            if (!isNaN(dateKtun.getTime()) && dateKtun < hariIni) classKtunExp = "text-danger fw-bold";
          }

          var classUkesExp = "fw-bold text-success";
          if (row.tglExpUkes && row.tglExpUkes !== "-") {
            var dateUkes = parseDateIndo(row.tglExpUkes);
            if (!isNaN(dateUkes.getTime()) && dateUkes < hariIni) classUkesExp = "text-danger fw-bold";
          }
          
          var tombolLinkIzin = row.link && row.link !== "" ? `<a href="${row.link}" target="_blank" class="btn btn-sm btn-outline-warning fw-bold"><i class="fa-solid fa-folder-open"></i> Buka</a>` : "-";
          
          tbodyIjin.innerHTML += '<tr>' +
            '<td class="text-center">' + getBadgeCabang(row.cabang) + '</td>' +
            '<td>' + (row.ktun || "-") + '</td>' +
            '<td>' + (row.pesawat || "-") + '</td>' +
            '<td>' + (row.merk || "-") + '</td>' +
            '<td>' + (row.tglTerbit || "-") + '</td>' +
            '<td class="' + classKtunExp + '">' + (row.tglExp || "-") + '</td>' + 
            '<td>' + (row.tglUkes || "-") + '</td>' +
            '<td class="' + classUkesExp + '">' + (row.tglExpUkes || "-") + '</td>' + 
            '<td><span class="badge ' + statusColor + '">' + (row.status || "-") + '</span></td>' +
            '<td>' + tombolLinkIzin + '</td>' +
          '</tr>';
        }
      });
    }
  }
}

function renderTabelLogbook() {
  var tbodyLogbook = document.querySelector('#tabelRekapLogbookDash tbody');
  if (!tbodyLogbook) return;
  
  var filterCabang = document.getElementById('filterDashboard').value;
  var filterBulan = document.getElementById('filterBulanLogbook').value; 
  
  tbodyLogbook.innerHTML = '';
  var dataLogbook = masterData.tabelData.logbook;
  
  if (!dataLogbook || dataLogbook.length === 0) {
    tbodyLogbook.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Data logbook bulanan kosong.</td></tr>';
    return;
  }

  var adaData = false;
  dataLogbook.forEach(function(row) {
    var cocokCabang = (filterCabang === 'ALL' || row.cabang === filterCabang);
    var cocokBulan = (filterBulan === '' || row.bulan === filterBulan);
    
    if (cocokCabang && cocokBulan) {
      adaData = true;
      var rasio = (row.pasien > 0) ? (row.ekspose / row.pasien).toFixed(2) : 0;
      var warnaRasio = (rasio > 1.5) ? "text-danger fw-bold" : "text-success fw-bold"; 
      
      tbodyLogbook.innerHTML += '<tr>' +
        '<td class="fw-bold">' + row.bulan + '</td>' +
        '<td class="text-center">' + getBadgeCabang(row.cabang) + '</td>' +
        '<td class="fw-bold fs-6">' + row.pasien + '</td>' +
        '<td class="fw-bold fs-6 text-primary">' + row.ekspose + '</td>' +
        '<td class="' + warnaRasio + '">' + rasio + ' lbr/pasien</td>' +
      '</tr>';
    }
  });

  if (!adaData) {
    tbodyLogbook.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Tidak ditemukan data logbook.</td></tr>';
  }
}

// =========================================================================
// [LOGIKA-500] PENGIRIMAN DATA FORMULIR (SUBMIT HANDLERS)
// =========================================================================
function onSimpanSukses(btnId, notifId, formId, textAwal, iconAwal) {
  var btn = document.getElementById(btnId); 
  var notif = document.getElementById(notifId);
  
  btn.innerHTML = '<i class="' + iconAwal + '"></i> ' + textAwal; 
  btn.disabled = false;
  
  notif.innerHTML = '<div class="alert alert-success mt-2"><i class="fa-solid fa-circle-check"></i> Data berhasil disimpan ke Google Sheets!</div>'; 
  notif.style.display = 'block';
  
  document.getElementById(formId).reset(); 
  window.onload(); // Reset tanggal ke hari ini
  
  if(formId === 'formOrder') { toggleNamaBarang(); }
  
  setTimeout(function() { notif.style.display = 'none'; }, 4000); 
  setTimeout(refreshDashboard, 1000);
}

function onSimpanError(error, btnId, textAwal, iconAwal) {
  var btn = document.getElementById(btnId); 
  btn.innerHTML = '<i class="' + iconAwal + '"></i> ' + textAwal; 
  btn.disabled = false;
  alert("Gagal menyimpan data!\nKoneksi API Error: " + error.message);
}

function submitHarian(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitHarian'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; 
  document.getElementById(btnId).disabled = true;
  
  var data = { 
    cabang: currentCabang, 
    tanggal: document.getElementById('tanggalHarian').value, 
    jenisFilm: document.getElementById('jenisFilmHarian').value, 
    pasien1: document.getElementById('pasien1Lembar').value, 
    pasien2: document.getElementById('pasien2Lembar').value, 
    terpakaiNormal: document.getElementById('terpakaiNormal').value, 
    rijekRusak: document.getElementById('rijekRusak').value, 
    keterangan: document.getElementById('keteranganRijek').value 
  };
  
  callAPI("simpanHarian", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifHarian', 'formHarian', 'Simpan Laporan Harian', 'fa-solid fa-paper-plane'); 
      loadHarianData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Simpan Laporan Harian', 'fa-solid fa-paper-plane'); 
    });
}

function submitStok(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitStok'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; 
  document.getElementById(btnId).disabled = true;
  
  var data = { 
    cabang: currentCabang, 
    tanggalStok: document.getElementById('tanggalUpdateStok').value, 
    jenisFilm: document.getElementById('jenisFilmStok').value, 
    filmMasuk: document.getElementById('filmMasuk').value, 
    stokTerkini: document.getElementById('stokTerkini').value 
  };
  
  callAPI("simpanStok", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifStok', 'formStok', 'Simpan Data Opname (Kalkulasi Otomatis)', 'fa-solid fa-floppy-disk'); 
      loadStokData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Simpan Data Opname (Kalkulasi Otomatis)', 'fa-solid fa-floppy-disk'); 
    });
}

function submitPasien(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitPasien'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; 
  document.getElementById(btnId).disabled = true;
  
  var rows = document.querySelectorAll('#bodyLogbookPasien tr');
  var data = { 
    cabang: currentCabang, 
    bulan: document.getElementById('bulanPasien').value, 
    thoraksP: rows[0].getElementsByTagName('input')[0].value, 
    thoraksE: rows[0].getElementsByTagName('input')[1].value, 
    musculoP: rows[1].getElementsByTagName('input')[0].value, 
    musculoE: rows[1].getElementsByTagName('input')[1].value, 
    dentalP: rows[2].getElementsByTagName('input')[0].value, 
    dentalE: rows[2].getElementsByTagName('input')[1].value, 
    panoramicP: rows[3].getElementsByTagName('input')[0].value, 
    panoramicE: rows[3].getElementsByTagName('input')[1].value, 
    ctscanP: rows[4].getElementsByTagName('input')[0].value, 
    ctscanE: rows[4].getElementsByTagName('input')[1].value 
  };
  
  callAPI("simpanPasien", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifPasien', 'formPasien', 'Simpan Data Rekap Bulanan', 'fa-solid fa-save'); 
      loadLogbookPasienData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Simpan Data Rekap Bulanan', 'fa-solid fa-save'); 
    });
}

function submitOrder(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitOrder'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...'; 
  document.getElementById(btnId).disabled = true;
  
  var kat = document.getElementById('kategoriOrder').value; 
  var nama = (kat === 'Film') ? document.getElementById('namaBarangSelect').value : document.getElementById('namaBarangText').value;
  var data = { 
    cabang: currentCabang, 
    tanggal: document.getElementById('tanggalOrder').value, 
    kategori: kat, 
    namaBarang: nama, 
    jumlah: document.getElementById('jumlahOrder').value, 
    satuan: document.getElementById('satuanOrder').value, 
    keterangan: document.getElementById('keteranganOrder').value 
  };
  
  callAPI("simpanOrder", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifOrder', 'formOrder', 'Kirim Pengajuan Order', 'fa-solid fa-paper-plane'); 
      loadOrderData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Kirim Pengajuan Order', 'fa-solid fa-paper-plane'); 
    });
}

function submitServis(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitServis'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...'; 
  document.getElementById(btnId).disabled = true;
  
  var data = { 
    cabang: currentCabang, 
    tanggal: document.getElementById('tanggalLaporServis').value, 
    kategoriAlat: document.getElementById('kategoriAlatServis').value, 
    idAlat: document.getElementById('idAlatServis').value, 
    detail: document.getElementById('detailKerusakan').value, 
    urgensi: document.getElementById('urgensiServis').value 
  };
  
  callAPI("simpanServis", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifServis', 'formServis', 'Kirim Tiket Servis', 'fa-solid fa-triangle-exclamation'); 
      loadServisData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Kirim Tiket Servis', 'fa-solid fa-triangle-exclamation'); 
    });
}

function submitInventori(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitInventori'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; 
  document.getElementById(btnId).disabled = true;
  
  var data = { 
    cabang: currentCabang, 
    kategori: document.getElementById('kategoriAset').value, 
    merk: document.getElementById('merkAset').value, 
    sn: document.getElementById('snAset').value, 
    tahun: document.getElementById('tahunAset').value, 
    kondisi: document.getElementById('kondisiAset').value,
    keterangan: document.getElementById('keteranganAsetForm') ? document.getElementById('keteranganAsetForm').value : ""
  };
  
  callAPI("simpanInventori", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifInventori', 'formInventori', 'Simpan Aset Baru ke Database', 'fa-solid fa-save'); 
      loadInventoriData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Simpan Aset Baru ke Database', 'fa-solid fa-save'); 
    });
}

function submitTLD(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitTLD'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; 
  document.getElementById(btnId).disabled = true;
  
  var data = { 
    cabang: currentCabang, 
    periode: document.getElementById('periodeTLD').value, 
    tahun: document.getElementById('tahunTLD').value, 
    namaPetugas: document.getElementById('namaPetugasTLD').value, 
    dosis: document.getElementById('dosisTLD').value, 
    keterangan: document.getElementById('keteranganTLD').value 
  };
  
  callAPI("simpanTLD", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifTLD', 'formTLD', 'Simpan Data TLD', 'fa-solid fa-save'); 
      loadTldData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Simpan Data TLD', 'fa-solid fa-save'); 
    });
}

function submitMCU(e) {
  e.preventDefault(); 
  var btnId = 'btnSubmitMCU'; 
  document.getElementById(btnId).innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; 
  document.getElementById(btnId).disabled = true;
  
  var data = { 
    cabang: currentCabang, 
    namaPetugas: document.getElementById('namaPetugasMCU').value, 
    tahunMCU: document.getElementById('tahunMCU').value, 
    tanggalMCU: document.getElementById('tanggalMCU').value, 
    tempatMCU: document.getElementById('tempatMCU').value, 
    hasilMCU: document.getElementById('hasilMCU').value, 
    keterangan: document.getElementById('keteranganMCU').value 
  };
  
  callAPI("simpanMCU", { data: data })
    .then(function() { 
      onSimpanSukses(btnId, 'notifMCU', 'formMCU', 'Simpan Riwayat MCU', 'fa-solid fa-save'); 
      loadMcuData(); 
    })
    .catch(function(err) { 
      onSimpanError(err, btnId, 'Simpan Riwayat MCU', 'fa-solid fa-save'); 
    });
}

// =========================================================================
// [LOGIKA-600] FUNGSI PENARIK DATA HISTORI MINI SECARA INDIVIDU
// =========================================================================
function getCabFilter() { 
  return (currentRole !== 'Cabang') ? "ALL" : currentCabang; 
}

function loadHarianData() {
  var tb = document.querySelector('#tabelMiniHarian tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getHarian", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada histori harian.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) { 
          tb.innerHTML += '<tr>' +
            '<td>' + r.tanggal + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td class="fw-bold">' + r.jenis + '</td>' +
            '<td>' + r.p1 + '</td>' +
            '<td>' + r.p2 + '</td>' +
            '<td class="text-success fw-bold">' + r.terpakai + '</td>' +
            '<td class="text-danger fw-bold">' + r.rijek + '</td>' +
            '<td class="text-start"><small>' + r.ket + '</small></td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadLogbookPasienData() {
  var tb = document.querySelector('#tabelMiniLogbookPasien tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getLogbook", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada histori logbook bulanan.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) { 
          tb.innerHTML += '<tr>' +
            '<td class="fw-bold">' + r.bulan + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td>' + r.thoraks + '</td>' +
            '<td>' + r.musculo + '</td>' +
            '<td>' + r.dental + '</td>' +
            '<td>' + r.panoramic + '</td>' +
            '<td>' + r.ctscan + '</td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadTldData() {
  var tb = document.querySelector('#tabelMiniTLD tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getTld", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada laporan TLD petugas.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) { 
          var c = "badge-glow-success"; 
          if(r.keterangan.indexOf("Mendekati") !== -1) { c = "badge-glow-warning"; }
          if(r.keterangan.indexOf("Overexposure") !== -1 || r.keterangan.indexOf("Melebihi") !== -1) { c = "badge-glow-danger"; }
          
          var aksiBtn = "";
          if (r.linkArsip) {
            aksiBtn = '<a href="' + r.linkArsip + '" target="_blank" class="btn btn-sm btn-outline-success fw-bold" style="font-size: 0.75rem"><i class="fa-solid fa-eye"></i> Lihat</a>';
          } else {
            aksiBtn = '<button class="btn btn-sm btn-outline-warning text-dark fw-bold" style="font-size: 0.75rem" onclick="bukaModalUploadTLD(\'' + r.id + '\', \'' + r.cabang + '\')"><i class="fa-solid fa-upload"></i> Upload</button>';
          }
          
          tb.innerHTML += '<tr>' +
            '<td class="fw-bold text-start text-dark">' + r.nama + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td>' + r.periode + '</td>' +
            '<td>' + r.tahun + '</td>' +
            '<td class="fw-bold text-primary">' + r.dosis + ' mSv</td>' +
            '<td><span class="badge ' + c + '">' + r.keterangan + '</span></td>' +
            '<td>' + aksiBtn + '</td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadMcuData() {
  var tb = document.querySelector('#tabelMiniMCU tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getMcu", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada data MCU petugas.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) { 
          var c = "badge-glow-success"; 
          if(r.hasil.indexOf("Catatan") !== -1) { c = "badge-glow-warning"; }
          if(r.hasil.indexOf("Unfit") !== -1) { c = "badge-glow-danger"; }
          
          var aksiBtn = "";
          if (r.linkArsip) {
            aksiBtn = '<a href="' + r.linkArsip + '" target="_blank" class="btn btn-sm btn-outline-success fw-bold" style="font-size: 0.75rem"><i class="fa-solid fa-eye"></i> Lihat</a>';
          } else {
            aksiBtn = '<button class="btn btn-sm btn-outline-danger text-dark fw-bold" style="font-size: 0.75rem" onclick="bukaModalUploadMCU(\'' + r.id + '\', \'' + r.cabang + '\')"><i class="fa-solid fa-upload"></i> Upload</button>';
          }
          
          tb.innerHTML += '<tr>' +
            '<td class="fw-bold text-start text-dark">' + r.nama + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td>' + r.tanggal + '</td>' +
            '<td>' + r.tempat + '</td>' +
            '<td><span class="badge ' + c + '">' + r.hasil + '</span></td>' +
            '<td class="text-start"><small>' + r.ket + '</small></td>' +
            '<td>' + aksiBtn + '</td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadInventoriData() {
  var tb = document.querySelector('#tabelMiniInventori tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getInventori", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Database aset kosong.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) { 
          var c = "badge-glow-success"; 
          if(r.kondisi.indexOf("Ringan") !== -1) { c = "badge-glow-warning"; }
          if(r.kondisi.indexOf("Berat") !== -1) { c = "badge-glow-danger"; }

          var catatanText = "-";
          if (r.keterangan && r.keterangan.trim() !== "") {
             catatanText = `<div class="text-start text-muted" style="font-size: 0.75rem; max-width: 200px; white-space: pre-wrap; font-style: italic;">"${r.keterangan}"</div>`;
          }

          var aksiBtn = "";
          if (r.linkArsip) {
            aksiBtn = `<a href="${r.linkArsip}" target="_blank" class="btn btn-sm btn-outline-success fw-bold" style="font-size: 0.75rem"><i class="fa-solid fa-image"></i> Lihat Foto</a>`;
          } else {
            aksiBtn = `<button class="btn btn-sm btn-outline-warning text-dark fw-bold" style="font-size: 0.75rem" onclick="bukaModalUploadInventori('${r.id}', '${r.cabang}')"><i class="fa-solid fa-upload"></i> Upload</button>`;
          }
          
          tb.innerHTML += '<tr>' +
            '<td class="fw-bold text-start text-dark">' + r.aset + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td class="fw-bold">' + r.merk + '</td>' +
            '<td>' + r.sn + '</td>' +
            '<td>' + r.tahun + '</td>' +
            '<td><span class="badge ' + c + '">' + r.kondisi + '</span></td>' +
            '<td class="text-start">' + catatanText + '</td>' +
            '<td>' + aksiBtn + '</td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadServisData() {
  var tb = document.querySelector('#tabelMiniServis tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getServis", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada histori servis CR/alat.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) { 
          var cu = (r.urgensi === 'Mendesak') ? 'text-danger fw-bold' : ''; 
          var cs = (r.status.indexOf('Open') !== -1 || r.status.indexOf('Menunggu') !== -1) ? 'badge-glow-danger' : 'badge-glow-success';
          
          tb.innerHTML += '<tr>' +
            '<td>' + r.tanggal + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td class="fw-bold">' + r.alat + '</td>' +
            '<td class="text-start"><small>' + r.gejala + '</small></td>' +
            '<td class="' + cu + '">' + r.urgensi + '</td>' +
            '<td><span class="badge ' + cs + '">' + r.status + '</span></td>' +
            '<td><button class="btn btn-sm btn-outline-primary fw-bold" style="font-size: 0.75rem" onclick="bukaModalReport(\'' + r.id + '\', \'' + encodeURIComponent(r.report) + '\')"><i class="fa-solid fa-file-pen"></i> Report</button></td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadOrderData() {
  var tb = document.querySelector('#tabelMiniOrder tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getOrder", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada data pengajuan order.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) { 
          var cs = (r.status === 'Pending') ? 'badge-glow-warning' : 'badge-glow-success';
          
          tb.innerHTML += '<tr>' +
            '<td>' + r.tanggal + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td>' + r.kategori + '</td>' +
            '<td class="fw-bold text-start text-dark">' + r.nama + '</td>' +
            '<td class="text-primary fw-bold">' + r.jumlah + ' ' + r.satuan + '</td>' +
            '<td><span class="badge ' + cs + '">' + r.status + '</span></td>' +
            '<td class="text-start"><small>' + r.ket + '</small></td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadStokData() {
  var tb = document.querySelector('#tabelMiniStok tbody'); 
  if(!tb) return;
  tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Menarik data...</td></tr>';
  
  callAPI("GET", { action: "getStok", cabang: getCabFilter() })
    .then(function(data) {
      if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada histori opname stok.</td></tr>';
      } else {
        tb.innerHTML = '';
        data.forEach(function(r) {
          tb.innerHTML += '<tr>' +
            '<td>' + r.tanggal + '</td>' +
            '<td class="text-center">' + getBadgeCabang(r.cabang) + '</td>' +
            '<td class="fw-bold">' + r.jenis + '</td>' +
            '<td>' + r.awal + '</td>' +
            '<td class="text-success fw-bold">+' + r.masuk + '</td>' +
            '<td class="text-primary fw-bold">' + r.akhir + '</td>' +
            '<td class="text-danger fw-bold">-' + r.pakai + '</td>' +
          '</tr>'; 
        });
      }
    })
    .catch(function(e) { tb.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

// =========================================================================
// [LOGIKA-700] INTEGRASI MANUAL DAN DOKUMEN SOP
// =========================================================================
function bukaLogbookManualCabang() {
  var roleUpper = String(currentRole).toUpperCase();
  var kodeAktif = "";

  if (roleUpper.includes("ADMIN")) {
    kodeAktif = "ADMIN";
  } else if (roleUpper.includes("TEKNISI")) {
    kodeAktif = "TEKNISI";
  } else {
    kodeAktif = currentCabang;
  }

  if (!kodeAktif || kodeAktif === "") {
    alert("Sistem tidak mendeteksi kode cabang atau role Anda. Silakan login ulang.");
    return;
  }
  
  console.log("Membuka logbook manual untuk: " + kodeAktif);
  callAPI("GET", { action: "getLinkLogbook", cabang: kodeAktif })
    .then(function(linkDitemukan) {
      if (linkDitemukan && linkDitemukan !== "#" && linkDitemukan !== "") {
        window.open(linkDitemukan, '_blank'); 
      } else {
        alert("Maaf, link logbook untuk " + kodeAktif + " belum didaftarkan di spreadsheet DATABASE_LINK.");
      }
    })
    .catch(function(e) { alert("Error mengambil link logbook manual."); });
}

function bukaSOPCabang() {
  var roleUpper = String(currentRole).toUpperCase();
  var kodeAktif = "";

  if (roleUpper.includes("ADMIN")) {
    kodeAktif = "ADMIN";
  } else if (roleUpper.includes("TEKNISI")) {
    kodeAktif = "TEKNISI";
  } else {
    kodeAktif = currentCabang;
  }

  if (!kodeAktif || kodeAktif === "") {
    alert("Sistem tidak mendeteksi kode cabang atau role Anda. Silakan login ulang.");
    return;
  }

  console.log("Membuka folder SOP untuk: " + kodeAktif);
  callAPI("GET", { action: "getLinkSOP", cabang: kodeAktif })
    .then(function(linkDitemukan) {
      if (linkDitemukan && linkDitemukan !== "#" && linkDitemukan !== "") {
        window.open(linkDitemukan, '_blank'); 
      } else {
        alert("Maaf, link SOP untuk " + kodeAktif + " belum diinput oleh Admin.");
      }
    })
    .catch(function(e) { alert("Error mengambil link dokumen SOP."); });
}

// =========================================================================
// [LOGIKA-800] TRACKING PENGIRIMAN & PENERIMAAN LOGISTIK
// =========================================================================
function simpanPengiriman() {
  var dataForm = {
    tglKirim: document.getElementById('tglKirim').value,
    tglTiba: document.getElementById('tglTiba').value,
    ekspedisi: document.getElementById('ekspedisi').value,
    noResi: document.getElementById('noResi').value,
    tujuan: document.getElementById('tujuanCabang').value,
    keterangan: document.getElementById('ketBarang').value,
    statusTerkini: "DIKIRIM"
  };

  if(!dataForm.tglKirim || !dataForm.tglTiba || !dataForm.ekspedisi || !dataForm.noResi || !dataForm.tujuan || !dataForm.keterangan){
    alert("Mohon lengkapi seluruh kolom formulir pengiriman!");
    return;
  }

  callAPI("simpanDataPengiriman", { data: dataForm })
    .then(function(response) {
      alert("Berhasil! Data pengiriman logistik telah disimpan ke server.");
      document.getElementById('formPengiriman').reset();
      muatHistoriPengiriman();
    })
    .catch(function(e) { alert("Gagal menyimpan data pengiriman."); });
}

function muatHistoriPengiriman() {
  var tbody = document.getElementById("tabelHistoriPengiriman").querySelector('tbody') || document.getElementById("tabelHistoriPengiriman");
  tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Mengambil data pengiriman...</td></tr>';

  callAPI("GET", { action: "getHistoriPengiriman", role: currentRole, cabang: currentCabang })
    .then(function(data) {
      if ($.fn.DataTable.isDataTable('#tabelHistoriPengiriman')) {
        $('#tabelHistoriPengiriman').DataTable().clear().destroy();
      }
      
      var tbodyUpdate = document.getElementById("tabelHistoriPengiriman").querySelector('tbody');
      if(tbodyUpdate) tbodyUpdate.innerHTML = "";
      else tbody.innerHTML = "";
      
      var finalTbody = tbodyUpdate || tbody;
      
      if (data.length === 0) {
        finalTbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Belum ada data pengantar logistik untuk cabang ini.</td></tr>';
        return;
      }

      data.forEach(function(row) {
        var catatanHTML = "-";
        if (row.catatan && row.catatan.trim() !== "") {
          var pjg = row.catatan.length;
          var ukuranHuruf = pjg > 50 ? "0.75rem" : "0.85rem"; // Mengecil otomatis jika panjang
          catatanHTML = `<div class="text-start text-muted" style="font-size: ${ukuranHuruf}; max-width: 250px; white-space: pre-wrap; font-style: italic;">"${row.catatan}"</div>`;
        }

        var badgeStatus = row.status === "DITERIMA" 
          ? '<span class="badge badge-glow-success"><i class="fa-solid fa-check-double"></i> DITERIMA</span>' 
          : '<span class="badge badge-glow-warning"><i class="fa-solid fa-truck-fast"></i> DIKIRIM</span>';

        var tombolAksi = "-";
        if (currentRole === "Cabang" && row.status !== "DITERIMA") {
          tombolAksi = `<button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="bukaModalCatatanPengiriman(${row.rowIdx})"><i class="fa-solid fa-clipboard-check"></i> Lapor Terima</button>`;
        } else if (row.status === "DITERIMA") {
          tombolAksi = `<span class="text-success fw-bold" style="font-size:0.8rem;">Selesai</span>`;
        }

        var tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.tglKirim}</td>
          <td>${row.estimasi}</td>
          <td class="text-start">${row.ekspedisi}<br><span class="text-primary fw-bold">${row.resi}</span></td>
          <td class="text-center">${getBadgeCabang(row.tujuan)}</td>
          <td class="text-start">${row.detail}</td>
          <td>${badgeStatus}</td>
          <td class="text-start">${catatanHTML}</td>
          <td>${tombolAksi}</td>
        `;
        finalTbody.appendChild(tr);
      });

      $('#tabelHistoriPengiriman').DataTable({
        destroy: true,
        pageLength: 5,
        lengthMenu: [5, 10, 25],
        language: { search: "Cari:", lengthMenu: "Tampilkan _MENU_ baris", info: "Baris _START_ - _END_ dari _TOTAL_ data" }
      });

    })
    .catch(function(e) { tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Gagal terhubung ke database.</td></tr>'; });
}

function terimaBarang(barisKe) {
  if(!confirm("Konfirmasi bahwa paket logistik ini sudah tiba dan diterima di klinik cabang Anda?")) return;

  callAPI("konfirmasiTerimaBarang", { rowIdx: barisKe })
    .then(function(sukses) {
      alert("Konfirmasi Sukses! Status barang diperbarui menjadi DITERIMA.");
      muatHistoriPengiriman(); 
    })
    .catch(function(e) { alert("Gagal mengupdate status penerimaan."); });
}

function bukaModalCatatanPengiriman(rowIdx) {
  document.getElementById("catatanPengirimanRowIdx").value = rowIdx;
  document.getElementById("teksCatatanPengiriman").value = "";
  var modal = new bootstrap.Modal(document.getElementById('modalCatatanPengiriman'));
  modal.show();
}

function simpanCatatanPengiriman() {
  var rowIdx = document.getElementById("catatanPengirimanRowIdx").value;
  var catatan = document.getElementById("teksCatatanPengiriman").value;
  var btnSave = document.querySelector("#modalCatatanPengiriman .btn-success");
  var oriText = btnSave.innerHTML;
  
  if(catatan.trim() === "") {
    tampilkanPeringatan("Perhatian", "Harap tuliskan catatan penerimaan terlebih dahulu!");
    return;
  }
  
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Menyimpan...';
  btnSave.disabled = true;
  
  callAPI("POST", { action: "konfirmasiTerimaBarangDenganCatatan", data: { rowIdx: rowIdx, catatan: catatan } })
    .then(function(sukses) {
      var modalEl = document.getElementById('modalCatatanPengiriman');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if(modal) modal.hide();
      
      tampilkanPeringatan("Berhasil", "Data pengiriman berhasil dikonfirmasi dan laporan catatan telah tersimpan!");
      muatHistoriPengiriman(); 
    })
    .catch(function(e) { tampilkanPeringatan("Gagal", "Gagal menyimpan catatan."); })
    .finally(function() {
      btnSave.innerHTML = oriText;
      btnSave.disabled = false;
    });
}

// =========================================================================
// [LOGIKA-900] DATA ARSIP SIP/SIKR PETUGAS
// =========================================================================
function muatDataSIP() {
  var tbody = document.getElementById("tabelDataSIP").querySelector('tbody') || document.getElementById("tabelDataSIP");
  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Memuat SIP...</td></tr>';

  callAPI("GET", { action: "getDataSIP", role: currentRole, cabang: currentCabang })
    .then(function(data) {
      tbody.innerHTML = "";
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Data SIP/SIKR kosong.</td></tr>';
        return;
      }

      data.forEach(function(row) {
        var badgeStatus = row.status.toLowerCase().includes("aktif") 
          ? '<span class="badge badge-glow-success">Aktif</span>' 
          : '<span class="badge badge-glow-danger">Expired</span>';

        var tombolLink = row.link && row.link !== ""
          ? `<a href="${row.link}" target="_blank" class="btn btn-sm btn-primary fw-bold"><i class="fa-solid fa-folder-open"></i> Buka berkas</a>`
          : `<span class="text-muted" style="font-size:0.8rem;">Belum diupload</span>`;

        var tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="text-dark fw-bold">${row.nama}</td>
          <td class="text-center">${getBadgeCabang(row.cabang)}</td>
          <td>${row.nomor}</td>
          <td>${row.terbit}</td>
          <td><span class="${row.status.toLowerCase().includes("aktif") ? 'text-success' : 'text-danger fw-bold'}">${row.expired}</span></td>
          <td>${badgeStatus}</td>
          <td>${tombolLink}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(function(e) { tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Gagal menarik berkas SIP.</td></tr>'; });
}

// =========================================================================
// [LOGIKA-1000] MONITORING PERALATAN & DATA BI
// =========================================================================
function loadPeralatanMCU() {
  var wadah = document.getElementById("wadahKartuMCU");
  if (!wadah) return;
  
  wadah.innerHTML = '<div class="col-12 text-center text-muted mt-4"><i class="fa-solid fa-spinner fa-spin fs-2 text-primary"></i><br>Sedang menyinkronkan data...</div>';

  callAPI("GET", { action: "getPeralatanMCU" })
    .then(function(data) {
      wadah.innerHTML = ''; 
      
      if (data.length === 0) {
        wadah.innerHTML = '<div class="col-12 text-center text-muted">Database peralatan MCU kosong.</div>';
        return;
      }

      var dataCabang = {};
      data.forEach(function(row) {
        var namaCabang = row.cabang;
        if (!namaCabang || namaCabang === "-") return;
        
        if (!dataCabang[namaCabang]) {
          dataCabang[namaCabang] = { listAlat: [], peringatan: [] };
        }

        dataCabang[namaCabang].listAlat.push({
          cr: row.cr || "-",
          xray: row.xray || "-"
        });

        var status = (row.status || "").trim();
        var ket = (row.ket || "").trim();
        
        if (status !== "" && status !== "-") {
          var teksPeringatan = status;
          if (ket !== "" && ket !== "-") teksPeringatan += " <i>(" + ket + ")</i>";
          dataCabang[namaCabang].peringatan.push(teksPeringatan);
        }
      });

      for (var cabang in dataCabang) {
        var infoCabang = dataCabang[cabang];
        var htmlDaftarAlat = "";
        
        infoCabang.listAlat.forEach(function(alat) {
          htmlDaftarAlat += `
            <div class="row text-center mb-2 mx-0 align-items-center">
              <div class="col-6 border-end border-secondary">
                <span class="text-primary fw-bold" style="font-size: 0.85rem;">${alat.cr}</span>
              </div>
              <div class="col-6">
                <span class="text-danger fw-bold" style="font-size: 0.85rem;">${alat.xray}</span>
              </div>
            </div>
          `;
        });

        var borderCard = "border-warning border-2 shadow-sm"; 
        var isiPeringatan = "";
        var ikonBaru = '<i class="fa-solid fa-arrow-right-arrow-left text-danger"></i>'; 

        if (infoCabang.peringatan.length > 0) {
          infoCabang.peringatan.forEach(function(p) {
             isiPeringatan += `<div class="mb-1">${ikonBaru} <span class="text-dark">${p}</span></div>`;
          });
        } else {
          isiPeringatan = `<div class="mb-1 text-muted">${ikonBaru} -</div>`;
        }

        var htmlPeringatan = `
          <div class="bg-warning text-dark text-center fw-bold mt-auto rounded-bottom" style="font-size: 0.75rem; padding: 10px;">
            <div style="font-size: 0.7rem; margin-bottom: 4px;" class="text-uppercase border-bottom border-dark border-opacity-25 pb-1">Info Status / Pinjaman:</div>
            ${isiPeringatan}
          </div>
        `;

        var bgColor = "#e2e8f0";
        var txtColor = "#fff";
        var borderColor = "#334155";
        var cUpper = cabang.toUpperCase().trim();
        if (cUpper.includes("KDI")) { bgColor = "linear-gradient(135deg, #1e3a8a, #3b82f6)"; borderColor = "#1e3a8a"; }
        else if (cUpper.includes("MKS")) { bgColor = "#ef4444"; borderColor = "#ef4444"; }
        else if (cUpper.includes("BJM")) { bgColor = "#76b900"; borderColor = "#76b900"; }
        else if (cUpper.includes("PLU")) { bgColor = "#eab308"; txtColor = "#000"; borderColor = "#ca8a04"; }
        else if (cUpper.includes("GTO")) { bgColor = "#166534"; borderColor = "#166534"; }
        else if (cUpper.includes("MND")) { bgColor = "#f97316"; borderColor = "#f97316"; }
        else if (cUpper.includes("LWK")) { bgColor = "#ec4899"; borderColor = "#ec4899"; }
        else if (cUpper.includes("BHD") || cUpper.includes("DIHD")) { bgColor = "#8b4513"; borderColor = "#8b4513"; }
        else if (cUpper.includes("KLK")) { bgColor = "#334155"; borderColor = "#334155"; }
        else if (cUpper.includes("MMJ")) { bgColor = "linear-gradient(135deg, #000000, #6b7280)"; borderColor = "#000000"; }
        else if (cUpper.includes("PLK")) { bgColor = "linear-gradient(135deg, #0ea5e9, #10b981)"; borderColor = "#0ea5e9"; }
        else if (cUpper.includes("BUB")) { bgColor = "#ea580c"; borderColor = "#ea580c"; }
        else { bgColor = "#e2e8f0"; txtColor = "#334155"; borderColor = "#cbd5e1"; }

        var borderStyle = "border: 2px solid " + borderColor + " !important;";

        var kartu = `
          <div class="col-md-4 col-sm-6 mb-4 d-flex">
            <div class="card card-kaca shadow-sm w-100 d-flex flex-column" style="${borderStyle}">
              <div class="card-header fw-bold text-center py-2 fs-6 border-bottom" style="background: ${bgColor}; color: ${txtColor};">
                ${cabang}
              </div>
              <div class="card-body p-3 flex-grow-1">
                <div class="row text-center mb-3 border-bottom border-secondary pb-1 mx-0">
                  <div class="col-6 border-end border-secondary">
                    <span class="text-muted text-uppercase d-block" style="font-size: 0.7rem; font-weight: 800;">Merek CR</span>
                  </div>
                  <div class="col-6">
                    <span class="text-muted text-uppercase d-block" style="font-size: 0.7rem; font-weight: 800;">Pesawat X-Ray</span>
                  </div>
                </div>
                ${htmlDaftarAlat}
              </div>
              ${htmlPeringatan}
            </div>
          </div>
        `;
        
        wadah.innerHTML += kartu;
      }
    })
    .catch(function(e) { wadah.innerHTML = '<div class="col-12 text-center text-danger">Gagal memuat kartu monitoring.</div>'; });
}

let biChartEfisiensi = null;
let biChartAset = null;
function initAnalyticsBI() {
  callAPI("GET", { action: "getAnalyticsBI" })
    .then(function(data) {
      // 1. Chart Pemborosan (Waste Cost)
      const ctxEfi = document.getElementById('biChartEfisiensi');
      if(ctxEfi) {
        if(biChartEfisiensi) biChartEfisiensi.destroy();
        biChartEfisiensi = new Chart(ctxEfi.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['Terpakai Profit (Aman)', 'Rijek/Rusak (Pemborosan)'],
            datasets: [{
              data: [data.efisiensi.normal, data.efisiensi.rijek],
              backgroundColor: ['#10b981', '#f43f5e'], 
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: { 
            responsive: true, 
            plugins: { legend: { position: 'bottom', labels: { color: '#0f172a', font: { family: 'Outfit', size: 12, weight: 'bold' } } } } 
          }
        });
      }

      // 2. Chart Kondisi Aset
      const ctxAset = document.getElementById('biChartAset');
      if(ctxAset) {
        if(biChartAset) biChartAset.destroy();
        biChartAset = new Chart(ctxAset.getContext('2d'), {
          type: 'pie',
          data: {
            labels: ['Kondisi Baik', 'Rusak Ringan', 'Rusak Berat'],
            datasets: [{
              data: [data.aset.baik, data.aset.ringan, data.aset.berat],
              backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'], 
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: { 
            responsive: true, 
            plugins: { legend: { position: 'bottom', labels: { color: '#0f172a', font: { family: 'Outfit', size: 12, weight: 'bold' } } } } 
          }
        });
      }
    })
    .catch(function(e) { console.error("Gagal menggambar chart BI: ", e); });
}

// PENGECEKAN PERINGATAN EXP AIRPORT & STATUS BAPETEN
function cekPeringatanSistem(dataStok, dataIjin) {
  var pesanPeringatan = "";
  var adaPeringatan = false;
  var filter = document.getElementById('filterDashboard') ? document.getElementById('filterDashboard').value : 'ALL';

  if (dataIjin && dataIjin.length > 0) {
    dataIjin.forEach(function(row) {
      if (filter === 'ALL' || row.cabang === filter) {
        var status = String(row.status).toUpperCase();
        if (status.includes("EXPIRED") || status.includes("MATI") || status.includes("TIDAK AKTIF")) {
          pesanPeringatan += `<div class="alert alert-danger py-2 mb-2"><i class="fa-solid fa-file-circle-xmark me-2"></i> <strong>${row.cabang}:</strong> Izin ${row.pesawat} sudah <b>EXPIRED</b>!</div>`;
          adaPeringatan = true;
        } else if (status.includes("MENDEKATI")) {
          pesanPeringatan += `<div class="alert alert-warning py-2 mb-2 text-dark"><i class="fa-solid fa-clock me-2"></i> <strong>${row.cabang}:</strong> Izin ${row.pesawat} mendekati expired.</div>`;
          adaPeringatan = true;
        }
      }
    });
  }

  if (adaPeringatan) {
    document.getElementById("isiPeringatan").innerHTML = pesanPeringatan;
    var modalAlert = new bootstrap.Modal(document.getElementById('modalPeringatan'));
    modalAlert.show();
  }
}

// =========================================================================
// [LOGIKA-700] RINCIAN KARTU DASHBOARD (MODAL POP-UP)
// =========================================================================
function bukaRincianDash(tipe) {
  var modalElement = document.getElementById('modalRincianDashboard');
  var modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
  var judul = document.getElementById('judulModalRincian');
  var th = document.getElementById('headTabelRincian');
  var tb = document.getElementById('bodyTabelRincian');
  var loading = document.getElementById('loadingRincian');
  var tabelContainer = document.getElementById('tabelRincianContainer');

  loading.classList.add('d-none');
  tabelContainer.classList.remove('d-none');
  th.innerHTML = '';
  tb.innerHTML = '';

  if (tipe === 'pasien') {
    judul.innerHTML = '<i class="fa-solid fa-users me-2"></i> Rincian Pasien per Cabang';
    th.innerHTML = '<tr><th>Cabang</th><th>Total Pasien</th></tr>';
    var totalSemua = 0;
    for (var i = 0; i < masterData.labels.length; i++) {
      var jml = masterData.pasien[i] || 0;
      totalSemua += jml;
      tb.innerHTML += `<tr><td class="fw-bold text-primary">${masterData.labels[i]}</td><td>${jml} Pasien</td></tr>`;
    }
    tb.innerHTML += `<tr class="table-info fw-bold"><td>TOTAL KESELURUHAN</td><td>${totalSemua} Pasien</td></tr>`;
    modal.show();
  } 
  else if (tipe === 'film') {
    judul.innerHTML = '<i class="fa-solid fa-film me-2"></i> Rincian Pemakaian Film per Cabang';
    th.innerHTML = '<tr><th>Cabang</th><th>Lembar Film Terpakai</th></tr>';
    var totalSemua = 0;
    for (var i = 0; i < masterData.labels.length; i++) {
      var jml = masterData.film[i] || 0;
      totalSemua += jml;
      tb.innerHTML += `<tr><td class="fw-bold text-primary">${masterData.labels[i]}</td><td>${jml} Lembar</td></tr>`;
    }
    tb.innerHTML += `<tr class="table-info fw-bold"><td>TOTAL KESELURUHAN</td><td>${totalSemua} Lembar</td></tr>`;
    modal.show();
  }
  else if (tipe === 'order') {
    judul.innerHTML = '<i class="fa-solid fa-cart-shopping me-2"></i> Rincian Order Barang (Pending)';
    th.innerHTML = '<tr><th>Tanggal</th><th>Cabang</th><th>Barang & Jumlah</th><th>Keterangan</th></tr>';
    var adaData = false;
    if(masterData.tabelData && masterData.tabelData.order) {
      masterData.tabelData.order.forEach(function(row) {
        if (row.status === 'Pending') {
          adaData = true;
          tb.innerHTML += `<tr>
            <td>${row.tanggal}</td>
            <td class="text-center">${getBadgeCabang(row.cabang)}</td>
            <td class="text-start"><span class="fw-bold">${row.nama}</span><br><span class="badge bg-warning text-dark mt-1">${row.jumlah}</span></td>
            <td class="text-start"><small>${row.ket || '-'}</small></td>
          </tr>`;
        }
      });
    }
    if(!adaData) tb.innerHTML = '<tr><td colspan="4" class="text-muted py-4">Tidak ada orderan pending saat ini.</td></tr>';
    modal.show();
  }
  else if (tipe === 'alat') {
    judul.innerHTML = '<i class="fa-solid fa-screwdriver-wrench me-2"></i> Laporan Kerusakan Alat';
    th.innerHTML = '<tr><th>Tanggal Lapor</th><th>Cabang</th><th>Kendala / Gejala</th><th>Urgensi</th></tr>';
    
    loading.classList.remove('d-none');
    tabelContainer.classList.add('d-none');
    modal.show();

    callAPI("GET", { action: "getServis" })
      .then(function(res) {
        loading.classList.add('d-none');
        tabelContainer.classList.remove('d-none');
        var adaData = false;
        res.forEach(function(row) {
          if (row.status.indexOf("Open") !== -1 || row.status.indexOf("Menunggu") !== -1) {
            adaData = true;
            var badgeUrgensi = (row.urgensi === 'Tinggi') ? 'badge bg-danger' : ((row.urgensi === 'Sedang') ? 'badge bg-warning text-dark' : 'badge bg-info');
            tb.innerHTML += `<tr>
              <td>${row.tanggal}</td>
              <td class="text-center">${getBadgeCabang(row.cabang)}<br><small class="fw-bold">${row.alat}</small></td>
              <td class="text-start"><small>${row.gejala}</small></td>
              <td><span class="${badgeUrgensi}">${row.urgensi}</span></td>
            </tr>`;
          }
        });
        if(!adaData) tb.innerHTML = '<tr><td colspan="4" class="text-muted py-4">Tidak ada laporan kerusakan alat yang terbuka.</td></tr>';
      })
      .catch(function(err) {
        loading.classList.add('d-none');
        tabelContainer.classList.remove('d-none');
        tb.innerHTML = '<tr><td colspan="4" class="text-danger py-4"><i class="fa-solid fa-triangle-exclamation"></i> Gagal mengambil data rincian dari server.</td></tr>';
      });
  }
}

// ==========================================
// FUNGSI REPORT SERVIS MAINTENANCE
// ==========================================
function bukaModalReport(idTiket, reportTextEncoded) {
  var reportText = "";
  try {
    if(reportTextEncoded && reportTextEncoded !== "undefined" && reportTextEncoded !== "null") {
      reportText = decodeURIComponent(reportTextEncoded);
    }
  } catch(e) {}
  
  document.getElementById("reportIdTiket").value = idTiket;
  document.getElementById("reportTextarea").value = reportText;
  
  var modal = new bootstrap.Modal(document.getElementById('modalReportServis'));
  modal.show();
}

function simpanReportServis() {
  var id = document.getElementById("reportIdTiket").value;
  var teks = document.getElementById("reportTextarea").value;
  
  if (!id) return;
  
  var btnSave = document.querySelector("#modalReportServis .btn-success");
  var oriText = btnSave.innerHTML;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Menyimpan...';
  btnSave.disabled = true;
  
  var dataPayload = {
    idTiket: id,
    report: teks
  };
  
  callAPI("POST", { action: "updateServisReport", data: dataPayload })
    .then(function(res) {
      if(res.success) {
        var modalEl = document.getElementById('modalReportServis');
        var modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
        
        loadServisData();
        tampilkanPeringatan("Berhasil", "Report berhasil disimpan ke server!");
      } else {
        tampilkanPeringatan("Gagal", "Gagal menyimpan report.");
      }
    })
    .catch(function(err) {
      tampilkanPeringatan("Error", "Terjadi kesalahan saat menyimpan.");
    })
    .finally(function() {
      btnSave.innerHTML = oriText;
      btnSave.disabled = false;
    });
}

// ==========================================
// FUNGSI UPLOAD ARSIP TLD
// ==========================================
function bukaModalUploadTLD(idTiket, cabang) {
  document.getElementById("uploadTldIdTiket").value = idTiket;
  document.getElementById("uploadTldCabang").value = cabang;
  document.getElementById("inputFileTLD").value = "";
  
  var modal = new bootstrap.Modal(document.getElementById('modalUploadTLD'));
  modal.show();
}

// ==========================================
// MESIN KOMPRESOR FOTO OTOMATIS
// ==========================================
function compressImageAndGetBase64(file, maxSizeMB, callback) {
  if (!file.type.startsWith('image/')) {
    // Jika bukan gambar (misal PDF), cek ukuran langsung
    if (file.size > maxSizeMB * 1024 * 1024) {
      callback({ error: "Maaf, ukuran dokumen (PDF/dll) melebihi " + maxSizeMB + " MB. Silakan kompres manual (misal pakai iLovePDF) sebelum diunggah." });
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      callback({ base64: e.target.result.split(',')[1], type: file.type });
    };
    reader.readAsDataURL(file);
    return;
  }

  // Jika Gambar, jalankan kompresor kanvas
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var maxWidth = 1920; // Diperbesar ke resolusi Full HD agar lebih tajam
      var maxHeight = 1920;
      var width = img.width;
      var height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height *= maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width *= maxHeight / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      var quality = 0.84; // Setelan agresif hemat memori (84%)
      var dataUrl = canvas.toDataURL('image/jpeg', quality);
      var base64 = dataUrl.split(',')[1];
      var approxSizeKB = (base64.length * 0.75) / 1024;
      
      // Susutkan terus kualitasnya perlahan HANYA JIKA ukuran masih di atas 1000 KB (1 MB)
      while (approxSizeKB > 1000 && quality > 0.4) {
        quality -= 0.05; // Turun perlahan 5%
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        base64 = dataUrl.split(',')[1];
        approxSizeKB = (base64.length * 0.75) / 1024;
      }

      callback({ base64: base64, type: 'image/jpeg' });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function prosesUploadTLD() {
  var id = document.getElementById("uploadTldIdTiket").value;
  var cabang = document.getElementById("uploadTldCabang").value;
  var fileInput = document.getElementById("inputFileTLD");
  
  if (!fileInput.files || fileInput.files.length === 0) {
    tampilkanPeringatan("Perhatian", "Pilih file terlebih dahulu sebelum mengupload.");
    return;
  }
  
  var file = fileInput.files[0];
  
  var btnSave = document.querySelector("#modalUploadTLD .btn-warning");
  var oriText = btnSave.innerHTML;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Memproses & Upload...';
  btnSave.disabled = true;

  compressImageAndGetBase64(file, 1.0, function(result) {
    if (result.error) {
      tampilkanPeringatan("Perhatian", result.error);
      btnSave.innerHTML = oriText;
      btnSave.disabled = false;
      return;
    }

    var dataPayload = {
      idTiket: id,
      cabang: cabang,
      filename: id + "_" + (result.type === 'image/jpeg' ? file.name.split('.')[0] + ".jpg" : file.name),
      mimeType: result.type,
      base64Data: result.base64
    };
    
    callAPI("POST", { action: "uploadArsipTLD", data: dataPayload })
      .then(function(res) {
        if(res.success) {
          var modalEl = document.getElementById('modalUploadTLD');
          var modal = bootstrap.Modal.getInstance(modalEl);
          if(modal) modal.hide();
          
          loadTldData();
          tampilkanPeringatan("Berhasil", "Arsip TLD berhasil di-upload ke Google Drive!");
        } else {
          tampilkanPeringatan("Gagal", res.error || "Gagal mengupload arsip.");
        }
      })
      .catch(function(err) {
        tampilkanPeringatan("Error", "Terjadi kesalahan jaringan.");
      })
      .finally(function() {
        btnSave.innerHTML = oriText;
        btnSave.disabled = false;
      });
  });
}

// ==========================================
// FUNGSI UPLOAD ARSIP MCU
// ==========================================
function bukaModalUploadMCU(idTiket, cabang) {
  document.getElementById("uploadMcuIdTiket").value = idTiket;
  document.getElementById("uploadMcuCabang").value = cabang;
  document.getElementById("inputFileMCU").value = "";
  
  var modal = new bootstrap.Modal(document.getElementById('modalUploadMCU'));
  modal.show();
}

function prosesUploadMCU() {
  var id = document.getElementById("uploadMcuIdTiket").value;
  var cabang = document.getElementById("uploadMcuCabang").value;
  var fileInput = document.getElementById("inputFileMCU");
  
  if (!fileInput.files || fileInput.files.length === 0) {
    tampilkanPeringatan("Perhatian", "Pilih file terlebih dahulu sebelum mengupload.");
    return;
  }
  
  var file = fileInput.files[0];
  
  var btnSave = document.querySelector("#modalUploadMCU .btn-danger");
  var oriText = btnSave.innerHTML;
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Memproses & Upload...';
  btnSave.disabled = true;
  
  compressImageAndGetBase64(file, 1.0, function(result) {
    if (result.error) {
      tampilkanPeringatan("Perhatian", result.error);
      btnSave.innerHTML = oriText;
      btnSave.disabled = false;
      return;
    }

    var dataPayload = {
      idTiket: id,
      cabang: cabang,
      filename: id + "_" + (result.type === 'image/jpeg' ? file.name.split('.')[0] + ".jpg" : file.name),
      mimeType: result.type,
      base64Data: result.base64
    };
    
    callAPI("POST", { action: "uploadArsipMCU", data: dataPayload })
      .then(function(res) {
        if(res.success) {
          var modalEl = document.getElementById('modalUploadMCU');
          var modal = bootstrap.Modal.getInstance(modalEl);
          if(modal) modal.hide();
          
          loadMcuData();
          tampilkanPeringatan("Berhasil", "Arsip MCU berhasil di-upload ke Google Drive!");
        } else {
          tampilkanPeringatan("Gagal", res.error || "Gagal mengupload arsip.");
        }
      })
      .catch(function(err) {
        tampilkanPeringatan("Error", "Terjadi kesalahan jaringan.");
      })
      .finally(function() {
        btnSave.innerHTML = oriText;
        btnSave.disabled = false;
      });
  });
}


// ==========================================
// FUNGSI UPLOAD FOTO INVENTORI
// ==========================================
function bukaModalUploadInventori(idAsset, cabang) {
  document.getElementById("uploadInventoriIdAsset").value = idAsset;
  document.getElementById("uploadInventoriCabang").value = cabang;
  document.getElementById("inputFileInventori").value = "";
  var modal = new bootstrap.Modal(document.getElementById('modalUploadInventori'));
  modal.show();
}

function prosesUploadInventori() {
  var idAsset = document.getElementById("uploadInventoriIdAsset").value;
  var cabang = document.getElementById("uploadInventoriCabang").value;
  var fileInput = document.getElementById("inputFileInventori");
  var file = fileInput.files[0];
  
  if (!file) {
    tampilkanPeringatan("Peringatan", "Harap pilih foto aset terlebih dahulu!");
    return;
  }
  
  var btnSave = document.querySelector("#modalUploadInventori .btn-warning");
  var oriText = btnSave.innerHTML;
  
  btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Mengupload...';
  btnSave.disabled = true;

  function handleResponseInventori(res) {
    if(res && res.success) {
      var modalEl = document.getElementById('modalUploadInventori');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if(modal) modal.hide();
      
      loadInventoriData();
      tampilkanPeringatan("Berhasil", "Data keterangan/foto inventori berhasil disimpan!");
    } else {
      tampilkanPeringatan("Gagal", res.error || "Gagal menyimpan data.");
    }
    btnSave.innerHTML = oriText;
    btnSave.disabled = false;
  }

  function handleErrorInventori(err) {
    tampilkanPeringatan("Error", "Terjadi kesalahan jaringan.");
    btnSave.innerHTML = oriText;
    btnSave.disabled = false;
  }

  if (file) {
    compressImageAndGetBase64(file, 1.0, function(result) {
      if (result.error) {
        tampilkanPeringatan("Gagal", result.error);
        btnSave.innerHTML = oriText;
        btnSave.disabled = false;
        return;
      }
      
      callAPI("POST", {
        action: "uploadFotoInventori",
        data: {
          idAsset: idAsset,
          cabang: cabang,
          filename: idAsset + "_" + (result.type === 'image/jpeg' ? file.name.split('.')[0] + ".jpg" : file.name),
          mimeType: result.type,
          base64Data: result.base64
        }
      }).then(handleResponseInventori).catch(handleErrorInventori);
    });
  }
}
