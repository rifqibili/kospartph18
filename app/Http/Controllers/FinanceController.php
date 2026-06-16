<?php

namespace App\Http\Controllers;

use App\Models\Finance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'operator') {
            // Operator can only see finances related to their branches
            $finances = Finance::with('booking.room.branch')
                ->whereIn('branch_id', $user->assigned_branches)
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();
        } elseif ($user->role === 'resident') {
            $finances = Finance::with('booking.room.branch')
                ->where(function($query) use ($user) {
                    // Finance records linked to resident's bookings (sewa kamar, etc.)
                    $query->whereHas('booking', function($q) use ($user) {
                        $q->where('tenant_id', $user->id);
                    })
                    // OR finance records linked to resident's canteen orders
                    ->orWhereHas('canteenOrder', function($q) use ($user) {
                        $q->where('tenant_id', $user->id);
                    });
                })
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();
        } elseif ($user->role === 'super_admin') {
            $finances = Finance::with('booking.room.branch')
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json($finances);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'transaction_type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'transaction_date' => 'required|date',
            'description' => 'nullable|string',
            'branch_id' => 'required|exists:branches,id',
            'payment_method' => 'nullable|string',
        ]);

        $finance = Finance::create($request->all());

        return response()->json([
            'message' => 'Transaksi keuangan berhasil dicatat.',
            'finance' => $finance
        ]);
    }

    public function chartData()
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Query monthly income vs expense for the past 6 months
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $months[] = now()->subMonths($i)->format('Y-m');
        }

        $startDate = now()->subMonths(5)->startOfMonth();
        $query = Finance::selectRaw('
                DATE_FORMAT(transaction_date, "%Y-%m") as month_year,
                SUM(CASE WHEN transaction_type = "income" THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN transaction_type = "expense" THEN amount ELSE 0 END) as expense
            ')
            ->where('transaction_date', '>=', $startDate->toDateString());

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $query->whereIn('branch_id', $user->assigned_branches);
        }

        $groupedData = $query->groupBy('month_year')->get()->keyBy('month_year');

        $chartData = [];
        foreach ($months as $month) {
            $dateObj = \DateTime::createFromFormat('Y-m', $month);
            $monthName = $dateObj ? $dateObj->format('M Y') : $month;

            $monthData = $groupedData->get($month);
            $income = $monthData ? $monthData->income : 0;
            $expense = $monthData ? $monthData->expense : 0;

            $chartData[] = [
                'name' => $monthName,
                'Income' => floatval($income),
                'Expense' => floatval($expense),
                'Profit' => floatval($income - $expense),
            ];
        }

        return response()->json($chartData);
    }
}
