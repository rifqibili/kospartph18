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
            // Operator can only see finances related to bookings in their branches
            // or general finances.
            $finances = Finance::with('booking.room.branch')
                ->where(function($q) use ($user) {
                    $q->whereHas('booking.room', function($sq) use ($user) {
                        $sq->whereIn('branch_id', $user->assigned_branches);
                    })->orWhereNull('booking_id');
                })
                ->orderBy('transaction_date', 'desc')
                ->get();
        } elseif ($user->role === 'resident') {
            $finances = Finance::with('booking.room.branch')
                ->whereHas('booking', function($q) use ($user) {
                    $q->where('tenant_id', $user->id);
                })
                ->orderBy('transaction_date', 'desc')
                ->get();
        } elseif ($user->role === 'super_admin') {
            $finances = Finance::with('booking.room.branch')
                ->orderBy('transaction_date', 'desc')
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

        $chartData = [];
        foreach ($months as $month) {
            $yearStr = substr($month, 0, 4);
            $monthStr = substr($month, 5, 2);

            $incomeQuery = Finance::where('transaction_type', 'income')
                ->whereYear('transaction_date', $yearStr)
                ->whereMonth('transaction_date', $monthStr);

            $expenseQuery = Finance::where('transaction_type', 'expense')
                ->whereYear('transaction_date', $yearStr)
                ->whereMonth('transaction_date', $monthStr);

            if ($user->role === 'operator' && is_array($user->assigned_branches)) {
                $incomeQuery->whereHas('booking.room', function($q) use ($user) {
                    $q->whereIn('branch_id', $user->assigned_branches);
                });
                $expenseQuery->where(function($q) use ($user) {
                    $q->whereHas('booking.room', function($sq) use ($user) {
                        $sq->whereIn('branch_id', $user->assigned_branches);
                    })->orWhereNull('booking_id');
                });
            }

            $income = $incomeQuery->sum('amount');
            $expense = $expenseQuery->sum('amount');

            $dateObj = \DateTime::createFromFormat('Y-m', $month);
            $monthName = $dateObj ? $dateObj->format('M Y') : $month;

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
