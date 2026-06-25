const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const funcCode = `
function getBadgeCabang(cabang) {
  if (!cabang || cabang === "-") return "-";
  var c = cabang.toUpperCase().trim();
  var bg = "#334155";
  var color = "#fff";
  
  if (c.includes("KDI")) bg = "#0ea5e9";
  else if (c.includes("MKS")) bg = "#ef4444";
  else if (c.includes("PLU")) bg = "#10b981";
  else if (c.includes("GTO")) bg = "#8b5cf6";
  else if (c.includes("MND")) { bg = "#f59e0b"; color = "#000"; }
  else if (c.includes("LWK")) bg = "#ec4899";
  else if (c.includes("BHD")) bg = "#14b8a6";
  else if (c.includes("BUB")) bg = "#f97316";
  else if (c.includes("BJM")) bg = "#3b82f6";
  
  return '<span class="badge" style="background-color:' + bg + '; color:' + color + '; font-weight:700; padding:5px 8px; border-radius:6px; letter-spacing:0.5px;">' + cabang + '</span>';
}

`;

if (!content.includes('function getBadgeCabang')) {
  content = content.replace('var currentCabang = "";', funcCode + 'var currentCabang = "";');
}

content = content.replace(/'<td><span class="badge bg-primary">' \+ row\.cabang \+ '<\/span><\/td>'/g, "'<td class=\"fw-bold text-center\">' + getBadgeCabang(row.cabang) + '</td>'");
content = content.replace(/'<td class="fw-bold">' \+ row\.cabang \+ '<\/td>'/g, "'<td class=\"fw-bold text-center\">' + getBadgeCabang(row.cabang) + '</td>'");
content = content.replace(/'<td><span class="badge bg-dark">' \+ row\.cabang \+ '<\/span><\/td>'/g, "'<td class=\"fw-bold text-center\">' + getBadgeCabang(row.cabang) + '</td>'");
content = content.replace(/'<td class="fw-bold text-start">' \+ \(row\.cabang \|\| "-"\) \+ '<\/td>'/g, "'<td class=\"fw-bold text-start\">' + getBadgeCabang(row.cabang) + '</td>'");
content = content.replace(/<td class="fw-bold"><span class="badge bg-secondary">\$\{row\.cabang\}<\/span><\/td>/g, "<td class=\"fw-bold text-center\">${getBadgeCabang(row.cabang)}</td>");
content = content.replace(/<td><span class="badge bg-primary">\$\{row\.cabang\}<\/span><\/td>/g, "<td class=\"fw-bold text-center\">${getBadgeCabang(row.cabang)}</td>");
content = content.replace(/<td><span class="badge bg-primary">\$\{row\.cabang\}<\/span><br><small class="fw-bold">\$\{row\.alat\}<\/small><\/td>/g, "<td class=\"fw-bold text-center\">${getBadgeCabang(row.cabang)}<br><small class=\"fw-bold\">${row.alat}</small></td>");

fs.writeFileSync('app.js', content, 'utf8');
console.log("Done updating app.js");
