/**
 * SISTEM LOGBOOK & LOGISTIK RADIOLOGI KLINIK MAXIMA
 * Backend API Google Apps Script (Versi Ultra-Cepat dengan Smart Caching)
 * 
 * Petunjuk Penggunaan:
 * 1. Copy (Salin) semua kode ini.
 * 2. Paste (Tempelkan) di Google Apps Script Editor Anda (menggantikan kode lama).
 * 3. Klik "Deploy" -> "New deployment" atau "Manage deployments" lalu buat versi baru.
 * 4. Selesai! Aplikasi Anda akan loading jauh lebih cepat.
 */

// =========================================================================
// [MESIN-000] SMART CACHING ENGINE (MEMPERCEPAT LOADING SERVER)
// =========================================================================
function getCacheVersion() {
  var cache = CacheService.getScriptCache();
  var v = cache.get("CACHE_VERS_MAXIMA");
  if (!v) { 
    v = Date.now().toString(); 
    cache.put("CACHE_VERS_MAXIMA", v, 21600); // 6 Jam
  }
  return v;
}

function invalidateCache() {
  // Setiap ada data baru yang disimpan, kita ubah versinya 
  // agar semua orang langsung mendapatkan data terbaru (real-time)
  CacheService.getScriptCache().put("CACHE_VERS_MAXIMA", Date.now().toString(), 21600);
}

function readCache(key) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(key + "_" + getCacheVersion());
  if (cached) return JSON.parse(cached);
  return null;
}

function writeCache(key, dataObj) {
  try {
    var cache = CacheService.getScriptCache();
    var strData = JSON.stringify(dataObj);
    // Google cache max 100KB per string. Biasanya data kita di bawah 20KB.
    if (strData.length < 90000) {
      cache.put(key + "_" + getCacheVersion(), strData, 600); // Simpan 10 menit
    }
  } catch(e) {} 
}


// =========================================================================
// [MESIN-100] ENTRY POINT API (GET & POST HANDLERS)
// =========================================================================

function doGet(e) {
  var action = e.parameter.action;
  
  if (!action) {
    return ContentService.createTextOutput("API Sistem Radiologi Maxima Aktif. Gunakan POST untuk menulis, GET dengan parameter action untuk membaca data.")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  try {
    var responseData;
    var cabang = e.parameter.cabang || "ALL";
    var role = e.parameter.role || "Cabang";
    var cacheKey = action + "_" + cabang + "_" + role;
    
    // 1. Coba ambil dari memori pintar (CACHE) agar instan
    var cachedData = readCache(cacheKey);
    if (cachedData) {
      return respondJSON(cachedData);
    }
    
    // 2. Jika tidak ada di memori, proses perhitungan berat dari Google Sheets
    switch(action) {
      case "getDashboardData": responseData = getDashboardData(); break;
      case "getHarian": responseData = getHarianMiniData(cabang); break;
      case "getStok": responseData = getStokMiniData(cabang); break;
      case "getLogbook": responseData = getLogbookPasienMiniData(cabang); break;
      case "getOrder": responseData = getOrderMiniData(cabang); break;
      case "getServis": responseData = getServisMiniData(cabang); break;
      case "getInventori": responseData = getInventoriMiniData(cabang); break;
      case "getTld": responseData = getTldMiniData(cabang); break;
      case "getMcu": responseData = getMcuMiniData(cabang); break;
      case "getAnalyticsBI": responseData = getAnalyticsBIData(); break;
      case "getPeralatanMCU": responseData = getPeralatanMCUData(); break;
      case "getLinkLogbook": responseData = getLinkLogbookKhusus(cabang); break;
      case "getLinkSOP": responseData = getLinkSOPKhusus(cabang); break;
      case "getDataSIP": responseData = getDataSIP(role, cabang); break;
      case "getHistoriPengiriman": responseData = getHistoriPengiriman(role, cabang); break;
      default: return respondError("Aksi GET tidak dikenali.");
    }
    
    // 3. Simpan hasil ke memori agar tarikan berikutnya instan
    if (responseData) {
      writeCache(cacheKey, responseData);
    }
    
    return respondJSON(responseData);
  } catch(err) {
    return respondError(err.message);
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var data = postData.data;
    
    if (!action) {
      return respondError("Parameter 'action' wajib disertakan dalam request POST.");
    }
    
    var result;
    var isDataChanged = false; // Tandai jika ada penambahan data baru
    
    switch(action) {
      case "verifyLogin":
        result = verifyLogin(postData.username, postData.password);
        break;
      case "simpanHarian":
        result = { success: simpanHarian(data) }; isDataChanged = true;
        break;
      case "simpanStok":
        result = { success: simpanStok(data) }; isDataChanged = true;
        break;
      case "simpanPasien":
        result = { success: simpanPasien(data) }; isDataChanged = true;
        break;
      case "simpanOrder":
        result = { success: simpanOrder(data) }; isDataChanged = true;
        break;
      case "simpanServis":
        result = { success: simpanServis(data) }; isDataChanged = true;
        break;
      case "simpanInventori":
        result = { success: simpanInventori(data) }; isDataChanged = true;
        break;
      case "simpanTLD":
        result = { success: simpanTLD(data) }; isDataChanged = true;
        break;
      case "simpanMCU":
        result = { success: simpanMCU(data) }; isDataChanged = true;
        break;
      case "simpanDataPengiriman":
        result = { success: simpanDataPengiriman(data) }; isDataChanged = true;
        break;
      case "konfirmasiTerimaBarang":
        result = { success: konfirmasiTerimaBarang(postData.rowIdx) }; isDataChanged = true;
        break;
      default:
        return respondError("Aksi POST tidak dikenali.");
    }
    
    // Jika ada data yang tersimpan/berubah, bilas memori sistem
    if (isDataChanged) {
      invalidateCache();
    }
    
    return respondJSON(result);
  } catch(err) {
    return respondError(err.message);
  }
}

// Helper untuk format respon JSON
function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function respondError(msg) {
  return respondJSON({ success: false, error: true, message: msg });
}

// =========================================================================
// [MESIN-200] FUNGSI PEMBANTU & KONEKTOR DATABASE
// =========================================================================

function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet '" + sheetName + "' tidak ditemukan! Pastikan ejaannya persis sama.");
  }
  return sheet;
}

