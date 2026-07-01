/**
 * SISTEM LOGBOOK & LOGISTIK RADIOLOGI KLINIK MAXIMA
 * Backend API Google Apps Script (Bersih & Optimal)
 * 
 * Petunjuk Penggunaan:
 * 1. Tempelkan (paste) kode ini ke Google Apps Script Editor Anda (menggantikan kode lama).
 * 2. Deploy sebagai Aplikasi Web (Web App).
 * 3. Setel Akses ke: "Siapa saja (Anyone)".
 * 4. Salin URL Aplikasi Web untuk diintegrasikan ke app.js.
 */

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
    
    switch(action) {
      case "getDashboardData":
        responseData = getDashboardData(e.parameter.bulan);
        break;
      case "getDasborCabangData":
        responseData = getDasborCabangData(cabang, e.parameter.bulan);
        break;
      case "getHarian":
        responseData = getHarianMiniData(cabang);
        break;
      case "getStok":
        responseData = getStokMiniData(cabang);
        break;
      case "getLogbook":
        responseData = getLogbookPasienMiniData(cabang);
        break;
      case "getOrder":
        responseData = getOrderMiniData(cabang);
        break;
      case "getServis":
        responseData = getServisMiniData(cabang);
        break;
      case "getInventori":
        responseData = getInventoriMiniData(cabang);
        break;
      case "getTld":
        responseData = getTldMiniData(cabang);
        break;
      case "getMcu":
        responseData = getMcuMiniData(cabang);
        break;
      case "getAnalyticsBI":
        responseData = getAnalyticsBIData();
        break;
      case "getPeralatanMCU":
        responseData = getPeralatanMCUData();
        break;
      case "getLinkLogbook":
        responseData = getLinkLogbookKhusus(cabang);
        break;
      case "getLinkSOP":
        responseData = getLinkSOPKhusus(cabang);
        break;
      case "getDataSIP":
        responseData = getDataSIP(role, cabang);
        break;
      case "getHistoriPengiriman":
        responseData = getHistoriPengiriman(role, cabang);
        break;
      case "syncLogbook":
        responseData = syncLogbookCabang();
        break;
      case "getLogbookDashboard":
        responseData = getLogbookDashboard();
        break;
      default:
        return respondError("Aksi GET tidak dikenali.");
    }
    return respondJSON(responseData);
  } catch(err) {
    return respondError(err.message);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Tunggu sampai 30 detik agar tidak tabrakan
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var data = postData.data;
    
    if (!action) {
      return respondError("Parameter 'action' wajib disertakan dalam request POST.");
    }
    
    var result;
    switch(action) {
      case "verifyLogin":
        result = verifyLogin(postData.username, postData.password);
        break;
      case "simpanHarian":
        result = { success: simpanHarian(data) };
        break;
      case "simpanStok":
        result = { success: simpanStok(data) };
        break;
      case "simpanPasien":
        result = { success: simpanPasien(data) };
        break;
      case "simpanOrder":
        result = { success: simpanOrder(data) };
        break;
      case "simpanServis":
        result = { success: simpanServis(data) };
        break;
      case "simpanInventori":
        result = { success: simpanInventori(data) };
        break;
      case "simpanTLD":
        result = { success: simpanTLD(data) };
        break;
      case "simpanMCU":
        result = { success: simpanMCU(data) };
        break;
      case "simpanDataPengiriman":
        result = { success: simpanDataPengiriman(data) };
        break;
      case "konfirmasiTerimaBarang":
        result = { success: konfirmasiTerimaBarang(postData.rowIdx) };
        break;
      case "konfirmasiTerimaBarangDenganCatatan":
        result = { success: konfirmasiTerimaBarangDenganCatatan(data.rowIdx, data.catatan) };
        break;
      case "updateServisReport":
        result = { success: updateServisReport(data) };
        break;
      case "uploadArsipTLD":
        result = uploadArsipTLD(data);
        break;
      case "uploadArsipMCU":
        result = uploadArsipMCU(data);
        break;
      case "uploadFotoInventori":
        result = uploadFotoInventori(data);
        break;
      default:
        return respondError("Aksi POST tidak dikenali.");
    }
    return respondJSON(result);
  } catch(err) {
    return respondError(err.message);
  } finally {
    lock.releaseLock();
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

function updateServisReport(data) {
  var sheet = getSheet("Log_Maintenance_CR");
  var allData = sheet.getDataRange().getValues();
  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0] == data.idTiket) {
      sheet.getRange(i + 1, 9).setValue(data.report);
      return true;
    }
  }
  return false;
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
    data.kondisi,
    data.keterangan || ""
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

