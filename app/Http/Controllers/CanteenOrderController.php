<?php

namespace App\Http\Controllers;

use App\Models\CanteenOrder;
use App\Models\CanteenOrderItem;
use App\Models\CanteenItem;
use App\Models\Finance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CanteenOrderController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = CanteenOrder::with(['items.item', 'tenant.bookings.room', 'branch']);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $query->whereIn('branch_id', $user->assigned_branches);
        } elseif ($user->role === 'resident') {
            $query->where('tenant_id', $user->id);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'resident') {
            return response()->json(['message' => 'Hanya penyewa yang dapat melakukan pesanan kantin.'], 403);
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

        // Check debt limit if user chooses 'debt'
        if ($request->payment_method === 'debt') {
            $totalDebt = CanteenOrder::where('tenant_id', $user->id)
                ->where('payment_status', 'debt_unpaid')
                ->sum('total_amount');
            
            // Limit is 100.000 for reminder, but we don't block. We just note it.
            // Wait, if we want to give a reminder on frontend, we should check it on frontend.
            // But if we want to block, we do it here. The user requested: "beri pengingat saja jika sudah 100.000"
            // So we don't block. We allow the order to go through.
        }

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

            // Generate order code
            $orderCode = 'KTN-' . strtoupper(Str::random(10));

            $paymentProofPath = null;
            if ($request->hasFile('payment_proof')) {
                $paymentProofPath = $request->file('payment_proof')->store('canteen_payments', 'public');
            }

            $orderStatus = 'pending_approval'; // Needs admin approval for payment
            $paymentStatus = 'pending';
            
            if ($request->payment_method === 'debt') {
                $paymentStatus = 'debt_unpaid';
            } elseif ($request->payment_method === 'cash') {
                $paymentStatus = 'pending'; // Cash implies pay on pickup/delivery
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

            // Note: In real production we could send a WhatsApp notification to the Operator here using Fonnte API

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
        }

        $order->status = $request->status;
        $order->save();

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
            'payment_status' => 'required|string|in:pending,paid,debt_unpaid'
        ]);

        // If changing to paid from something else, log to finances
        if ($request->payment_status === 'paid' && $order->payment_status !== 'paid') {
            $roomNumber = '-';
            if ($order->tenant && $order->tenant->bookings && $order->tenant->bookings->first() && $order->tenant->bookings->first()->room) {
                $roomNumber = 'Kamar ' . $order->tenant->bookings->first()->room->room_number;
            }

            Finance::create([
                'branch_id' => $order->branch_id,
                'amount' => $order->total_amount,
                'transaction_type' => 'income',
                'category' => 'pendapatan_kantin',
                'description' => "Pendapatan kantin dari {$order->tenant->name} ({$roomNumber})",
                'transaction_date' => now()->toDateString(),
            ]);
            
            // If it was debt, maybe the user wants to keep the status logic intact, but let's make sure it's known
            if ($order->status === 'pending_approval') {
                $order->status = 'processing';
            }
        }

        $order->update(['payment_status' => $request->payment_status, 'status' => $order->status]);

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
            'payment_status' => 'pending' // Waiting for admin verification
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
            ->update([
                'payment_proof' => $path,
                'payment_method' => $request->payment_method, // 'qris' or 'cash'
                'payment_status' => 'pending' // Waiting for admin verification
            ]);

        if ($updated === 0) {
            return response()->json(['message' => 'Tidak ada kasbon aktif yang dapat dilunasi.'], 400);
        }

        return response()->json(['message' => 'Pengajuan pelunasan untuk '.$updated.' pesanan berhasil dikirim. Menunggu verifikasi admin.']);
    }
}