function formatTanggalAman(dt) {
  if (!dt || dt === "") return "-";
  try {
    var d = new Date(dt);
    if (isNaN(d.getTime())) return dt.toString(); 
    return Utilities.formatDate(d, "GMT+8", "dd MMM yyyy"); 
  } catch(e) {
    return dt.toString();
  }
}

// =========================================================================
// [MESIN-300] FUNGSI VERIFIKASI LOGIN
// =========================================================================

function verifyLogin(username, password) {
  try {
    var sheet = getSheet("Master_User");
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var sheetUser = row[0] ? row[0].toString().trim() : "";
      var sheetPass = row[1] ? row[1].toString().trim() : "";
      
      if (sheetUser === username.trim() && sheetPass === password.trim()) {
        return {
          success: true,
          role: row[2] ? row[2].toString().trim() : "Cabang",
          cabang: row[3] ? row[3].toString().trim() : "MXM-KDI"
        };
      }
    }
    return { success: false, message: "Username atau Password salah!" };
  } catch(e) {
    return { success: false, message: "Error sistem: " + e.message };
  }
}

// =========================================================================
// [MESIN-400] FUNGSI PENULISAN DATA (WRITE TO SHEET)
// =========================================================================

function simpanHarian(data) {
  var sheet = getSheet("Log_Harian_Film");
  sheet.appendRow([
    new Date(), 
    data.tanggal, 
    data.cabang, 
    data.jenisFilm, 
    Number(data.pasien1) || 0, 
    Number(data.pasien2) || 0, 
    Number(data.terpakaiNormal) || 0, 
    Number(data.rijekRusak) || 0, 
    data.keterangan || "-"
  ]);
  return true;
}

function lacakStokTerakhir(cabang, jenisFilm) {
  var sheet = getSheet("Log_Stok_Film");
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i > 0; i--) {
    if (data[i][3] === cabang && data[i][4] === jenisFilm) {
      return Number(data[i][7]); 
    }
  }
  return "DATA_BARU"; 
}