function konfirmasiTerimaBarangDenganCatatan(rowIdx, catatan) {
  var sheet = getSheet("STATUS_PENGIRIMAN");
  sheet.getRange(rowIdx, 8).setValue("DITERIMA"); // Kolom H (ke-8)
  sheet.getRange(rowIdx, 9).setValue(catatan);    // Kolom I (ke-9) untuk catatan
  return true;
}

// =========================================================================
// [MESIN-500] FUNGSI PENARIKAN DATA (READ FROM SHEET)
// =========================================================================

function getDashboardData(paramBulan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {
    ringkasan: { pasien: 0, film: 0, rijek: 0, order: 0, cr: 0 },
    chart: { labels: [], pasien: [], film: [] },
    cabangList: ['MXM-KDI', 'MXM-MKS', 'MXM-PLU', 'MXM-GTO', 'MXM-MND', 'MXM-LWK', 'MXM-BHD', 'MXM-BUB', 'MXM-BJM'],
    tabelData: { harian: [], order: [], inventori: [], perijinan: [], logbook: [] },
    stokRendah: [],
    radarAudit: { alarm1: [], alarm2: [] },
    rejectDetail: { byFilm: {}, byCabang: {}, cross: {} }
  };

  data.chart.labels = data.cabangList;
  data.chart.pasien = new Array(9).fill(0);
  data.chart.film = new Array(9).fill(0);

  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();
  if (paramBulan !== undefined && paramBulan !== "") {
    currentMonth = parseInt(paramBulan);
  }

  // 1. Laporan Harian
  try {
    var sheetHarian = ss.getSheetByName("Log_Harian_Film");
    if(sheetHarian && sheetHarian.getLastRow() > 1) {
      var vals = sheetHarian.getDataRange().getValues();
      for(var i = vals.length - 1; i >= 1; i--) {
        var row = vals[i];
        if(!row[1]) continue;
        
        var tglAsli = new Date(row[1]);
        if(!isNaN(tglAsli.getTime()) && tglAsli.getMonth() === currentMonth && tglAsli.getFullYear() === currentYear) {
          var p1 = Number(row[4]) || 0;
          var p2 = Number(row[5]) || 0;
          var terpakai = Number(row[6]) || 0;
          var rijek = Number(row[7]) || 0;
          var cabang = String(row[2] || "").trim();
          var jenisFilm = String(row[3] || "").trim();
          
          data.ringkasan.pasien += (p1 + p2);
          data.ringkasan.film += terpakai;
          data.ringkasan.rijek += rijek;
          
          if(rijek > 0) {
            if(!data.rejectDetail.byFilm[jenisFilm]) data.rejectDetail.byFilm[jenisFilm] = 0;
            data.rejectDetail.byFilm[jenisFilm] += rijek;
            
            if(!data.rejectDetail.byCabang[cabang]) data.rejectDetail.byCabang[cabang] = 0;
            data.rejectDetail.byCabang[cabang] += rijek;
            
            if(!data.rejectDetail.cross[cabang]) data.rejectDetail.cross[cabang] = {};
            if(!data.rejectDetail.cross[cabang][jenisFilm]) data.rejectDetail.cross[cabang][jenisFilm] = 0;
            data.rejectDetail.cross[cabang][jenisFilm] += rijek;
          }

          var idx = data.cabangList.indexOf(cabang);
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
            id: String(rowInv[0] || ""),
            cabang: rowInv[1] || "-", 
            kategori: rowInv[2] || "-", 
            merk: rowInv[3] || "-",
            sn: rowInv[4] || "-", 
            tahun: rowInv[5] || "-", 
            kondisi: rowInv[6] || "-",
            keterangan: String(rowInv[7] || ""),
            linkArsip: String(rowInv[8] || "")
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
      var pembagi = (item.jenis.indexOf("8x10") !== -1 && item.jenis.indexOf("Kertas Photo") === -1) || item.jenis.indexOf("10x14") !== -1 ? 150 : 100;
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

  // 6. Radar Audit Pusat (Alarm 1 & Alarm 2)
  try {
    var sheetAudit = ss.getSheetByName("Radar_Audit_Pusat");
    if(sheetAudit && sheetAudit.getLastRow() > 2) {
      var valsAudit = sheetAudit.getRange(3, 1, sheetAudit.getLastRow() - 2, 20).getDisplayValues();
      
      for(var i = 0; i < valsAudit.length; i++) {
        var row = valsAudit[i];
        
        // Cek Alarm 1
        var status1 = String(row[8] || "").trim(); // STATUS KESIMPULAN (Kolom I)
        if(status1 !== "" && status1 !== "AMAN") {
          data.radarAudit.alarm1.push({
            cabang: row[1],          // B
            jenisFilm: row[2],       // C
            harianDipakai: row[3],   // D
            harianRusak: row[4],     // E
            stokKeluar: row[5],      // F
            selisih: row[6],         // G
            persenReject: row[7],    // H
            status: status1          // I
          });
        }
        
        // Cek Alarm 2 (Dimulai dari Kolom K / Index 10)
        var status2 = String(row[17] || "").trim(); // ANALISIS RASIO (Kolom R)
        if(status2 !== "" && status2 !== "AMAN" && row[11] !== "") { 
          data.radarAudit.alarm2.push({
            cabang: row[11],         // L
            logbookPasien: row[12],  // M
            harianPasien: row[13],   // N
            selisihPasien: row[14],  // O
            harianFilm: row[15],     // P
            rasioFilm: row[16],      // Q
            status: status2          // R
          });
        }
      }
    }
  } catch(e) {}

  return data;
}
function getDasborCabangData(cabang, paramBulan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var data = {
    ringkasan: { pasien: 0, film: 0, rijek: 0, order: 0 },
    chartHarian: { labels: [], pasien: [], film: [], rijek: [] },
    stokRendah: [],
    laporanServis: []
  };
  
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();
  var isDefaultMonth = false;
  
  if (paramBulan !== undefined && paramBulan !== "") {
    currentMonth = parseInt(paramBulan);
  } else {
    isDefaultMonth = true;
  }
  
  var valsHarian = [];
  try {
    var sheetHarian = ss.getSheetByName("Log_Harian_Film");
    if(sheetHarian && sheetHarian.getLastRow() > 1) {
      valsHarian = sheetHarian.getDataRange().getValues();
      if(isDefaultMonth) {
        // Cari bulan terakhir yang ada datanya untuk cabang ini, khusus jika bulan default
        for(var i = valsHarian.length - 1; i >= 1; i--) {
          var row = valsHarian[i];
          if(!row[1] || row[2] !== cabang) continue;
          var tglAsli = new Date(row[1]);
          if(!isNaN(tglAsli.getTime())) {
            currentMonth = tglAsli.getMonth();
            currentYear = tglAsli.getFullYear();
            break;
          }
        }
      }
    }
  } catch(e) {}
  
  // Set chart labels to days 1..31
  var maxDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  for(var d=1; d<=maxDays; d++) {
    data.chartHarian.labels.push(d);
    data.chartHarian.pasien.push(0);
    data.chartHarian.film.push(0);
    data.chartHarian.rijek.push(0);
  }
  
  // 1. Log Harian Film (Tarik data untuk chart)
  try {
    if(valsHarian.length > 1) {
      for(var i = valsHarian.length - 1; i >= 1; i--) {
        var row = valsHarian[i];
        if(!row[1] || row[2] !== cabang) continue;
        
        var tglAsli = new Date(row[1]);
        if(!isNaN(tglAsli.getTime()) && tglAsli.getMonth() === currentMonth && tglAsli.getFullYear() === currentYear) {
          var p1 = Number(row[4]) || 0;
          var p2 = Number(row[5]) || 0;
          var terpakai = Number(row[6]) || 0;
          var rijek = Number(row[7]) || 0;
          
          var day = tglAsli.getDate();
          var idx = day - 1;
          data.chartHarian.pasien[idx] += (p1 + p2);
          data.chartHarian.film[idx] += terpakai;
          data.chartHarian.rijek[idx] += rijek;
        }
      }
    }
  } catch(e) {}
  
  // 1b. Ambil Ringkasan dari Data_Sync_Logbook (Sesuai Dashboard Logbook)
  try {
    var syncSheet = ss.getSheetByName("Data_Sync_Logbook");
    if(syncSheet) {
      var syncData = syncSheet.getDataRange().getValues();
      for(var s = 1; s < syncData.length; s++) {
        if(syncData[s][0] === cabang) {
          var parsed = JSON.parse(syncData[s][2]);
          data.ringkasan.pasien = parsed.grandTotal || 0;
          data.ringkasan.film = (parsed.totalFilm && parsed.totalFilm.terpakai) ? parsed.totalFilm.terpakai : 0;
          data.ringkasan.rijek = (parsed.totalFilm && parsed.totalFilm.rijek) ? parsed.totalFilm.rijek : 0;
          break;
        }
      }
    }
  } catch(e) {}
  
  // 2. Order Logistik
  try {
    var sheetOrder = ss.getSheetByName("Log_Order_Barang");
    if(sheetOrder && sheetOrder.getLastRow() > 1) {
      var valsOrd = sheetOrder.getDataRange().getValues();
      for(var j = valsOrd.length - 1; j >= 1; j--) {
        var rowOrd = valsOrd[j];
        if(!rowOrd[1] || rowOrd[2] !== cabang) continue;
        
        var tglOrd = new Date(rowOrd[1]);
        if(!isNaN(tglOrd.getTime()) && tglOrd.getMonth() === currentMonth && tglOrd.getFullYear() === currentYear) {
          data.ringkasan.order++;
        }
      }
    }
  } catch(e) {}
  
  // 3. Peringatan Stok Terendah (Semua Cabang, Sesuai Dasbor Pusat)
  try {
    var valsStok = ss.getSheetByName("Log_Stok_Film").getDataRange().getValues();
    var tracker = {};
    for(var p = 1; p < valsStok.length; p++) {
      if (valsStok[p][3] !== cabang) continue; // Filter hanya untuk cabang ini
      var cKey = valsStok[p][3] + "_" + valsStok[p][4]; 
      tracker[cKey] = { 
        cabang: valsStok[p][3], 
        jenis: valsStok[p][4], 
        sisaLembar: Number(valsStok[p][7]) || 0 
      };
    }
    for (var key in tracker) {
      var item = tracker[key];
      var pembagi = (item.jenis.indexOf("8x10") !== -1 && item.jenis.indexOf("Kertas Photo") === -1) || item.jenis.indexOf("10x14") !== -1 ? 150 : 100;
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
  
  // 4. Laporan Servis (10 terakhir untuk cabang ini)
  try {
    var sheetServis = ss.getSheetByName("Log_Servis_Alat");
    if(sheetServis && sheetServis.getLastRow() > 1) {
      var valsSrv = sheetServis.getDataRange().getValues();
      for(var s = valsSrv.length - 1; s >= 1; s--) {
        var rSrv = valsSrv[s];
        if(rSrv[2] === cabang) {
          data.laporanServis.push({
            tanggal: formatTanggalAman(rSrv[1]),
            namaAlat: rSrv[3],
            keluhan: rSrv[4],
            status: rSrv[7] || "Dilaporkan"
          });
          if(data.laporanServis.length >= 10) break;
        }
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
          id: data[i][0],
          tanggal: formatTanggalAman(data[i][1]), 
          cabang: data[i][2], 
          alat: data[i][3], 
          gejala: data[i][4], 
          urgensi: data[i][5], 
          status: data[i][6],
          report: data[i][8] || ""
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
          id: data[i][0],
          cabang: data[i][1], 
          aset: data[i][2], 
          merk: data[i][3], 
          sn: data[i][4], 
          tahun: data[i][5], 
          kondisi: data[i][6],
          keterangan: data[i][7] ? data[i][7] : "",
          linkArsip: data[i][8] ? data[i][8] : ""
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
        
        // Asumsi "Link Arsip" ada di kolom terakhir atau dicari via header
        var headers = data[0];
        var link = "";
        for(var c=0; c<headers.length; c++){
          if(headers[c].toString().toLowerCase().indexOf("link arsip") > -1){
            link = data[i][c] || "";
            break;
          }
        }
        
        res.push({ 
          id: data[i][0],
          cabang: data[i][2], 
          nama: data[i][5], 
          periode: data[i][3], 
          tahun: data[i][4], 
          dosis: data[i][6], 
          keterangan: data[i][7],
          linkArsip: link
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
        
        var headers = data[0];
        var link = "";
        for(var c=0; c<headers.length; c++){
          if(headers[c].toString().toLowerCase().indexOf("link arsip") > -1){
            link = data[i][c] || "";
            break;
          }
        }
        
        res.push({ 
          id: data[i][0],
          cabang: data[i][2], 
          nama: data[i][3], 
          tanggal: formatTanggalAman(data[i][5]), 
          tempat: data[i][6], 
          hasil: data[i][7], 
          ket: data[i][8],
          linkArsip: link
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
          catatan: baris[8] || "",
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

function uploadArsipTLD(data) {
  try {
    var folderUtamaId = "1W0Yj7RXxVIFGB7YhrrUu7qtQ2d5cWGbG"; // ID Folder Utama
    var folderUtama = DriveApp.getFolderById(folderUtamaId);
    
    // Cari atau buat subfolder cabang
    var subfolders = folderUtama.getFoldersByName(data.cabang);
    var folderCabang;
    if (subfolders.hasNext()) {
      folderCabang = subfolders.next();
    } else {
      folderCabang = folderUtama.createFolder(data.cabang);
    }
    
    // Simpan file
    var decodedData = Utilities.base64Decode(data.base64Data);
    var blob = Utilities.newBlob(decodedData, data.mimeType, data.filename);
    var file = folderCabang.createFile(blob);
    var fileUrl = file.getUrl();
    
    // Simpan link ke sheet Evaluasi TLD
    var sheet = getSheet("Log_Evaluasi_TLD");
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var linkColIndex = -1;
    
    for(var c = 0; c < headers.length; c++){
      if(headers[c].toString().toLowerCase().indexOf("link arsip") > -1) {
        linkColIndex = c + 1;
        break;
      }
    }
    
    if(linkColIndex === -1) {
      // Jika kolom tidak ditemukan, buat di kolom terakhir + 1
      linkColIndex = headers.length + 1;
      sheet.getRange(1, linkColIndex).setValue("Link Arsip");
    }
    
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][0] == data.idTiket) {
        sheet.getRange(i + 1, linkColIndex).setValue(fileUrl);
        return { success: true, url: fileUrl };
      }
    }
    return { success: false, error: "Data TLD tidak ditemukan di Spreadsheet." };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function uploadArsipMCU(data) {
  try {
    var folderUtamaId = "1PJiDL5O6sY1lFZTb-lxUQkk9uhg2VqAi"; // ID Folder MCU
    var folderUtama = DriveApp.getFolderById(folderUtamaId);
    
    // Cari atau buat subfolder cabang
    var subfolders = folderUtama.getFoldersByName(data.cabang);
    var folderCabang;
    if (subfolders.hasNext()) {
      folderCabang = subfolders.next();
    } else {
      folderCabang = folderUtama.createFolder(data.cabang);
    }
    
    // Simpan file
    var decodedData = Utilities.base64Decode(data.base64Data);
    var blob = Utilities.newBlob(decodedData, data.mimeType, data.filename);
    var file = folderCabang.createFile(blob);
    var fileUrl = file.getUrl();
    
    // Simpan link ke sheet MCU
    var sheet = getSheet("Log_MCU_Petugas");
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var linkColIndex = -1;
    
    for(var c = 0; c < headers.length; c++){
      if(headers[c].toString().toLowerCase().indexOf("link arsip") > -1) {
        linkColIndex = c + 1;
        break;
      }
    }
    
    if(linkColIndex === -1) {
      linkColIndex = headers.length + 1;
      sheet.getRange(1, linkColIndex).setValue("Link Arsip");
    }
    
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][0] == data.idTiket) {
        sheet.getRange(i + 1, linkColIndex).setValue(fileUrl);
        return { success: true, url: fileUrl };
      }
    }
    return { success: false, error: "Data MCU tidak ditemukan di Spreadsheet." };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function uploadFotoInventori(data) {
  try {
    var folderUtamaId = "13uYVFDn20AjOe5EqvqgBq4zrNRo7wlMs"; // Folder Inventori dari User
    var folderUtama = DriveApp.getFolderById(folderUtamaId);
    
    // Cari atau buat subfolder cabang
    var subfolders = folderUtama.getFoldersByName(data.cabang);
    var folderCabang;
    if (subfolders.hasNext()) {
      folderCabang = subfolders.next();
    } else {
      folderCabang = folderUtama.createFolder(data.cabang);
    }
    
    var fileUrl = "";
    if (data.base64Data && data.base64Data.trim() !== "") {
      var decodedData = Utilities.base64Decode(data.base64Data);
      var blob = Utilities.newBlob(decodedData, data.mimeType, data.filename);
      var file = folderCabang.createFile(blob);
      fileUrl = file.getUrl();
    }
    
    var sheet = getSheet("Inventori_Asset_Radiologi");
    var allData = sheet.getDataRange().getValues();
    
    // Cari baris aset berdasarkan ID (Index 0)
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][0] == data.idAsset) { 
        if (data.keterangan !== undefined && data.keterangan !== null && data.keterangan.trim() !== "") {
           sheet.getRange(i + 1, 8).setValue(data.keterangan); // Kolom H (ke-8)
        }
        if (fileUrl !== "") {
           sheet.getRange(i + 1, 9).setValue(fileUrl); // Kolom I (ke-9)
        }
        return { success: true, url: fileUrl };
      }
    }
    
    return { success: false, error: "Data aset tidak ditemukan" };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// =========================================================================
// [MESIN-700] SINKRONISASI LOGBOOK CABANG
// =========================================================================

function getBranchLinks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var links = []; 
  for(var i=0; i<sheets.length; i++) {
    var sheet = sheets[i];
    var data = sheet.getDataRange().getValues();
    for(var r=0; r<data.length; r++) {
      for(var c=0; c<data[r].length; c++) {
        var val = String(data[r][c]);
        if(val.indexOf("docs.google.com/spreadsheets") > -1) {
          for(var k=0; k<data.length; k++) {
             var possibleUrl = String(data[k][c]);
             if(possibleUrl.indexOf("http") > -1) {
                var cabang = String(data[k][0]).trim();
                if(cabang && cabang.toLowerCase() !== "cabang" && cabang.toLowerCase() !== "nama cabang") {
                   links.push({cabang: cabang, url: possibleUrl});
                }
             }
          }
          return links;
        }
      }
    }
  }
  return links;
}

function syncLogbookCabang() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var links = getBranchLinks();
  if(links.length === 0) return {status: "error", message: "Tidak menemukan link spreadsheet logbook cabang di database."};
  
  var syncSheet = ss.getSheetByName("Data_Sync_Logbook");
  if(!syncSheet) {
    syncSheet = ss.insertSheet("Data_Sync_Logbook");
    syncSheet.appendRow(["Cabang", "Last Sync", "Data JSON"]);
  }
  
  var existingData = syncSheet.getDataRange().getValues();
  var rowMap = {};
  for(var i=1; i<existingData.length; i++) {
    rowMap[existingData[i][0]] = i + 1;
  }
  
  var results = [];
  
  for(var i=0; i<links.length; i++) {
    var cabang = links[i].cabang;
    var url = links[i].url;
    
    try {
      var targetSs = SpreadsheetApp.openByUrl(url);
      
      // 1. Ekstrak Rekap Pasien (STATE MACHINE)
      var rekapLogSheet = targetSs.getSheetByName("REKAP LOG RADIOLOGI") || targetSs.getSheetByName("REKAP_LOG_RADIOLOGI");
      var rekapPasienData = rekapLogSheet ? rekapLogSheet.getDataRange().getValues() : [];
      
      var currentPem = "";
      var currentKatD = "";
      var currentKatE = "";
      var rekapPasien = {};
      
      // Mulai baca dari baris ke-5 (index 4) ke bawah
      for(var r=4; r<rekapPasienData.length; r++) {
        var row = rekapPasienData[r];
        
        var cVal = String(row[2] || "").trim(); // Col C (Pemeriksaan)
        var dVal = String(row[3] || "").trim(); // Col D (Umum/MCU dll)
        var eVal = String(row[4] || "").trim(); // Col E (Nama PT / APS / APD)
        var gVal = parseInt(row[6], 10);        // Col G (Jumlah Pasien)
        
        // Cek baris total keseluruhan (berhenti membaca)
        var isTotalRow = false;
        for(var c=0; c<row.length; c++) {
           if(String(row[c]).toUpperCase().trim() === "TOTAL") {
               isTotalRow = true; break;
           }
        }
        if(isTotalRow) break;
        
        // Update State Memory jika ada isi
        if(cVal !== "") currentPem = cVal;
        if(dVal !== "") currentKatD = dVal;
        if(eVal !== "") currentKatE = eVal;
        
        // Jika belum ada nama pemeriksaan, lewati
        if(currentPem === "" || currentPem.toUpperCase() === "PEMERIKSAAN") continue;
        
        // Tentukan Kategori untuk baris ini berdasarkan State Machine
        var category = "";
        var dUpper = currentKatD.toUpperCase();
        var eUpper = currentKatE.toUpperCase();
        
        if(dUpper === "MCU" || eUpper === "MCU") {
            category = "MCU";
        } else if(eUpper === "APS") {
            category = "APS";
        } else if(eUpper === "APD") {
            category = "APD";
        }
        
        // Masukkan nilai jika kategorinya valid dan jumlah pasien ada
        if(category !== "" && !isNaN(gVal)) {
            var keyPem = currentPem.toUpperCase();
            if(!rekapPasien[keyPem]) {
                rekapPasien[keyPem] = { APS: 0, APD: 0, MCU: 0, Total: 0 };
            }
            rekapPasien[keyPem][category] += gVal;
            rekapPasien[keyPem].Total += gVal;
        }
      }
      
      // Calculate Grand Total from rekapPasien keys
      var grandTotalPasien = 0;
      for(var key in rekapPasien) {
         grandTotalPasien += (rekapPasien[key].Total || 0);
      }
      
      // 2. Ekstrak Rekap Film (STATE MACHINE)
      var rekapFilmSheet = targetSs.getSheetByName("REKAP_PEMAKAIAN_FILM");
      var rekapFilmData = rekapFilmSheet ? rekapFilmSheet.getDataRange().getValues() : [];
      
      var currentMod = "";
      var rekapFilm = [];
      var totalFilmTerpakai = 0;
      var totalFilmRijek = 0;
      var totalFilmStatus = "";
      
      // Mulai baca dari baris yang masuk akal
      for(var r=0; r<rekapFilmData.length; r++) {
        var row = rekapFilmData[r];
        
        var bVal = String(row[1] || "").trim(); // Col B (Modalitas)
        var cVal = String(row[2] || "").trim(); // Col C (Ukuran)
        var dVal = parseInt(row[3], 10);        // Col D (Terpakai)
        var eVal = parseInt(row[4], 10);        // Col E (Rijek)
        var fVal = String(row[5] || "").trim(); // Col F (Status Evaluasi)
        
        var isTotalRow = false;
        for(var c=0; c<row.length; c++) {
           if(String(row[c]).toUpperCase().trim() === "TOTAL") {
               isTotalRow = true; 
               totalFilmTerpakai = isNaN(dVal) ? 0 : dVal;
               totalFilmRijek = isNaN(eVal) ? 0 : eVal;
               totalFilmStatus = fVal;
               break;
           }
        }
        if(isTotalRow) break;
        
        if(bVal !== "" && bVal.toUpperCase() !== "MODALITAS") {
            currentMod = bVal;
        }
        
        if(currentMod !== "" && cVal !== "" && cVal.toUpperCase() !== "UKURAN FILM") {
            var displayUkuran = cVal;
            // Format Bulan Laporan date to DD-MM-YYYY
            if(currentMod.toLowerCase().indexOf("bulan") > -1 && String(cVal).length > 20) {
               try {
                  var d = new Date(cVal);
                  if(!isNaN(d.getTime())) {
                     var dd = String(d.getDate()).padStart(2, '0');
                     var mm = String(d.getMonth() + 1).padStart(2, '0');
                     var yyyy = d.getFullYear();
                     displayUkuran = dd + "-" + mm + "-" + yyyy;
                  }
               } catch(e){}
            }
            
            rekapFilm.push({
                modalitas: currentMod,
                ukuran: displayUkuran,
                terpakai: isNaN(dVal) ? 0 : dVal,
                rijek: isNaN(eVal) ? 0 : eVal,
                status: fVal
            });
        }
      }
      
      // 3. Ekstrak Tabel 2 & 4 dari REKAP_3 (Sesuai Format Seragam 9 Cabang)
      var rekap3Sheet = targetSs.getSheetByName("REKAP_3");
      var rekap3Data = rekap3Sheet ? rekap3Sheet.getDataRange().getValues() : [];
      var table2Film = [];
      var table4Audit = [];
      
      if(rekap3Data.length >= 25) { // Pastikan baris cukup
        try {
          var currentModT2 = "";
          // Tabel 2: A15 sampai H25 (Baris Index 14 sampai 24)
          for(var r=14; r<=24; r++) {
            var row = rekap3Data[r];
            var aVal = String(row[0] || "").trim(); // Col A (Modalitas)
            var bVal = String(row[1] || "").trim(); // Col B (Jenis Film)
            var cVal = parseInt(row[2], 10);        // Col C
            var dVal = parseInt(row[3], 10);        // Col D
            var eVal = parseInt(row[4], 10);        // Col E
            var fVal = parseInt(row[5], 10);        // Col F
            var gVal = row[6] !== undefined ? row[6] : ""; // Col G (% Rijek)
            var hVal = String(row[7] || "").trim(); // Col H (Status Audit)
            
            if(aVal.toUpperCase() === "MODALITAS" || bVal.toUpperCase() === "JENIS FILM") continue;
            
            if(aVal !== "") currentModT2 = aVal;
            
            if(aVal.toUpperCase() === "TOTAL") {
               table2Film.push({
                  modalitas: "TOTAL",
                  jenisFilm: "",
                  pasienMasuk: isNaN(cVal) ? 0 : cVal,
                  tidakCetak: isNaN(dVal) ? 0 : dVal,
                  aktualTerpakai: isNaN(eVal) ? 0 : eVal,
                  filmRijek: isNaN(fVal) ? 0 : fVal,
                  errorRate: gVal,
                  statusAudit: hVal,
                  isTotal: true
               });
            } else if(currentModT2 !== "" && bVal !== "" && bVal.toUpperCase() !== "TOTAL") {
               table2Film.push({
                  modalitas: currentModT2,
                  jenisFilm: bVal,
                  pasienMasuk: isNaN(cVal) ? 0 : cVal,
                  tidakCetak: isNaN(dVal) ? 0 : dVal,
                  aktualTerpakai: isNaN(eVal) ? 0 : eVal,
                  filmRijek: isNaN(fVal) ? 0 : fVal,
                  errorRate: gVal, // Format persentase di-handle di frontend
                  statusAudit: hVal,
                  isTotal: false
               });
            }
          }
          
          // Tabel 4: K15 sampai N20 (Baris Index 14 sampai 19)
          for(var r=14; r<=19; r++) {
             var row = rekap3Data[r];
             var kVal = String(row[10] || "").trim(); // Col K
             var lVal = parseInt(row[11], 10);        // Col L
             var mVal = parseInt(row[12], 10);        // Col M
             var nVal = String(row[13] || "").trim(); // Col N
             
             if(kVal.toUpperCase() === "UKURAN FILM" || kVal.toUpperCase() === "UKURAN") continue;
             
             if(kVal !== "" && kVal.toUpperCase() !== "TOTAL") {
                 table4Audit.push({
                    ukuranFilm: kVal,
                    totalLogbook: isNaN(lVal) ? 0 : lVal,
                    opnameGudang: isNaN(mVal) ? 0 : mVal,
                    statusGudang: nVal
                 });
             }
          }
        } catch(err) {
           Logger.log("Error REKAP_3 Hardcoded: " + err);
        }
      }
      
      var finalData = {
        pasien: rekapPasien,
        film: rekapFilm,
        rekap3_film: table2Film,
        rekap3_audit: table4Audit,
        grandTotal: grandTotalPasien,
        totalFilm: {
            terpakai: totalFilmTerpakai,
            rijek: totalFilmRijek,
            status: totalFilmStatus
        }
      };
      
      var jsonStr = JSON.stringify(finalData);
      var timestamp = new Date().toLocaleString("id-ID");
      
      if(rowMap[cabang]) {
        syncSheet.getRange(rowMap[cabang], 2, 1, 2).setValues([[timestamp, jsonStr]]);
      } else {
        syncSheet.appendRow([cabang, timestamp, jsonStr]);
        rowMap[cabang] = syncSheet.getLastRow();
      }
      
      results.push({cabang: cabang, status: "success", total: grandTotalPasien});
      
    } catch(e) {
      results.push({cabang: cabang, status: "error", message: e.toString()});
    }
  }
  
  return {status: "ok", results: results};
}

function getLogbookDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var syncSheet = ss.getSheetByName("Data_Sync_Logbook");
  if(!syncSheet) return {status: "empty"};
  
  var data = syncSheet.getDataRange().getValues();
  var dashboardData = [];
  
  for(var i=1; i<data.length; i++) {
    var cabang = data[i][0];
    var lastSync = data[i][1];
    var jsonStr = data[i][2];
    try {
      var parsed = JSON.parse(jsonStr);
      parsed.cabang = cabang;
      parsed.lastSync = lastSync;
      dashboardData.push(parsed);
    } catch(e) {}
  }
  return {status: "ok", data: dashboardData};
}
