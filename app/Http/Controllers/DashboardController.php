<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Room;
use App\Models\Booking;
use App\Models\Complaint;
use App\Models\Finance;
use App\Models\User;
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

        // 1. Base counts & filters based on role
        $roomsQuery = Room::query();
        $branchesQuery = Branch::query();
        $bookingsQuery = Booking::query();
        $complaintsQuery = Complaint::query();
        
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
        } elseif ($user->role === 'resident') {
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
                ->whereHas('booking.room', function($q) use ($user) {
                    $q->whereIn('branch_id', $user->assigned_branches);
                })
                ->whereMonth('transaction_date', now()->month)
                ->whereYear('transaction_date', now()->year)
                ->sum('amount');

            $expenseThisMonth = Finance::where('transaction_type', 'expense')
                ->whereHas('booking.room', function($q) use ($user) {
                    $q->whereIn('branch_id', $user->assigned_branches);
                })
                ->whereMonth('transaction_date', now()->month)
                ->whereYear('transaction_date', now()->year)
                ->sum('amount');
        }

        // Notifikasi & Peringatan Real-Time
        $notifications = [];

        // Base queries for alert generation (scoped to role)
        $unpaidPrevMonthBookingsQuery = Booking::with(['tenant', 'room.branch'])
            ->where('payment_status', 'unpaid')
            ->where('end_date', '<', now()->format('Y-m-d'));

        $expiryThreeDaysQuery = Booking::with(['tenant', 'room.branch'])
            ->where('status', 'active')
            ->whereBetween('end_date', [now()->format('Y-m-d'), now()->addDays(3)->format('Y-m-d')]);

        $dailyCheckingOutTodayQuery = Booking::with(['tenant', 'room.branch'])
            ->where('rental_type', 'daily')
            ->where('status', 'active')
            ->where('end_date', now()->format('Y-m-d'));

        $pendingComplaintsListQuery = Complaint::with(['tenant', 'room.branch'])
            ->where('status', 'pending');

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
        } elseif ($user->role === 'resident') {
            $unpaidPrevMonthBookingsQuery->where('tenant_id', $user->id);
            $expiryThreeDaysQuery->where('tenant_id', $user->id);
            $dailyCheckingOutTodayQuery->where('tenant_id', $user->id);
            $pendingComplaintsListQuery->where('tenant_id', $user->id);
        }

        $unpaidPrevMonthBookings = $unpaidPrevMonthBookingsQuery->get();
        $expiryThreeDays = $expiryThreeDaysQuery->get();
        $dailyCheckingOutToday = $dailyCheckingOutTodayQuery->get();
        $pendingComplaintsList = $pendingComplaintsListQuery->get();

        foreach ($unpaidPrevMonthBookings as $b) {
            $notifications[] = [
                'id' => 'unpaid-' . $b->id,
                'type' => 'unpaid_bill',
                'title' => 'Tagihan Belum Lunas',
                'message' => $user->role === 'resident'
                    ? 'Tagihan sewa Anda di ' . $b->room->branch->name . ' Kamar ' . $b->room->room_number . ' belum lunas dari bulan sebelumnya.'
                    : 'Tagihan sewa bulanan ' . $b->room->branch->name . ' Kamar ' . $b->room->room_number . ' atas nama ' . $b->tenant->name . ' belum lunas dari bulan sebelumnya.',
                'meta' => ['booking_code' => $b->booking_code, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number, 'amount' => $b->total_amount]
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
                'meta' => ['booking_code' => $b->booking_code, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number, 'end_date' => $b->end_date->format('d M Y')]
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
                'meta' => ['booking_code' => $b->booking_code, 'tenant' => $b->tenant->name, 'room' => $b->room->room_number]
            ];
        }

        foreach ($pendingComplaintsList as $c) {
            $notifications[] = [
                'id' => 'complaint-' . $c->id,
                'type' => 'new_complaint',
                'title' => 'Aduan Komplain Baru',
                'message' => $user->role === 'resident'
                    ? 'Komplain Anda: "' . $c->title . '" sedang menunggu respon pengelola.'
                    : 'Komplain masuk: "' . $c->title . '" di Kamar ' . $c->room->room_number . ' (' . $c->tenant->name . '). Butuh konfirmasi.',
                'meta' => ['complaint_id' => $c->id, 'tenant' => $c->tenant->name, 'room' => $c->room->room_number, 'title' => $c->title]
            ];
        }

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