function simpanStok(data) {
  var sheet = getSheet("Log_Stok_Film");
  var idLog = "STK-" + Math.floor(Math.random() * 1000000); 
  
  var filmMasuk = Number(data.filmMasuk) || 0;
  var stokTerkini = Number(data.stokTerkini) || 0;
  var stokAwalOtomatis = lacakStokTerakhir(data.cabang, data.jenisFilm);
  var pemakaian = 0;
  
  if (stokAwalOtomatis === "DATA_BARU") {
    stokAwalOtomatis = stokTerkini;
    pemakaian = 0; 
  } else {
    pemakaian = (stokAwalOtomatis + filmMasuk) - stokTerkini;
  }
  
  sheet.appendRow([
    idLog, 
    new Date(), 
    data.tanggalStok, 
    data.cabang, 
    data.jenisFilm,
    stokAwalOtomatis, 
    filmMasuk, 
    stokTerkini, 
    pemakaian
  ]);
  return true;
}

function simpanPasien(data) {
  var sheet = getSheet("Logbook_Pasien");
  sheet.appendRow([
    new Date(), 
    data.bulan, 
    data.cabang, 
    Number(data.thoraksP) || 0, 
    Number(data.thoraksE) || 0, 
    Number(data.musculoP) || 0, 
    Number(data.musculoE) || 0, 
    Number(data.dentalP) || 0, 
    Number(data.dentalE) || 0, 
    Number(data.panoramicP) || 0, 
    Number(data.panoramicE) || 0, 
    Number(data.ctscanP) || 0, 
    Number(data.ctscanE) || 0
  ]);
  return true;
}

function simpanOrder(data) {
  var sheet = getSheet("Log_Order_Barang");
  var idOrder = "ORD-" + Math.floor(Math.random() * 1000000);
  sheet.appendRow([
    idOrder, 
    data.tanggal, 
    data.cabang, 
    data.kategori, 
    data.namaBarang, 
    Number(data.jumlah) || 0, 
    data.satuan, 
    "Pending", 
    data.keterangan || "-"
  ]);
  return true;
}

function simpanServis(data) {
  var sheet = getSheet("Log_Maintenance_CR");
  var idTiket = "MNT-" + Math.floor(Math.random() * 1000000);
  sheet.appendRow([
    idTiket, 
    data.tanggal, 
    data.cabang, 
    data.idAlat, 
    data.detail, 
    data.urgensi, 
    "Open / Menunggu Teknisi", 
    ""
  ]);
  return true;
}

function simpanInventori(data) {
  var sheet = getSheet("Inventori_Asset_Radiologi");
  var idAsset = "AST-" + Math.floor(Math.random() * 1000000);
  sheet.appendRow([
    idAsset, 
    data.cabang, 
    data.kategori, 
    data.merk, 
    data.sn, 
    data.tahun, 
    data.kondisi
  ]);
  return true;
}

function simpanTLD(data) {
  var sheet = getSheet("Log_Evaluasi_TLD");
  var idTLD = "TLD-" + Math.floor(Math.random() * 1000000);
  sheet.appendRow([
    idTLD, 
    new Date(), 
    data.cabang, 
    data.periode, 
    data.tahun, 
    data.namaPetugas, 
    Number(data.dosis) || 0, 
    data.keterangan
  ]);
  return true;
}

function simpanMCU(data) {
  var sheet = getSheet("Log_MCU_Petugas");
  var idMCU = "MCU-" + Math.floor(Math.random() * 1000000);
  sheet.appendRow([
    idMCU, 
    new Date(), 
    data.cabang, 
    data.namaPetugas, 
    data.tahunMCU, 
    data.tanggalMCU, 
    data.tempatMCU, 
    data.hasilMCU, 
    data.keterangan || "-"
  ]);
  return true;
}

function simpanDataPengiriman(data) {
  var sheet = getSheet("STATUS_PENGIRIMAN");
  sheet.appendRow([
    new Date(),           
    data.tglKirim,        
    data.tglTiba,         
    data.noResi,          
    data.ekspedisi,       
    data.tujuan,          
    data.keterangan,      
    data.statusTerkini || "DIKIRIM"
  ]);
  return "Sukses";
}

function konfirmasiTerimaBarang(rowIdx) {
  var sheet = getSheet("STATUS_PENGIRIMAN");
  sheet.getRange(rowIdx, 8).setValue("DITERIMA");
  return true;
}

// =========================================================================
// [MESIN-500] FUNGSI PENARIKAN DATA (READ FROM SHEET)
// =========================================================================

