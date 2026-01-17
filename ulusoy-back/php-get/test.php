<?php
// Bu dosya hem veriyi test eder hem de haritada gösterir.
header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<div style='font-family:monospace; padding:20px; background:#f4f4f4; border-bottom:2px solid #ccc;'>";
echo "<h3>Ali Osman Ulusoy Bağlantı ve Harita Testi</h3>";

// --- 1. AYARLAR ---
// TEST EDİLECEK ID (Bunu bugünün geçerli bir ID'si ile değiştirmen gerekebilir)
$testId = "141237-2855-2221";  # 141237-2855-2221 // 38 YILTUR 018
$url = "https://www.aliosmanulusoy.com/ajax/";

echo "<b>Hedef URL:</b> $url <br>";
echo "<b>Sorgulanan ID:</b> $testId <br><br>";

// --- 2. CURL İSTEĞİ ---
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, "func=bus&func_name=nav_get_map&data=" . $testId);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Referer: https://www.aliosmanulusoy.com/",
    "X-Requested-With: XMLHttpRequest"
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// --- 3. SONUÇLARI YAZDIR ---
echo "<b>HTTP Durum Kodu:</b> <span style='font-weight:bold; color:" . ($httpCode == 200 ? 'green' : 'red') . "'>$httpCode</span><br>";

if ($curlError) {
    echo "<b>cURL Hatası:</b> $curlError <br>";
}

// JSON Çözümleme
$json = json_decode($response, true);
$lat = 0;
$lng = 0;
$plate = "Veri Yok";
$speed = 0;
$hasData = false;

if ($json && isset($json['data']) && isset($json['data']['lat'])) {
    echo "<pre style='background:#fff; padding:10px; border:1px solid #ddd; max-height:150px; overflow:auto;'>" . print_r($json, true) . "</pre>";
    
    // Verileri PHP değişkenlerine alalım
    $lat = $json['data']['lat'];
    $lng = $json['data']['long'];
    $plate = $json['data']['plate'];
    $speed = $json['data']['speed'];
    $hasData = true;
} else {
    echo "<div style='color:red; font-weight:bold; padding:10px; border:1px solid red;'>UYARI: Geçerli konum verisi alınamadı! (ID eski olabilir veya sefer bitmiş olabilir)</div>";
    echo "Ham Cevap: <textarea style='width:100%; height:50px;'>$response</textarea>";
}

echo "</div>";
?>

<h3 style="padding-left:20px;">Konum Önizleme:</h3>

<div id="map-container" style="width: 90%; height: 500px; margin: 0 auto; border: 2px solid #333; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
    <div id="map" style="width: 100%; height: 100%;"></div>
</div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

<script>
    // PHP'den gelen verileri JS'ye aktar
    var hasData = <?php echo $hasData ? 'true' : 'false'; ?>;
    var lat = <?php echo $lat ? $lat : 39.0; ?>;
    var lng = <?php echo $lng ? $lng : 35.0; ?>;
    var plate = "<?php echo $plate; ?>";
    var speed = "<?php echo $speed; ?>";

    // Haritayı Başlat
    var map = L.map('map');

    if (hasData) {
        // Veri varsa o konuma odaklan
        map.setView([lat, lng], 12);
    } else {
        // Veri yoksa Türkiye geneline odaklan
        map.setView([39.0, 35.0], 6);
    }

    // Google Maps Katmanı
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
    }).addTo(map);

    // Eğer veri varsa marker ekle
    if (hasData) {
        var busIcon = L.icon({
            iconUrl: 'https://www.aliosmanulusoy.com/images/map_otobus.svg',
            iconSize: [42, 42],
            iconAnchor: [21, 42],
            popupAnchor: [1, -34]
        });

        var marker = L.marker([lat, lng], {icon: busIcon})
            .addTo(map)
            .bindPopup(`
                <div style="text-align:left; font-family:Arial;">
                    <b>Plaka:</b> ${plate}<br>
                    <b>Hız:</b> ${speed}
                </div>
            `)
            .openPopup();
    }
</script>