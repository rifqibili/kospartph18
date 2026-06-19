<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Room;
use App\Models\Booking;
use App\Models\Complaint;
use App\Models\Finance;
use App\Models\User;
use App\Models\CanteenOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function view(): Response
    {
        return Inertia::render('Dashboard');
    }

    public function index()
    {
        $user = Auth::user();

        // Cleanup abandoned unverified bookings (older than 15 minutes)
        $abandonedBookings = Booking::with('room')->where('otp_verified', false)
            ->where('created_at', '<', now()->subMinutes(15))
            ->get();
        foreach($abandonedBookings as $abandoned) {
            if ($abandoned->room && $abandoned->room->status === 'booked') {
                $abandoned->room->update(['status' => 'available']);
            }
            $abandoned->delete();
        }

        // 1. Base counts & filters based on role
        $roomsQuery = Room::query();
        $branchesQuery = Branch::query();
        $bookingsQuery = Booking::with(['tenant', 'room.branch'])->where('otp_verified', true);
        $complaintsQuery = Complaint::with(['tenant', 'room.branch']);
        
        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $roomsQuery->whereIn('branch_id', $user->assigned_branches);
            $branchesQuery->whereIn('id', $user->assigned_branches);
            $bookingsQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
            $complaintsQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
        } elseif ($user->role === 'resident') {
            $roomsQuery->whereHas('bookings', function($q) use ($user) {
                $q->where('tenant_id', $user->id)->where('status', 'active');
            });
            $branchesQuery->whereHas('rooms.bookings', function($q) use ($user) {
                $q->where('tenant_id', $user->id)->where('status', 'active');
            });
            $bookingsQuery->where('tenant_id', $user->id);
            $complaintsQuery->where('tenant_id', $user->id);
        }

        // Metrik umum
        $totalRooms = $roomsQuery->count();
        $occupiedRooms = (clone $roomsQuery)->where('status', 'occupied')->count();
        $availableRooms = (clone $roomsQuery)->where('status', 'available')->count();
        $maintenanceRooms = (clone $roomsQuery)->where('status', 'maintenance')->count();
        $bookedRooms = (clone $roomsQuery)->where('status', 'booked')->count();
        
        $totalBranches = $branchesQuery->count();
        $pendingComplaints = (clone $complaintsQuery)->where('status', 'pending')->count();

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $totalTenants = User::where('role', 'resident')
                ->whereHas('bookings.room', function($q) use ($user) {
                    $q->whereIn('branch_id', $user->assigned_branches);
                })->count();
        } elseif (in_array($user->role, ['resident', 'karyawan'])) {
            $totalTenants = 0;
        } else {
            $totalTenants = User::where('role', 'resident')->count();
        }

        // Keuangan bulan ini
        $incomeThisMonth = 0;
        $expenseThisMonth = 0;

        if ($user->role === 'super_admin') {
            $incomeThisMonth = Finance::where('transaction_type', 'income')
                ->whereMonth('transaction_date', now()->month)
                ->whereYear('transaction_date', now()->year)
                ->sum('amount');

            $expenseThisMonth = Finance::where('transaction_type', 'expense')
                ->whereMonth('transaction_date', now()->month)
                ->whereYear('transaction_date', now()->year)
                ->sum('amount');
        } elseif ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $incomeThisMonth = Finance::where('transaction_type', 'income')
                ->whereIn('branch_id', $user->assigned_branches)
                ->whereMonth('transaction_date', now()->month)
                ->whereYear('transaction_date', now()->year)
                ->sum('amount');

            $expenseThisMonth = Finance::where('transaction_type', 'expense')
                ->whereIn('branch_id', $user->assigned_branches)
                ->whereMonth('transaction_date', now()->month)
                ->whereYear('transaction_date', now()->year)
                ->sum('amount');
        }

        // Notifikasi & Peringatan Real-Time
        $notifications = [];

        // Base queries for alert generation (scoped to role)
        $unpaidPrevMonthBookingsQuery = Booking::with(['tenant', 'room.branch'])
            ->where('otp_verified', true)
            ->where('payment_status', 'unpaid')
            ->where('end_date', '<', now()->format('Y-m-d'));

        $expiryThreeDaysQuery = Booking::with(['tenant', 'room.branch'])
            ->where('otp_verified', true)
            ->where('status', 'active')
            ->whereBetween('end_date', [now()->format('Y-m-d'), now()->addDays(3)->format('Y-m-d')]);

        $dailyCheckingOutTodayQuery = Booking::with(['tenant', 'room.branch'])
            ->where('otp_verified', true)
            ->where('rental_type', 'daily')
            ->where('status', 'active')
            ->where('end_date', now()->format('Y-m-d'));

        $pendingComplaintsListQuery = Complaint::with(['tenant', 'room.branch'])
            ->where('status', 'pending');

        $unverifiedPaymentsQuery = Booking::with(['tenant', 'room.branch'])
            ->where('otp_verified', true)
            ->where('unverified_amount', '>', 0);

        $newBookingsQuery = Booking::with(['tenant', 'room.branch'])
            ->where('otp_verified', true)
            ->where('status', 'pending')
            ->where('unverified_amount', 0); // Still waiting for upload or approval

        // Canteen Queries
        $canteenAdminAlertsQuery = CanteenOrder::with(['tenant', 'branch'])
            ->whereIn('status', ['pending_approval'])
            ->orWhere(function($q) {
                $q->where('payment_status', 'pending');
            });
            
        $canteenTenantReadyQuery = CanteenOrder::with(['branch'])
            ->where('status', 'ready');
            
        $canteenTenantDebtQuery = CanteenOrder::with(['branch'])
            ->where('payment_status', 'debt_unpaid');

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $unpaidPrevMonthBookingsQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
            $expiryThreeDaysQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
            $dailyCheckingOutTodayQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
            $pendingComplaintsListQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
            $unverifiedPaymentsQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
            $newBookingsQuery->whereHas('room', function($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
        } elseif ($user->role === 'resident') {
            $unpaidPrevMonthBookingsQuery->where('tenant_id', $user->id);
            $expiryThreeDaysQuery->where('tenant_id', $user->id);
            $dailyCheckingOutTodayQuery->where('tenant_id', $user->id);
            $pendingComplaintsListQuery->where('tenant_id', $user->id);
            $unverifiedPaymentsQuery->where('tenant_id', $user->id);
            $newBookingsQuery->where('tenant_id', $user->id);
            
            $canteenTenantReadyQuery->where('tenant_id', $user->id);
            $canteenTenantDebtQuery->where('tenant_id', $user->id);
        } elseif ($user->role === 'karyawan') {
            // Karyawan has no bookings or debt
            $unpaidPrevMonthBookingsQuery->whereRaw('1 = 0');
            $expiryThreeDaysQuery->whereRaw('1 = 0');
            $dailyCheckingOutTodayQuery->whereRaw('1 = 0');
            $pendingComplaintsListQuery->whereRaw('1 = 0');
            $unverifiedPaymentsQuery->whereRaw('1 = 0');
            $newBookingsQuery->whereRaw('1 = 0');
            $canteenTenantReadyQuery->whereRaw('1 = 0');
            $canteenTenantDebtQuery->whereRaw('1 = 0');
        }

        $unpaidPrevMonthBookings = $unpaidPrevMonthBookingsQuery->get();
        $expiryThreeDays = $expiryThreeDaysQuery->get();
        $dailyCheckingOutToday = $dailyCheckingOutTodayQuery->get();
        $pendingComplaintsList = $pendingComplaintsListQuery->get();
        $unverifiedPayments = $unverifiedPaymentsQuery->get();
        $newBookings = $newBookingsQuery->get();
        
        $canteenAdminAlerts = (in_array($user->role, ['super_admin', 'operator'])) ? clone $canteenAdminAlertsQuery->get() : collect();
        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $canteenAdminAlerts = $canteenAdminAlerts->whereIn('branch_id', $user->assigned_branches);
        }
        $canteenTenantReady = ($user->role === 'resident') ? $canteenTenantReadyQuery->get() : collect();
        $canteenTenantDebt = ($user->role === 'resident') ? $canteenTenantDebtQuery->get() : collect();

        foreach ($unpaidPrevMonthBookings as $b) {
            $notifications[] = [
                'id' => 'unpaid-' . $b->id,
                'type' => 'unpaid_bill',
                'title' => 'Tagihan Belum Lunas',
                'message' => $user->role === 'resident'
                    ? 'Tagihan sewa Anda di ' . $b->room->branch->name . ' Kamar ' . $b->room->room_number . ' belum lunas dari bulan sebelumnya.'
                    : 'Tagihan sewa bulanan ' . $b->room->branch->name . ' Kamar ' . $b->room->room_number . ' atas nama ' . $b->tenant->name . ' belum lunas dari bulan sebelumnya.',
                'meta' => ['booking_code' => $b->booking_code, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number, 'amount' => $b->total_amount],
                'timestamp' => $b->updated_at->toIso8601String()
            ];
        }

        foreach ($expiryThreeDays as $b) {
            $notifications[] = [
                'id' => 'expiry-' . $b->id,
                'type' => 'rental_expiry',
                'title' => 'Sewa Berakhir H-3',
                'message' => $user->role === 'resident'
                    ? 'Penyewaan ' . ($b->rental_type === 'daily' ? 'Harian' : 'Bulanan') . ' Kamar ' . $b->room->room_number . ' Anda akan berakhir pada ' . $b->end_date->format('d M Y') . ' (H-3).'
                    : 'Penyewaan ' . ($b->rental_type === 'daily' ? 'Harian' : 'Bulanan') . ' Kamar ' . $b->room->room_number . ' oleh ' . $b->tenant->name . ' akan berakhir pada ' . $b->end_date->format('d M Y') . ' (H-3).',
                'meta' => ['booking_code' => $b->booking_code, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number, 'end_date' => $b->end_date->format('d M Y')],
                'timestamp' => $b->updated_at->toIso8601String()
            ];
        }

        foreach ($dailyCheckingOutToday as $b) {
            $notifications[] = [
                'id' => 'checkout-today-' . $b->id,
                'type' => 'daily_checkout_today',
                'title' => 'Checkout Harian Hari Ini',
                'message' => $user->role === 'resident'
                    ? 'Penyewaan harian Kamar ' . $b->room->room_number . ' Anda berakhir hari ini.'
                    : 'Penyewaan harian Kamar ' . $b->room->room_number . ' (' . $b->tenant->name . ') berakhir hari ini. Segera konfirmasi status checkout.',
                'meta' => ['booking_code' => $b->booking_code, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number],
                'timestamp' => $b->updated_at->toIso8601String()
            ];
        }

        foreach ($pendingComplaintsList as $c) {
            $roomNumber = $c->room->room_number ?? 'N/A';
            $tenantName = $c->tenant->name ?? 'N/A';
            $notifications[] = [
                'id' => 'complaint-' . $c->id,
                'type' => 'new_complaint',
                'title' => 'Aduan Komplain Baru',
                'message' => $user->role === 'resident'
                    ? 'Komplain Anda: "' . $c->title . '" sedang menunggu respon pengelola.'
                    : 'Komplain masuk: "' . $c->title . '" di Kamar ' . $roomNumber . ' (' . $tenantName . '). Butuh konfirmasi.',
                'meta' => ['complaint_id' => $c->id, 'tenant' => $tenantName, 'room' => $roomNumber, 'title' => $c->title],
                'timestamp' => $c->updated_at->toIso8601String()
            ];
        }

        foreach ($unverifiedPayments as $b) {
            $notifications[] = [
                'id' => 'payment-' . $b->id,
                'type' => 'payment_unverified',
                'title' => 'Pembayaran Menunggu Verifikasi',
                'message' => $user->role === 'resident'
                    ? 'Bukti pembayaran Anda untuk Kamar ' . $b->room->room_number . ' sedang menunggu verifikasi pengelola.'
                    : 'Bukti pembayaran Rp ' . number_format($b->unverified_amount, 0, ',', '.') . ' dari ' . $b->tenant->name . ' (Kamar ' . $b->room->room_number . ') menunggu verifikasi.',
                'meta' => ['booking_id' => $b->id, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number],
                'timestamp' => $b->updated_at->toIso8601String()
            ];
        }

        foreach ($newBookings as $b) {
            $notifications[] = [
                'id' => 'new-booking-' . $b->id,
                'type' => 'new_booking',
                'title' => 'Pemesanan Kamar Baru',
                'message' => $user->role === 'resident'
                    ? 'Pemesanan Kamar ' . $b->room->room_number . ' Anda sedang diproses.'
                    : 'Pesanan Kamar ' . $b->room->room_number . ' (' . $b->tenant->name . ') baru masuk dan butuh konfirmasi.',
                'meta' => ['booking_id' => $b->id, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number],
                'timestamp' => $b->updated_at->toIso8601String()
            ];
        }

        foreach ($canteenAdminAlerts as $c) {
            $notifications[] = [
                'id' => 'canteen-admin-' . $c->id,
                'type' => 'canteen_admin',
                'title' => $c->status === 'pending_approval' ? 'Pesanan Kantin Baru' : 'Verifikasi Pembayaran Kantin',
                'message' => $c->status === 'pending_approval' 
                    ? 'Ada pesanan kantin baru dari ' . ($c->tenant->name ?? 'Penghuni') . ' menunggu diproses.'
                    : 'Pembayaran kantin dari ' . ($c->tenant->name ?? 'Penghuni') . ' menunggu verifikasi.',
                'meta' => ['order_id' => $c->id],
                'timestamp' => $c->updated_at->toIso8601String()
            ];
        }

        foreach ($canteenTenantReady as $c) {
            $notifications[] = [
                'id' => 'canteen-ready-' . $c->id,
                'type' => 'canteen_ready',
                'title' => 'Pesanan Kantin Siap!',
                'message' => 'Pesanan kantin Anda (' . $c->order_code . ') sudah siap! ' . ($c->delivery_method === 'delivery' ? 'Akan diantar ke kamar Anda.' : 'Silakan ambil di kantin.'),
                'meta' => ['order_id' => $c->id],
                'timestamp' => $c->updated_at->toIso8601String()
            ];
        }

        foreach ($canteenTenantDebt as $c) {
            $notifications[] = [
                'id' => 'canteen-debt-' . $c->id,
                'type' => 'canteen_debt',
                'title' => 'Tagihan Kasbon Kantin',
                'message' => 'Anda memiliki tagihan kasbon kantin yang belum dilunasi (' . $c->order_code . '). Harap segera melunasi.',
                'meta' => ['order_id' => $c->id],
                'timestamp' => $c->updated_at->toIso8601String()
            ];
        }

        // Sort notifications by timestamp descending (newest first)
        usort($notifications, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        // Active/Recent activities for dashboard list
        $recentBookings = (clone $bookingsQuery)->orderBy('created_at', 'desc')->limit(5)->get();

        return response()->json([
            'stats' => [
                'totalRooms' => $totalRooms,
                'occupiedRooms' => $occupiedRooms,
                'availableRooms' => $availableRooms,
                'maintenanceRooms' => $maintenanceRooms,
                'bookedRooms' => $bookedRooms,
                'totalBranches' => $totalBranches,
                'totalTenants' => $totalTenants,
                'pendingComplaints' => $pendingComplaints,
                'incomeThisMonth' => floatval($incomeThisMonth),
                'expenseThisMonth' => floatval($expenseThisMonth),
                'netProfitThisMonth' => floatval($incomeThisMonth - $expenseThisMonth),
            ],
            'notifications' => $notifications,
            'recentBookings' => $recentBookings,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
            ]
        ]);
    }
}