function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    ringkasan: { pasien: 0, film: 0, order: 0, cr: 0 },
    chart: { labels: [], pasien: [], film: [] },
    cabangList: [], // Akan diisi otomatis (Dinamis)
    tabelData: { harian: [], order: [], inventori: [], perijinan: [], logbook: [] },
    stokRendah: []
  };

  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();

  // Fungsi helper untuk mendaftarkan cabang baru secara dinamis
  function daftarCabangDinamis(namaCabang) {
    if (!namaCabang || namaCabang === "" || namaCabang === "-") return;
    if (data.cabangList.indexOf(namaCabang) === -1) {
      data.cabangList.push(namaCabang);
      data.chart.labels.push(namaCabang);
      data.chart.pasien.push(0);
      data.chart.film.push(0);
    }
  }

  // 1. Laporan Harian
  try {
    var sheetHarian = ss.getSheetByName("Log_Harian_Film");
    if(sheetHarian && sheetHarian.getLastRow() > 1) {
      var vals = sheetHarian.getDataRange().getValues();
      for(var i = vals.length - 1; i >= 1; i--) {
        var row = vals[i];
        if(!row[1]) continue;
        
        var cabangName = row[2];
        daftarCabangDinamis(cabangName);
        
        var tglAsli = new Date(row[1]);
        if(!isNaN(tglAsli.getTime()) && tglAsli.getMonth() === currentMonth && tglAsli.getFullYear() === currentYear) {
          var p1 = Number(row[4]) || 0;
          var p2 = Number(row[5]) || 0;
          var terpakai = Number(row[6]) || 0;
          
          data.ringkasan.pasien += (p1 + p2);
          data.ringkasan.film += terpakai;

          var idx = data.chart.labels.indexOf(cabangName);
          if(idx !== -1) {
            data.chart.pasien[idx] += (p1 + p2);
            data.chart.film[idx] += terpakai;
          }
        }
        if(data.tabelData.harian.length < 30) {
          data.tabelData.harian.push({
            tanggal: formatTanggalAman(row[1]), 
            cabang: row[2] || "-", 
            jenisFilm: row[3] || "-",
            p1: row[4] || 0, 
            p2: row[5] || 0, 
            terpakai: row[6] || 0, 
            rijek: row[7] || 0, 
            ket: row[8] || "-"
          });
        }
      }
    }
  } catch(e) {}

  // 2. Order Logistik
  try {
    var sheetOrder = ss.getSheetByName("Log_Order_Barang");
    if(sheetOrder && sheetOrder.getLastRow() > 1) {
      var valsOrder = sheetOrder.getDataRange().getValues();
      for(var j = valsOrder.length - 1; j >= 1; j--) {
        var rowOrd = valsOrder[j];
        if(rowOrd[7] === "Pending") data.ringkasan.order++;
        if(data.tabelData.order.length < 30) {
          data.tabelData.order.push({
            tanggal: formatTanggalAman(rowOrd[1]), 
            cabang: rowOrd[2] || "-", 
            kategori: rowOrd[3] || "-",
            nama: rowOrd[4] || "-", 
            jumlah: (rowOrd[5] || 0) + " " + (rowOrd[6] || ""), 
            status: rowOrd[7] || "-"
          });
        }
      }
    }
  } catch(e) {}

  // 3. Inventori Aset
  try {
    var sheetInv = ss.getSheetByName("Inventori_Asset_Radiologi");
    if(sheetInv && sheetInv.getLastRow() > 1) {
      var valsInv = sheetInv.getDataRange().getValues();
      for(var k = valsInv.length - 1; k >= 1; k--) {
        var rowInv = valsInv[k];
        if(data.tabelData.inventori.length < 50) {
          data.tabelData.inventori.push({
            cabang: rowInv[1] || "-", 
            kategori: rowInv[2] || "-", 
            merk: rowInv[3] || "-",
            sn: rowInv[4] || "-", 
            tahun: rowInv[5] || "-", 
            kondisi: rowInv[6] || "-"
          });
        }
      }
    }
  } catch(e) {}

  // 4. Perijinan Pesawat
  try {
    var sheetIjin = ss.getSheetByName("Data_Perijinan_X-Ray");
    if(sheetIjin && sheetIjin.getLastRow() > 1) {
      var valsIjin = sheetIjin.getDataRange().getValues();
      for(var m = 1; m < valsIjin.length; m++) {
        var rowIjin = valsIjin[m];
        data.tabelData.perijinan.push({
          cabang: rowIjin[0] || "-", 
          ktun: rowIjin[1] || "-", 
          pesawat: rowIjin[2] || "-", 
          merk: rowIjin[3] || "-",
          tglTerbit: formatTanggalAman(rowIjin[4]), 
          tglExp: formatTanggalAman(rowIjin[5]),
          tglUkes: formatTanggalAman(rowIjin[6]), 
          tglExpUkes: formatTanggalAman(rowIjin[7]), 
          status: rowIjin[8] || "-",
          link: rowIjin[9] || "" 
        });
      }
    }
  } catch(e) {}

  // 5. Kerusakan Alat
  try {
    var sheetMnt = ss.getSheetByName("Log_Maintenance_CR");
    if(sheetMnt && sheetMnt.getLastRow() > 1) {
      var valsMnt = sheetMnt.getDataRange().getValues();
      var cabangRusak = {}; 
      for(var n = 1; n < valsMnt.length; n++) {
        var status = valsMnt[n][6] || "";
        if(status.toString().indexOf("Open") !== -1 || status.toString().indexOf("Menunggu") !== -1) {
          cabangRusak[valsMnt[n][2]] = true;
        }
      }
      data.ringkasan.cr = Object.keys(cabangRusak).length;
    }
  } catch(e) {}

  // 6. Data Stok Real-time
  try {
    var valsStok = ss.getSheetByName("Log_Stok_Film").getDataRange().getValues();
    var tracker = {};
    for(var p = 1; p < valsStok.length; p++) {
      var cKey = valsStok[p][3] + "_" + valsStok[p][4]; 
      tracker[cKey] = { 
        cabang: valsStok[p][3], 
        jenis: valsStok[p][4], 
        sisaLembar: Number(valsStok[p][7]) || 0 
      };
    }
    for (var key in tracker) {
      var item = tracker[key];
      var pembagi = item.jenis.indexOf("8x10") !== -1 || item.jenis.indexOf("10x14") !== -1 ? 150 : 100;
      var sisaBox = (item.sisaLembar / pembagi).toFixed(1); 
      data.stokRendah.push({
        cabang: item.cabang,
        jenis: item.jenis,
        sisaBox: Number(sisaBox),
        sisaLembar: item.sisaLembar
      });
    }
    data.stokRendah.sort(function(a, b) { return a.sisaBox - b.sisaBox; });
  } catch(e) {}

  // 7. Logbook Pasien
  try {
    var sheetLog = ss.getSheetByName("Logbook_Pasien");
    if(sheetLog && sheetLog.getLastRow() > 1) {
      var valsLog = sheetLog.getDataRange().getValues();
      for(var q = valsLog.length - 1; q >= 1; q--) {
        var rowL = valsLog[q];
        var bulanStr = rowL[1];
        if (bulanStr instanceof Date) {
          var mm = String(bulanStr.getMonth() + 1).padStart(2, '0');
          var yy = bulanStr.getFullYear();
          bulanStr = yy + "-" + mm; 
        } else { 
          bulanStr = String(bulanStr).trim(); 
        }

        var totalPasien = (Number(rowL[3])||0) + (Number(rowL[5])||0) + (Number(rowL[7])||0) + (Number(rowL[9])||0) + (Number(rowL[11])||0);
        var totalEkspose = (Number(rowL[4])||0) + (Number(rowL[6])||0) + (Number(rowL[8])||0) + (Number(rowL[10])||0) + (Number(rowL[12])||0);
        
        data.tabelData.logbook.push({ 
          bulan: bulanStr, 
          cabang: rowL[2], 
          pasien: totalPasien, 
          ekspose: totalEkspose 
        });
      }
    }
  } catch(e) {}

  return data;
}

