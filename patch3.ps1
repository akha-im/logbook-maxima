$indexContent = Get-Content index.html -Raw
$indexContent = $indexContent.Replace('class="btn btn-danger w-100 py-2 fw-bold" id="btnSubmitMCU"', 'class="btn w-100 py-2 fw-bold" style="background-color: #be123c; color: white;" id="btnSubmitMCU"')
Set-Content -Path index.html -Value $indexContent -Encoding UTF8
