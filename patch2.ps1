$indexContent = Get-Content index.html -Raw
$indexContent = $indexContent.Replace('<button type="button" class="btn btn-primary w-100 fw-bold py-2" onclick="simpanPengiriman()">', '<button type="button" class="btn w-100 fw-bold py-2" style="background-color: #f97316; color: white;" onclick="simpanPengiriman()">')
Set-Content -Path index.html -Value $indexContent -Encoding UTF8

$appContent = Get-Content app.js -Raw
$appContent = $appContent.Replace('if (c.includes("KDI")) bg = "#0ea5e9";', 'if (c.includes("KDI")) bg = "#76b900";')
$appContent = $appContent.Replace('if (cUpper.includes("KDI")) { bgColor = "#0ea5e9"; txtColor = "#fff"; }', 'if (cUpper.includes("KDI")) { bgColor = "#76b900"; txtColor = "#fff"; }')
Set-Content -Path app.js -Value $appContent -Encoding UTF8