function getHarianMiniData(cabangFilter) {
  try {
    var data = getSheet("Log_Harian_Film").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][2] === cabangFilter) {
        res.push({ 
          tanggal: formatTanggalAman(data[i][1]), 
          cabang: data[i][2], 
          jenis: data[i][3], 
          p1: data[i][4], 
          p2: data[i][5], 
          terpakai: data[i][6], 
          rijek: data[i][7], 
          ket: data[i][8] 
        });
      }
      if (res.length >= 20) break;
    }
    return res;
  } catch(e) { return []; }
}

function getLogbookPasienMiniData(cabangFilter) {
  try {
    var data = getSheet("Logbook_Pasien").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][2] === cabangFilter) {
        var row = data[i];
        var bulanStr = row[1];
        if (bulanStr instanceof Date) {
          var mm = String(bulanStr.getMonth() + 1).padStart(2, '0');
          var yy = bulanStr.getFullYear();
          bulanStr = yy + "-" + mm;
        } else {
          bulanStr = String(bulanStr).trim();
        }
        res.push({
          bulan: bulanStr,
          cabang: row[2],
          thoraks: (row[3] || 0) + " / " + (row[4] || 0),
          musculo: (row[5] || 0) + " / " + (row[6] || 0),
          dental: (row[7] || 0) + " / " + (row[8] || 0),
          panoramic: (row[9] || 0) + " / " + (row[10] || 0),
          ctscan: (row[11] || 0) + " / " + (row[12] || 0)
        });
      }
      if (res.length >= 12) break; 
    }
    return res;
  } catch(e) { return []; }
}

