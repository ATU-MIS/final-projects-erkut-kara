<?php
// Hata Raporlama
error_reporting(0);
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// --- CACHE YOK! HER SEFERİNDE CANLI ÇEKER ---

// --- AYARLAR ---
$scanDays = 2; // Geriye dönük 2 gün (Bugün ve Dün)

// SEFER LİSTESİ
$tripData = [
    "2570-2674" => [
        141381, 141758, 141236, 144542, 142802, 
        144514, 136480, 136510, 137844, 151851, 
        151867, 139526, 138656, 139990, 140918, 
        140048, 141382, 141759, 141237
    ],
    "2674-2570" => [
        142541, 142077, 144487, 137206, 136597, 
        137612, 139410, 137235, 139961, 140541, 
        139033, 144571, 139874, 144639, 139207, 
        139381, 142544, 142078, 144488, 137207, 
        142542, 142078
    ]
];

$baseUrl = "https://www.aliosmanulusoy.com/ajax/";
$headers = [
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With: XMLHttpRequest",
    "Referer: https://www.aliosmanulusoy.com/"
];

// --- İSTEK HAZIRLIĞI ---
$mh = curl_multi_init();
$curl_handles = [];

foreach ($tripData as $suffix => $ids) {
    foreach ($ids as $baseId) {
        for ($day = 0; $day < $scanDays; $day++) {
            
            $currentIdNum = $baseId - $day; 
            $fullDataString = $currentIdNum . "-" . $suffix;
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $baseUrl);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, "func=bus&func_name=nav_get_map&data=" . $fullDataString);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3); 
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
            
            curl_multi_add_handle($mh, $ch);
            $curl_handles[] = $ch;
        }
    }
}

// --- İSTEKLERİ ATEŞLE ---
$active = null;
do {
    $mrc = curl_multi_exec($mh, $active);
} while ($mrc == CURLM_CALL_MULTI_PERFORM);

while ($active && $mrc == CURLM_OK) {
    if (curl_multi_select($mh) != -1) {
        do {
            $mrc = curl_multi_exec($mh, $active);
        } while ($mrc == CURLM_CALL_MULTI_PERFORM);
    }
}

// --- SONUÇLARI TOPLA ---
$uniqueBuses = []; 

foreach ($curl_handles as $ch) {
    $response = curl_multi_getcontent($ch);
    $data = json_decode($response, true);
    
    // Hata yoksa ve plaka verisi varsa ekle (Filtresiz)
    if (isset($data['error']) && $data['error'] === false && isset($data['data'])) {
        $busData = $data['data'];
        
        if (isset($busData['plate'])) {
            $plate = $busData['plate'];
            $uniqueBuses[$plate] = $busData;
        }
    }
    
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
}
curl_multi_close($mh);

// JSON ÇIKTISI (Kayıt yok, sadece ekrana bas)
echo json_encode(array_values($uniqueBuses));
?>