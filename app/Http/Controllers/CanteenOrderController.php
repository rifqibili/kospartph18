<?php

namespace App\Http\Controllers;

use App\Models\CanteenOrder;
use App\Models\CanteenOrderItem;
use App\Models\CanteenItem;
use App\Models\Finance;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CanteenOrderController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Kurangi eager loading berdasarkan role untuk efisiensi query
        if (in_array($user->role, ['resident', 'karyawan'])) {
            // Resident tidak perlu data tenant atau bookings kamar (sudah tahu diri sendiri)
            $query = CanteenOrder::with(['items.item', 'branch'])
                ->where('tenant_id', $user->id);
        } else {
            // Admin/operator perlu data tenant untuk tampilan panel pesanan aktif
            $query = CanteenOrder::with(['items.item', 'tenant.bookings.room', 'branch']);
            if ($user->role === 'operator' && is_array($user->assigned_branches)) {
                $query->whereIn('branch_id', $user->assigned_branches);
            }
        }

        $orders = $query->orderBy('created_at', 'desc')->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['resident', 'karyawan'])) {
            return response()->json(['message' => 'Hanya penyewa dan karyawan yang dapat melakukan pesanan kantin.'], 403);
        }

        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'payment_method' => 'required|string|in:qris,cash,debt',
            'delivery_method' => 'required|string|in:pickup,delivery',
            'notes' => 'nullable|string',
            'payment_proof' => 'nullable|image|max:5120',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:canteen_items,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);



        // Calculate total and reduce stock
        $totalAmount = 0;
        $orderItems = [];
        
        \DB::beginTransaction();
        try {
            foreach ($request->items as $cartItem) {
                $item = CanteenItem::with('recipes.ingredient')->where('id', $cartItem['id'])->where('branch_id', $request->branch_id)->lockForUpdate()->first();
                if (!$item) {
                    throw new \Exception("Item tidak ditemukan di cabang ini.");
                }

                if ($item->recipes && $item->recipes->count() > 0) {
                    foreach ($item->recipes as $recipe) {
                        $ingredient = $recipe->ingredient;
                        $needed = $recipe->quantity * $cartItem['quantity'];
                        if ($ingredient->stock < $needed) {
                            throw new \Exception("Stok bahan baku '{$ingredient->name}' tidak mencukupi untuk pesanan '{$item->name}'. Tersisa {$ingredient->stock} " . ($ingredient->unit ?? 'pcs') . ".");
                        }
                        $ingredient->stock -= $needed;
                        $ingredient->save();
                    }
                } else {
                    if ($item->stock < $cartItem['quantity']) {
                        throw new \Exception("Stok {$item->name} tidak mencukupi. Tersisa {$item->stock}.");
                    }
                    $item->stock -= $cartItem['quantity'];
                    $item->save();
                }

                $totalAmount += $item->price * $cartItem['quantity'];
                
                $orderItems[] = [
                    'canteen_item_id' => $item->id,
                    'quantity' => $cartItem['quantity'],
                    'price_at_time' => $item->price,
                ];
            }

            if ($request->payment_method === 'debt') {
                $existingDebt = CanteenOrder::where('tenant_id', $user->id)
                    ->where('payment_status', 'debt_unpaid')
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');
                if ($existingDebt + $totalAmount > 250000) {
                    throw new \Exception("MAAF, TRANSAKSI DITOLAK! Batas maksimal kasbon adalah Rp 250.000. Total kasbon Anda saat ini: Rp " . number_format($existingDebt, 0, ',', '.') . ". Pesanan baru: Rp " . number_format($totalAmount, 0, ',', '.') . ". Silakan lunasi kasbon terlebih dahulu.");
                }
            }

            // Generate order code
            $orderCode = 'KTN-' . strtoupper(Str::random(10));

            $paymentProofPath = null;
            if ($request->hasFile('payment_proof')) {
                $paymentProofPath = $request->file('payment_proof')->store('canteen_payments', 'public');
            }

            $orderStatus = 'pending_approval'; // Needs admin approval for payment
            $paymentStatus = 'pending';
            
            if ($user->role === 'karyawan') {
                $orderStatus = 'completed';
                $paymentStatus = 'free_meal';
            } else {
                if ($request->payment_method === 'debt') {
                    $paymentStatus = 'debt_unpaid';
                } elseif ($request->payment_method === 'cash') {
                    $paymentStatus = 'pending'; // Cash implies pay on pickup/delivery
                }
            }

            $order = CanteenOrder::create([
                'branch_id' => $request->branch_id,
                'tenant_id' => $user->id,
                'order_code' => $orderCode,
                'total_amount' => $totalAmount,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'status' => $orderStatus,
                'payment_proof' => $paymentProofPath,
                'notes' => $request->notes,
                'delivery_method' => $request->delivery_method,
            ]);

            foreach ($orderItems as $oi) {
                CanteenOrderItem::create(array_merge($oi, ['canteen_order_id' => $order->id]));
            }

            // Kirim push notification ke admin/operator cabang ini
            try {
                $pushService = new PushNotificationService();
                $itemCount = count($request->items);
                $pushService->sendToAdminsOfBranch(
                    $request->branch_id,
                    '🍽️ Pesanan Kantin Baru!',
                    "{$user->name} memesan {$itemCount} item · Rp " . number_format($totalAmount, 0, ',', '.'),
                    '/dashboard'
                );
            } catch (\Exception $e) {
                // Push notif gagal tidak boleh batalkan order
                \Log::warning('Push notification gagal: ' . $e->getMessage());
            }

            \DB::commit();

            return response()->json(['message' => 'Pesanan berhasil dibuat!', 'order' => $order]);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $order = CanteenOrder::findOrFail($id);
        
        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($order->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $request->validate([
            'status' => 'required|string|in:pending_approval,processing,ready,completed,cancelled'
        ]);

        if ($request->status === 'completed' && $order->status !== 'completed') {
            if ($order->payment_status === 'pending') {
                if ($order->tenant_id) {
                    $existingDebt = CanteenOrder::where('tenant_id', $order->tenant_id)
                        ->where('payment_status', 'debt_unpaid')
                        ->where('status', '!=', 'cancelled')
                        ->sum('total_amount');
                        
                    if ($existingDebt + $order->total_amount > 250000) {
                        return response()->json(['message' => 'Gagal: Pesanan tidak bisa otomatis dijadikan Kasbon karena melebihi batas Rp 250.000. Total kasbon saat ini: Rp ' . number_format($existingDebt, 0, ',', '.') . '. Total pesanan: Rp ' . number_format($order->total_amount, 0, ',', '.') . '.'], 400);
                    }
                    
                    $order->payment_status = 'debt_unpaid';
                    $order->payment_method = 'debt';
                } else {
                    return response()->json(['message' => 'Gagal: Pembeli BUKAN PENGHUNI tidak diizinkan Kasbon. Pastikan Anda sudah menerima pembayaran tunai lalu ubah status menjadi Lunas.'], 400);
                }
            }
        }

        if ($request->status === 'cancelled' && $order->status !== 'cancelled') {
            // Restore stock
            foreach ($order->items as $oi) {
                $item = CanteenItem::with('recipes.ingredient')->find($oi->canteen_item_id);
                if ($item) {
                    if ($item->recipes && $item->recipes->count() > 0) {
                        foreach ($item->recipes as $recipe) {
                            $ingredient = $recipe->ingredient;
                            $ingredient->stock += ($recipe->quantity * $oi->quantity);
                            $ingredient->save();
                        }
                    } else {
                        $item->stock += $oi->quantity;
                        $item->save();
                    }
                }
            }
            // Batalkan juga status pembayarannya agar tidak dihitung sebagai hutang
            $order->payment_status = 'cancelled';

            // Catat Jurnal Pembalik (Reversal Entry) alih-alih melakukan Hard Delete
            $searchName = $order->tenant ? $order->tenant->name : $order->customer_name;
            if ($searchName) {
                $existingIncome = \App\Models\Finance::where('branch_id', $order->branch_id)
                    ->where('amount', $order->total_amount)
                    ->where('category', 'pendapatan_kantin')
                    ->where('description', 'LIKE', "%{$searchName}%")
                    ->first();
                    
                if ($existingIncome) {
                    \App\Models\Finance::create([
                        'branch_id' => $order->branch_id,
                        'amount' => $order->total_amount,
                        'transaction_type' => 'expense',
                        'category' => 'refund',
                        'description' => "Jurnal Pembalik: Pembatalan pesanan kantin ({$order->order_code}) a/n {$searchName}",
                        'transaction_date' => now()->toDateString(),
                        'canteen_order_id' => $order->id,
                    ]);
                }
            }
        }

        $order->status = $request->status;
        $order->save();

        // Kirim push notification ke resident jika statusnya berubah
        try {
            if ($order->tenant_id) {
                $pushService = new PushNotificationService();
                $statusMessages = [
                    'processing'       => ['⏳ Pesanan Diproses', 'Pesanan kantin kamu sedang diproses oleh dapur.'],
                    'ready'            => ['✅ Pesanan Siap!', 'Pesanan kantin kamu sudah siap. Silakan diambil!'],
                    'completed'        => ['🎉 Pesanan Selesai', 'Pesanan kantin kamu telah diselesaikan.'],
                    'cancelled'        => ['❌ Pesanan Dibatalkan', 'Maaf, pesanan kantin kamu dibatalkan oleh admin.'],
                    'pending_approval' => null,
                ];
                if (isset($statusMessages[$request->status]) && $statusMessages[$request->status]) {
                    [$title, $body] = $statusMessages[$request->status];
                    $pushService->sendToUser($order->tenant_id, $title, $body, '/dashboard');
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Push notification status gagal: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Status pesanan diperbarui.']);
    }

    public function updatePayment(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $order = CanteenOrder::with('tenant.bookings.room')->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($order->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $request->validate([
            'payment_status' => 'required|string|in:pending,paid,debt_unpaid',
            'payment_proof' => 'nullable|image|max:5120',
            'payment_method_received' => 'nullable|string|in:cash,qris',
        ]);

        // Validate debt limit if changing to debt
        if ($request->payment_status === 'debt_unpaid' && $order->payment_status !== 'debt_unpaid') {
            if (!$order->tenant_id) {
                return response()->json(['message' => 'Gagal: Kasbon hanya berlaku untuk pesanan yang terhubung dengan penghuni.'], 400);
            }
            
            $existingDebt = CanteenOrder::where('tenant_id', $order->tenant_id)
                ->where('payment_status', 'debt_unpaid')
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');
                
            if ($existingDebt + $order->total_amount > 250000) {
                return response()->json(['message' => 'Gagal: Batas maksimal kasbon penghuni adalah Rp 250.000. Total kasbon saat ini: Rp ' . number_format($existingDebt, 0, ',', '.') . '. Total pesanan ini: Rp ' . number_format($order->total_amount, 0, ',', '.') . '.'], 400);
            }
        }

        // If changing to paid from something else, log to finances (prevent duplicates using canteen_order_id)
        if ($request->payment_status === 'paid' && $order->payment_status !== 'paid') {
            // Check if finance record already exists for this specific order
            $existingFinance = Finance::where('canteen_order_id', $order->id)->first();

            if (!$existingFinance) {
                $bookingId = null;
                $roomNumber = '-';
                $tenantName = $order->tenant ? $order->tenant->name : ($order->customer_name ?? 'Unknown');
                
                if ($order->tenant && $order->tenant->bookings && $order->tenant->bookings->first()) {
                    $bookingId = $order->tenant->bookings->first()->id;
                    if ($order->tenant->bookings->first()->room) {
                        $roomNumber = 'Kamar ' . $order->tenant->bookings->first()->room->room_number;
                    }
                }

                Finance::create([
                    'branch_id' => $order->branch_id,
                    'amount' => $order->total_amount,
                    'transaction_type' => 'income',
                    'category' => 'pendapatan_kantin',
                    'description' => "Pendapatan kantin dari {$tenantName} ({$roomNumber}) - {$order->order_code}",
                    'transaction_date' => now()->toDateString(),
                    'payment_method' => $order->payment_method,
                    'booking_id' => $bookingId,
                    'canteen_order_id' => $order->id,
                ]);
            }
            
            // If it was debt, maybe the user wants to keep the status logic intact, but let's make sure it's known
            if ($order->status === 'pending_approval') {
                $order->status = 'processing';
            }
        } elseif ($request->payment_status !== 'paid' && $order->payment_status === 'paid') {
            // Jika status pembayaran dibatalkan dari 'paid', buat Jurnal Pembalik
            $existingIncome = Finance::where('canteen_order_id', $order->id)->where('transaction_type', 'income')->first();
            if ($existingIncome) {
                Finance::create([
                    'branch_id' => $order->branch_id,
                    'amount' => $order->total_amount,
                    'transaction_type' => 'expense',
                    'category' => 'refund',
                    'description' => "Jurnal Pembalik: Pembatalan pembayaran pesanan kantin ({$order->order_code})",
                    'transaction_date' => now()->toDateString(),
                    'canteen_order_id' => $order->id,
                ]);
            }
        }

        // Build update payload
        $updateData = [
            'payment_status' => $request->payment_status,
            'status'         => $order->status,
        ];

        // Store payment proof if uploaded (admin accepting payment with QRIS)
        if ($request->hasFile('payment_proof')) {
            $updateData['payment_proof'] = $request->file('payment_proof')->store('canteen_payments', 'public');
        }

        // Record how admin received the money (cash / qris)
        if ($request->payment_method_received) {
            $updateData['payment_method'] = $request->payment_method_received;
        }

        $order->update($updateData);

        return response()->json(['message' => 'Status pembayaran pesanan diperbarui.']);
    }

    public function payDebt(Request $request, $id)
    {
        $user = Auth::user();
        if ($user->role !== 'resident') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $order = CanteenOrder::findOrFail($id);
        
        if ($order->tenant_id !== $user->id || $order->payment_status !== 'debt_unpaid') {
            return response()->json(['message' => 'Pesanan tidak valid untuk pelunasan.'], 400);
        }

        $request->validate([
            'payment_method' => 'required|in:qris,cash',
            'payment_proof' => 'nullable|image|max:5120'
        ]);

        if ($request->payment_method === 'qris' && !$request->hasFile('payment_proof')) {
            return response()->json(['message' => 'Bukti pembayaran wajib diunggah untuk metode QRIS.'], 400);
        }

        $path = null;
        if ($request->hasFile('payment_proof')) {
            $path = $request->file('payment_proof')->store('canteen_payments', 'public');
        }
        
        $order->update([
            'payment_proof' => $path,
            'payment_method' => $request->payment_method, // 'qris' or 'cash'
            'payment_status' => 'pending', // Waiting for admin verification
            'status' => 'completed' // Pindahkan dari Pesanan Aktif ke daftar verifikasi kasbon
        ]);

        return response()->json(['message' => 'Pengajuan pelunasan berhasil dikirim. Menunggu verifikasi admin.']);
    }
    public function payBulkDebt(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'resident') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'payment_method' => 'required|in:qris,cash',
            'payment_proof' => 'nullable|image|max:5120'
        ]);

        if ($request->payment_method === 'qris' && !$request->hasFile('payment_proof')) {
            return response()->json(['message' => 'Bukti pembayaran wajib diunggah untuk metode QRIS.'], 400);
        }

        $path = null;
        if ($request->hasFile('payment_proof')) {
            $path = $request->file('payment_proof')->store('canteen_payments', 'public');
        }

        // Update all unpaid debts for this tenant
        $updated = CanteenOrder::where('tenant_id', $user->id)
            ->where('payment_status', 'debt_unpaid')
            ->where('status', '!=', 'cancelled')
            ->update([
                'payment_proof' => $path,
                'payment_method' => $request->payment_method, // 'qris' or 'cash'
                'payment_status' => 'pending', // Waiting for admin verification
                'status' => 'completed' // Pindahkan dari Pesanan Aktif ke daftar verifikasi kasbon
            ]);

        if ($updated === 0) {
            return response()->json(['message' => 'Tidak ada kasbon aktif yang dapat dilunasi.'], 400);
        }

        return response()->json(['message' => 'Pengajuan pelunasan untuk '.$updated.' pesanan berhasil dikirim. Menunggu verifikasi admin.']);
    }
    public function storeManual(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'payment_method' => 'required|string|in:qris,cash,debt',
            'payment_status' => 'required|string|in:paid,debt_unpaid,pending',
            'tenant_id' => 'nullable|exists:users,id',
            'customer_name' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:canteen_items,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);

        if ($request->payment_method === 'debt' && !$request->tenant_id) {
            return response()->json(['message' => 'Metode Kasbon hanya bisa digunakan jika terhubung ke penghuni.'], 400);
        }

        $totalAmount = 0;
        $orderItems = [];
        
        \DB::beginTransaction();
        try {
            foreach ($request->items as $cartItem) {
                $item = CanteenItem::with('recipes.ingredient')->where('id', $cartItem['id'])->where('branch_id', $request->branch_id)->lockForUpdate()->first();
                if (!$item) {
                    throw new \Exception("Item tidak ditemukan di cabang ini.");
                }

                if ($item->recipes && $item->recipes->count() > 0) {
                    foreach ($item->recipes as $recipe) {
                        $ingredient = $recipe->ingredient;
                        $needed = $recipe->quantity * $cartItem['quantity'];
                        if ($ingredient->stock < $needed) {
                            throw new \Exception("Stok bahan baku '{$ingredient->name}' tidak mencukupi untuk pesanan '{$item->name}'. Tersisa {$ingredient->stock} " . ($ingredient->unit ?? 'pcs') . ".");
                        }
                        $ingredient->stock -= $needed;
                        $ingredient->save();
                    }
                } else {
                    if ($item->stock < $cartItem['quantity']) {
                        throw new \Exception("Stok {$item->name} tidak mencukupi. Tersisa {$item->stock}.");
                    }
                    $item->stock -= $cartItem['quantity'];
                    $item->save();
                }

                $totalAmount += $item->price * $cartItem['quantity'];
                
                $orderItems[] = [
                    'canteen_item_id' => $item->id,
                    'quantity' => $cartItem['quantity'],
                    'price_at_time' => $item->price,
                ];
            }



            if ($request->payment_method === 'debt' && $request->tenant_id) {
                $existingDebt = CanteenOrder::where('tenant_id', $request->tenant_id)
                    ->where('payment_status', 'debt_unpaid')
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');
                if ($existingDebt + $totalAmount > 250000) {
                    throw new \Exception("MAAF, TRANSAKSI DITOLAK! Batas maksimal kasbon penghuni adalah Rp 250.000. Total kasbon saat ini: Rp " . number_format($existingDebt, 0, ',', '.') . ". Pesanan baru: Rp " . number_format($totalAmount, 0, ',', '.') . ". Silakan minta penghuni melunasi kasbon terlebih dahulu.");
                }
            }

            $status = 'processing'; // Biarkan masuk pesanan aktif agar bisa diselesaikan operator
            $paymentStatus = $request->payment_status;

            if ($request->tenant_id) {
                $tenant = \App\Models\User::find($request->tenant_id);
                if ($tenant && $tenant->role === 'karyawan') {
                    $status = 'completed';
                    $paymentStatus = 'free_meal';
                }
            }

            $orderCode = 'KTN-MNL-' . strtoupper(Str::random(6));

            $order = CanteenOrder::create([
                'branch_id' => $request->branch_id,
                'tenant_id' => $request->tenant_id,
                'customer_name' => $request->customer_name,
                'order_code' => $orderCode,
                'total_amount' => $totalAmount,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'status' => $status,
                'delivery_method' => 'pickup',
            ]);

            foreach ($orderItems as $oi) {
                CanteenOrderItem::create(array_merge($oi, ['canteen_order_id' => $order->id]));
            }

            if ($request->payment_status === 'paid') {
                $displayName = "Tamu " . $request->customer_name;
                $bookingId = null;
                
                if ($request->tenant_id) {
                    $tenant = \App\Models\User::with('bookings')->find($request->tenant_id);
                    if ($tenant) {
                        $displayName = "Penghuni " . $tenant->name;
                        if ($tenant->bookings && $tenant->bookings->first()) {
                            $bookingId = $tenant->bookings->first()->id;
                        }
                    }
                }

                Finance::create([
                    'branch_id' => $order->branch_id,
                    'amount' => $order->total_amount,
                    'transaction_type' => 'income',
                    'category' => 'pendapatan_kantin',
                    'description' => "Pendapatan kantin dari {$displayName} (Manual) - {$order->order_code}",
                    'transaction_date' => now()->toDateString(),
                    'payment_method' => $request->payment_method,
                    'booking_id' => $bookingId,
                    'canteen_order_id' => $order->id,
                ]);
            }

            \DB::commit();

            return response()->json(['message' => 'Pesanan manual berhasil dibuat!', 'order' => $order]);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function sendBulkReminders(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $token = env('FONNTE_API_KEY');
        if (!$token) {
            return response()->json(['message' => 'Fonnte API Key belum diset. Hubungi Admin.'], 400);
        }

        $branchId = $request->branch_id;
        
        $query = CanteenOrder::with(['tenant', 'items.item'])->where('payment_status', 'debt_unpaid')->where('status', '!=', 'cancelled');
        
        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $query->whereIn('branch_id', $user->assigned_branches);
        }
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $orders = $query->get();

        if ($orders->isEmpty()) {
            return response()->json(['message' => 'Tidak ada kasbon yang belum dibayar.'], 400);
        }

        $debtsByTenant = [];
        foreach ($orders as $order) {
            if (!$order->tenant || !$order->tenant->phone) continue;
            
            if (!isset($debtsByTenant[$order->tenant_id])) {
                $debtsByTenant[$order->tenant_id] = [
                    'tenant'       => $order->tenant,
                    'total_amount' => 0,
                    'count'        => 0,
                    'orders'       => [],
                ];
            }
            
            $debtsByTenant[$order->tenant_id]['total_amount'] += $order->total_amount;
            $debtsByTenant[$order->tenant_id]['count']++;
            $debtsByTenant[$order->tenant_id]['orders'][] = $order;
        }

        if (empty($debtsByTenant)) {
            return response()->json(['message' => 'Tidak ada kasbon dari penghuni dengan nomor telepon yang valid.'], 400);
        }

        $sentCount = 0;
        foreach ($debtsByTenant as $debt) {
            $amountFormatted = 'Rp ' . number_format($debt['total_amount'], 0, ',', '.');
            
            // Susun ringkasan menu per order
            $orderSummaryLines = [];
            foreach ($debt['orders'] as $idx => $order) {
                $orderNo      = $idx + 1;
                $orderTotal   = 'Rp ' . number_format($order->total_amount, 0, ',', '.');
                $itemLines    = [];
                foreach ($order->items as $orderItem) {
                    $itemName   = $orderItem->item ? $orderItem->item->name : 'Item';
                    $itemPrice  = 'Rp ' . number_format($orderItem->price_at_time * $orderItem->quantity, 0, ',', '.');
                    $itemLines[] = "   • {$orderItem->quantity}x {$itemName} ({$itemPrice})";
                }
                $itemsText          = !empty($itemLines) ? implode("\n", $itemLines) : '   (tidak ada detail item)';
                $orderSummaryLines[] = "*Pesanan #{$orderNo}* ({$order->order_code}) — {$orderTotal}\n{$itemsText}";
            }
            $orderSummaryText = implode("\n\n", $orderSummaryLines);

            $message = "🍽️ *REMINDER KASBON KANTIN KOSPART*\n\n"
                . "Halo *{$debt['tenant']->name}*,\n\n"
                . "Anda memiliki *{$debt['count']} pesanan* kasbon kantin yang belum dibayar.\n\n"
                . "📋 *Rincian Pesanan:*\n"
                . "{$orderSummaryText}\n\n"
                . "💰 *Total Tagihan: {$amountFormatted}*\n\n"
                . "💳 *Bayar ke:*\n"
                . "- BCA : *8447060951*\n"
                . "- A/N : *PRAYOGA HERIYANTO*\n\n"
                . "Atau bayar via *QRIS* di menu Kantin aplikasi Kospart PH 18.\n\n"
                . "Kirimkan bukti bayar melalui aplikasi atau langsung ke operator kami.\n"
                . "Abaikan pesan ini jika Anda sudah membayar. Terima kasih! 🙏";

            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => $token,
            ])->post('https://api.fonnte.com/send', [
                'target' => $debt['tenant']->phone,
                'message' => $message,
                'countryCode' => '62',
            ]);

            if ($response->successful()) {
                $sentCount++;
            }
        }

        return response()->json(['message' => "Berhasil mengirim reminder ke $sentCount penghuni."]);
    }
}