function getStokMiniData(cabangFilter) {
  try {
    var data = getSheet("Log_Stok_Film").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][3] === cabangFilter) {
        res.push({ 
          tanggal: formatTanggalAman(data[i][2]), 
          cabang: data[i][3], 
          jenis: data[i][4], 
          awal: data[i][5], 
          masuk: data[i][6], 
          akhir: data[i][7], 
          pakai: data[i][8] 
        });
      }
      if (res.length >= 20) break;
    }
    return res;
  } catch(e) { return []; }
}

function getOrderMiniData(cabangFilter) {
  try {
    var data = getSheet("Log_Order_Barang").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][2] === cabangFilter) {
        res.push({ 
          tanggal: formatTanggalAman(data[i][1]), 
          cabang: data[i][2], 
          kategori: data[i][3], 
          nama: data[i][4], 
          jumlah: data[i][5], 
          satuan: data[i][6], 
          status: data[i][7], 
          ket: data[i][8] 
        });
      }
      if (res.length >= 20) break;
    }
    return res;
  } catch(e) { return []; }
}

function getServisMiniData(cabangFilter) {
  try {
    var data = getSheet("Log_Maintenance_CR").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][2] === cabangFilter) {
        res.push({ 
          tanggal: formatTanggalAman(data[i][1]), 
          cabang: data[i][2], 
          alat: data[i][3], 
          gejala: data[i][4], 
          urgensi: data[i][5], 
          status: data[i][6] 
        });
      }
      if (res.length >= 20) break;
    }
    return res;
  } catch(e) { return []; }
}

function getInventoriMiniData(cabangFilter) {
  try {
    var data = getSheet("Inventori_Asset_Radiologi").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][1] === cabangFilter) {
        res.push({ 
          cabang: data[i][1], 
          aset: data[i][2], 
          merk: data[i][3], 
          sn: data[i][4], 
          tahun: data[i][5], 
          kondisi: data[i][6] 
        });
      }
      if (res.length >= 20) break;
    }
    return res;
  } catch(e) { return []; }
}

function getTldMiniData(cabangFilter) {
  try {
    var data = getSheet("Log_Evaluasi_TLD").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][2] === cabangFilter) {
        res.push({ 
          cabang: data[i][2], 
          nama: data[i][5], 
          periode: data[i][3], 
          tahun: data[i][4], 
          dosis: data[i][6], 
          keterangan: data[i][7] 
        });
      }
      if (res.length >= 20) break;
    }
    return res;
  } catch(e) { return []; }
}

function getMcuMiniData(cabangFilter) {
  try {
    var data = getSheet("Log_MCU_Petugas").getDataRange().getValues();
    var res = [];
    for (var i = data.length - 1; i > 0; i--) {
      if (cabangFilter === "ALL" || data[i][2] === cabangFilter) {
        res.push({ 
          cabang: data[i][2], 
          nama: data[i][3], 
          tanggal: formatTanggalAman(data[i][5]), 
          tempat: data[i][6], 
          hasil: data[i][7], 
          ket: data[i][8] 
        });
      }
      if (res.length >= 20) break;
    }
    return res;
  } catch(e) { return []; }
}

function getLinkLogbookKhusus(kodeCabang) {
  try {
    var sheet = getSheet("DATABASE_LINK");
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === kodeCabang) { 
        return data[i][2]; 
      }
    }
  } catch(e){}
  return "#"; 
}

