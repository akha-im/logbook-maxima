$content = Get-Content index.html -Raw
$content = $content.Replace('<i class="fa-solid fa-truck-fast text-primary me-2"></i> Input Pengiriman Logistik', '<i class="fa-solid fa-truck-fast me-2" style="color: #f97316;"></i> Input Pengiriman Logistik')
$content = $content.Replace('<button type="button" class="btn btn-success w-100 fw-bold py-2" onclick="simpanPengiriman()">', '<button type="button" class="btn w-100 fw-bold py-2" style="background-color: #f97316; color: white;" onclick="simpanPengiriman()">')
Set-Content -Path index.html -Value $content -Encoding UTF8
