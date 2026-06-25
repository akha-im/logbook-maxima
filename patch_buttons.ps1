$content = Get-Content index.html -Raw
$content = $content.Replace('class="btn btn-primary w-100 py-2 fw-bold" id="btnSubmitHarian"', 'class="btn btn-info text-dark w-100 py-2 fw-bold" id="btnSubmitHarian"')
$content = $content.Replace('class="btn btn-primary w-100 py-2 fw-bold" id="btnSubmitStok"', 'class="btn w-100 py-2 fw-bold" style="background-color: #6366f1; color: white;" id="btnSubmitStok"')
$content = $content.Replace('class="btn btn-primary w-100 py-2 fw-bold" id="btnSubmitOrder"', 'class="btn btn-success w-100 py-2 fw-bold" id="btnSubmitOrder"')
$content = $content.Replace('class="btn btn-primary w-100 py-2 fw-bold bg-danger border-0" id="btnSubmitServis"', 'class="btn btn-danger w-100 py-2 fw-bold" id="btnSubmitServis"')
$content = $content.Replace('class="btn btn-primary w-100 py-2 fw-bold" id="btnSubmitInventori"', 'class="btn w-100 py-2 fw-bold" style="background-color: #76b900; color: white;" id="btnSubmitInventori"')
$content = $content.Replace('class="btn btn-warning w-100 py-2 fw-bold text-dark" id="btnSubmitTLD"', 'class="btn w-100 py-2 fw-bold text-dark" style="background-color: #facc15;" id="btnSubmitTLD"')
$content = $content.Replace('class="btn btn-primary w-100 py-2 fw-bold" id="btnSubmitMCU"', 'class="btn btn-danger w-100 py-2 fw-bold" id="btnSubmitMCU"')
Set-Content -Path index.html -Value $content -Encoding UTF8