function getLinkSOPKhusus(kodeCabang) {
  try {
    var sheet = getSheet("DATABASE_SOP");
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === kodeCabang) { 
        return data[i][2]; 
      }
    }
  } catch(e){}
  return "#"; 
}

function getDataSIP(userRole, userCabang) {
  try {
    var sheet = getSheet("DATA_SIP_SIKR");
    var data = sheet.getDataRange().getValues();
    var hasil = [];

    for (var i = 1; i < data.length; i++) {
      var rowCabang = data[i][1]; 
      if (userRole === "Admin" || (userRole === "Cabang" && rowCabang === userCabang)) {
        hasil.push({
          nama: data[i][0],
          cabang: rowCabang,
          nomor: data[i][2],
          terbit: formatTanggalAman(data[i][3]),
          expired: formatTanggalAman(data[i][4]),
          status: data[i][5],
          link: data[i][6] 
        });
      }
    }
    return hasil;
  } catch(e) { return []; }
}

function getHistoriPengiriman(userRole, userCabang) {
  try {
    var sheet = getSheet("STATUS_PENGIRIMAN");
    var data = sheet.getDataRange().getValues();
    var hasil = [];

    for (var i = data.length - 1; i >= 1; i--) { 
      var baris = data[i];
      var tujuan = baris[5]; 
      var status = baris[7] || "DIKIRIM"; 

      if (userRole === "TEKNISI" || userRole === "Admin" || (userRole === "Cabang" && tujuan === userCabang)) {
        hasil.push({
          tglKirim: formatTanggalAman(baris[1]),
          estimasi: formatTanggalAman(baris[2]),
          resi: baris[3],
          ekspedisi: baris[4],
          tujuan: tujuan,
          detail: baris[6],
          status: status,
          rowIdx: i + 1 
        });
      }
    }
    return hasil;
  } catch(e) { return []; }
}

function getPeralatanMCUData() {
  try {
    var sheet = getSheet("Data_Peralatan_MCU");
    var data = sheet.getDataRange().getValues();
    var hasil = [];
    for (var i = 1; i < data.length; i++) {
      hasil.push({
        cabang: data[i][0] || "-",
        cr: data[i][1] || "-",
        xray: data[i][2] || "-",
        status: data[i][3] || "-",
        ket: data[i][4] || ""
      });
    }
    return hasil;
  } catch(e) { return []; }
}

function getAnalyticsBIData() {
  var res = {
    efisiensi: { normal: 0, rijek: 0 },
    aset: { baik: 0, ringan: 0, berat: 0 }
  };

  try {
    var valHarian = getSheet("Log_Harian_Film").getDataRange().getValues();
    for(var i = 1; i < valHarian.length; i++) {
      res.efisiensi.normal += Number(valHarian[i][6]) || 0; 
      res.efisiensi.rijek += Number(valHarian[i][7]) || 0;  
    }
  } catch(e){}

  try {
    var valAset = getSheet("Inventori_Asset_Radiologi").getDataRange().getValues();
    for(var i = 1; i < valAset.length; i++) {
      var kon = String(valAset[i][6]).toLowerCase();
      if(kon.includes("baik")) res.aset.baik++;
      else if(kon.includes("ringan")) res.aset.ringan++;
      else if(kon.includes("berat")) res.aset.berat++;
    }
  } catch(e){}

  return res;
}

// =========================================================================
// [MESIN-600] ROBOT BACKUP OTOMATIS
// =========================================================================

function jalankanBackupRotasi() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var namaFileUtama = ss.getName();
    var fileUtama = DriveApp.getFileById(ss.getId());
    var folderInduk = fileUtama.getParents().next();
    
    var waktu = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");
    var namaBackup = "BACKUP_7HARI_" + waktu + "_" + namaFileUtama;
    
    fileUtama.makeCopy(namaBackup, folderInduk);
    
    var pencarian = folderInduk.searchFiles("title contains 'BACKUP_7HARI_'");
    var daftarBackup = [];
    
    while (pencarian.hasNext()) {
      daftarBackup.push(pencarian.next());
    }
    
    daftarBackup.sort(function(a, b) {
      return b.getDateCreated() - a.getDateCreated();
    });
    
    if (daftarBackup.length > 7) {
      for (var i = 7; i < daftarBackup.length; i++) {
        daftarBackup[i].setTrashed(true);
      }
    }
  } catch(e) {}
}
