var fso = new ActiveXObject("Scripting.FileSystemObject");

function readFile(path) {
    var f = fso.OpenTextFile(path, 1);
    var content = f.ReadAll();
    f.Close();
    return content;
}

function writeFile(path, content) {
    var f = fso.OpenTextFile(path, 2, true);
    f.Write(content);
    f.Close();
}

try {
    var appJs = readFile("app.js");

    var newGetBadgeCabang = "function getBadgeCabang(cabang) {\n" +
    "    if (!cabang || cabang === \"-\") return \"-\";\n" +
    "    var c = cabang.toUpperCase().trim();\n" +
    "    var bg = \"#334155\";\n" +
    "    var color = \"#fff\";\n" +
    "    if (c.includes(\"KDI\")) bg = \"linear-gradient(135deg, #1e3a8a, #3b82f6)\";\n" +
    "    else if (c.includes(\"MKS\")) bg = \"#ef4444\";\n" +
    "    else if (c.includes(\"BJM\")) bg = \"#76b900\";\n" +
    "    else if (c.includes(\"PLU\")) { bg = \"#eab308\"; color = \"#000\"; }\n" +
    "    else if (c.includes(\"GTO\")) bg = \"#166534\";\n" +
    "    else if (c.includes(\"MND\")) bg = \"#f97316\";\n" +
    "    else if (c.includes(\"LWK\")) bg = \"#ec4899\";\n" +
    "    else if (c.includes(\"BHD\") || c.includes(\"DIHD\")) bg = \"#8b4513\";\n" +
    "    else if (c.includes(\"KLK\")) bg = \"#334155\";\n" +
    "    else if (c.includes(\"MMJ\")) bg = \"linear-gradient(135deg, #000000, #6b7280)\";\n" +
    "    else if (c.includes(\"PLK\")) bg = \"linear-gradient(135deg, #0ea5e9, #10b981)\";\n" +
    "    else if (c.includes(\"BUB\")) bg = \"#ea580c\";\n" +
    "    return '<span class=\"badge\" style=\"background:' + bg + '; color:' + color + '; font-weight:700; padding:6px 10px; border-radius:6px; letter-spacing:0.5px; box-shadow:0 2px 4px rgba(0,0,0,0.1);\">' + cabang + '</span>';\n" +
    "}";

    appJs = appJs.replace(/function getBadgeCabang\(cabang\) \{[\s\S]*?\}\s*(?=\n\s*window\.onload)/, newGetBadgeCabang + "\n");

    var cardRegex = /var bgColor = "#e2e8f0";[\s\S]*?style="background-color: \$\{bgColor\}; color: \$\{txtColor\};">/g;
    var newCardLogic = "var bgColor = \"#e2e8f0\";\n" +
    "        var txtColor = \"#fff\";\n" +
    "        var borderColor = \"#334155\";\n" +
    "        var cUpper = cabang.toUpperCase().trim();\n" +
    "        if (cUpper.includes(\"KDI\")) { bgColor = \"linear-gradient(135deg, #1e3a8a, #3b82f6)\"; borderColor = \"#1e3a8a\"; }\n" +
    "        else if (cUpper.includes(\"MKS\")) { bgColor = \"#ef4444\"; borderColor = \"#ef4444\"; }\n" +
    "        else if (cUpper.includes(\"BJM\")) { bgColor = \"#76b900\"; borderColor = \"#76b900\"; }\n" +
    "        else if (cUpper.includes(\"PLU\")) { bgColor = \"#eab308\"; txtColor = \"#000\"; borderColor = \"#ca8a04\"; }\n" +
    "        else if (cUpper.includes(\"GTO\")) { bgColor = \"#166534\"; borderColor = \"#166534\"; }\n" +
    "        else if (cUpper.includes(\"MND\")) { bgColor = \"#f97316\"; borderColor = \"#f97316\"; }\n" +
    "        else if (cUpper.includes(\"LWK\")) { bgColor = \"#ec4899\"; borderColor = \"#ec4899\"; }\n" +
    "        else if (cUpper.includes(\"BHD\") || cUpper.includes(\"DIHD\")) { bgColor = \"#8b4513\"; borderColor = \"#8b4513\"; }\n" +
    "        else if (cUpper.includes(\"KLK\")) { bgColor = \"#334155\"; borderColor = \"#334155\"; }\n" +
    "        else if (cUpper.includes(\"MMJ\")) { bgColor = \"linear-gradient(135deg, #000000, #6b7280)\"; borderColor = \"#000000\"; }\n" +
    "        else if (cUpper.includes(\"PLK\")) { bgColor = \"linear-gradient(135deg, #0ea5e9, #10b981)\"; borderColor = \"#0ea5e9\"; }\n" +
    "        else if (cUpper.includes(\"BUB\")) { bgColor = \"#ea580c\"; borderColor = \"#ea580c\"; }\n" +
    "        else { bgColor = \"#e2e8f0\"; txtColor = \"#334155\"; borderColor = \"#cbd5e1\"; }\n\n" +
    "        var borderStyle = \"border: 2px solid \" + borderColor + \" !important;\";\n\n" +
    "        var kartu = `\n" +
    "          <div class=\"col-md-4 col-sm-6 mb-4 d-flex\">\n" +
    "            <div class=\"card card-kaca shadow-sm w-100 d-flex flex-column\" style=\"${borderStyle}\">\n" +
    "              <div class=\"card-header fw-bold text-center py-2 fs-6 border-bottom\" style=\"background: ${bgColor}; color: ${txtColor};\">";

    appJs = appJs.replace(cardRegex, newCardLogic);
    writeFile("app.js", appJs);
    WScript.Echo("app.js updated successfully.");

    var indexHtml = readFile("index.html");
    
    // Add new branches to the dropdowns
    var optionsToAppend = "\n                      <option value=\"MXM-KLK\">MXM-KLK (Kolaka)</option>" +
                          "\n                      <option value=\"MXM-MMJ\">MXM-MMJ (Mamuju)</option>" +
                          "\n                      <option value=\"MXM-PLK\">MXM-PLK (Palangkaraya)</option>";
                          
    indexHtml = indexHtml.replace(/<option value="MXM-BJM">MXM-BJM \(Banjarmasin\)<\/option>/g, '<option value="MXM-BJM">MXM-BJM (Banjarmasin)</option>' + optionsToAppend);
    
    var navOptionToAppend = "\n                  <option value=\"MXM-KLK\">🏢 MXM-KLK (Kolaka)</option>" +
                            "\n                  <option value=\"MXM-MMJ\">🏢 MXM-MMJ (Mamuju)</option>" +
                            "\n                  <option value=\"MXM-PLK\">🏢 MXM-PLK (Palangkaraya)</option>";
                            
    indexHtml = indexHtml.replace(/<option value="MXM-BJM">🏢 MXM-BJM \(Banjarmasin\)<\/option>/g, '<option value="MXM-BJM">🏢 MXM-BJM (Banjarmasin)</option>' + navOptionToAppend);

    writeFile("index.html", indexHtml);
    WScript.Echo("index.html updated successfully.");

} catch (e) {
    WScript.Echo("Error: " + e.message);
}
