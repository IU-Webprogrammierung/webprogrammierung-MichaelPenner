<?php
/**
 * ============================================================================
 * KRAHN MANUFAKTUR – KITCHENAID STANDALONE SHOP API (api/shop_api.php)
 * ============================================================================
 * Provides JSON-file persistence for Orders & Products on Netcup Webhosting
 * and sends automatic Order Confirmation emails via mail_config.php.
 */

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/mail_config.php';
$config = file_exists($configFile) ? require $configFile : [];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && !empty($config['allowed_origins'])) {
    foreach ($config['allowed_origins'] as $allowed) {
        if (strpos($origin, $allowed) === 0) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
            header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
            break;
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$storageDir = __DIR__ . '/../data/storage';
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0755, true);
}
$ordersFile = $storageDir . '/orders.json';
$productsFile = $storageDir . '/../data/custom_products.json';

function readJsonFile(string $file, array $default = []): array {
    if (!file_exists($file)) return $default;
    $raw = @file_get_contents($file);
    $data = $raw ? json_decode($raw, true) : null;
    return is_array($data) ? $data : $default;
}

function writeJsonFile(string $file, array $data): bool {
    return (bool)@file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'status';
    if ($action === 'orders') {
        echo json_encode(['success' => true, 'orders' => readJsonFile($ordersFile)]);
        exit;
    }
    echo json_encode(['success' => true, 'status' => 'KitchenAid Shop API Ready']);
    exit;
}

$rawBody = file_get_contents('php://input');
$req = json_decode($rawBody, true);
if (!is_array($req)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

$action = $req['action'] ?? '';
$payload = $req['payload'] ?? [];
$lang = ($req['lang'] ?? 'de') === 'en' ? 'en' : 'de';

if ($action === 'create_order' && is_array($payload)) {
    $orders = readJsonFile($ordersFile, []);
    array_unshift($orders, $payload);
    writeJsonFile($ordersFile, $orders);

    // Optional: send order notification email to shop owner if mail_config is present
    if (!empty($config['recipient_email']) && !empty($config['from_email'])) {
        $orderNo = htmlspecialchars($payload['orderNumber'] ?? 'KA-ORDER', ENT_QUOTES, 'UTF-8');
        $custName = htmlspecialchars($payload['customer']['name'] ?? 'Kunde', ENT_QUOTES, 'UTF-8');
        $custEmail = filter_var($payload['customer']['email'] ?? '', FILTER_SANITIZE_EMAIL);
        $total = number_format((float)($payload['total'] ?? 0), 2, ',', '.') . ' €';

        $subject = "[KitchenAid Shop] Neue Bestellung $orderNo von $custName ($total)";
        $itemsList = "";
        foreach (($payload['items'] ?? []) as $item) {
            $itemsList .= "- " . ($item['quantity'] ?? 1) . "x " . ($item['title'] ?? '') . " (" . ($item['option'] ?? '') . ") - " . number_format((float)($item['unitPrice'] ?? 0), 2, ',', '.') . " €\n";
        }
        $plain = "Neue Shop-Bestellung: $orderNo\n"
               . "====================================\n"
               . "Kunde:   $custName ($custEmail)\n"
               . "Adresse: " . ($payload['customer']['street'] ?? '') . ", " . ($payload['customer']['zip'] ?? '') . " " . ($payload['customer']['city'] ?? '') . "\n"
               . "Zahlung: " . ($payload['paymentMethod'] ?? 'invoice') . "\n"
               . "Gesamt:  $total\n"
               . "------------------------------------\n"
               . "Positionen:\n$itemsList\n"
               . "Notiz: " . ($payload['customer']['notes'] ?? '-') . "\n";

        $headers = "From: " . ($config['from_email']) . "\r\n"
                 . ($custEmail ? "Reply-To: $custEmail\r\n" : '')
                 . "Content-Type: text/plain; charset=UTF-8\r\n";

        @mail($config['recipient_email'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $plain, $headers);
    }

    echo json_encode(['success' => true, 'order' => $payload]);
    exit;
}

if ($action === 'update_order' && is_array($payload)) {
    $orders = readJsonFile($ordersFile, []);
    $updated = false;
    foreach ($orders as $idx => $o) {
        if (($o['id'] ?? '') === ($payload['id'] ?? '')) {
            $orders[$idx] = $payload;
            $updated = true;
            break;
        }
    }
    if (!$updated && !empty($payload['id'])) {
        array_unshift($orders, $payload);
    }
    writeJsonFile($ordersFile, $orders);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_order' && !empty($payload['id'])) {
    $orders = readJsonFile($ordersFile, []);
    $orders = array_values(array_filter($orders, fn($o) => ($o['id'] ?? '') !== $payload['id']));
    writeJsonFile($ordersFile, $orders);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'save_product' && is_array($payload)) {
    $prods = readJsonFile($productsFile, []);
    $found = false;
    foreach ($prods as $idx => $p) {
        if (($p['id'] ?? '') === ($payload['id'] ?? '')) {
            $prods[$idx] = $payload;
            $found = true;
            break;
        }
    }
    if (!$found) $prods[] = $payload;
    writeJsonFile($productsFile, $prods);
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['success' => true]);
