<?php

namespace App\Http\Controllers;

use App\Models\CanteenItem;
use App\Models\Finance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CanteenItemController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = CanteenItem::with(['branch', 'recipes.ingredient']);

        if ($user && $user->role === 'operator' && is_array($user->assigned_branches)) {
            $query->whereIn('branch_id', $user->assigned_branches);
        }

        // Filter by branch_id if provided
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // For residents, only show sellable items
        if ($user && $user->role === 'resident') {
            $query->where('is_sellable', true);
            // Optionally, we can also filter by their active booking branch
            $activeBooking = \App\Models\Booking::where('tenant_id', $user->id)
                ->where('status', 'active')
                ->with('room')
                ->first();
            if ($activeBooking) {
                $query->where('branch_id', $activeBooking->room->branch_id);
            }
        }

        $items = $query->orderBy('name', 'asc')->get();

        foreach ($items as $item) {
            if ($item->recipes && $item->recipes->count() > 0) {
                $maxPortions = null;
                foreach ($item->recipes as $recipe) {
                    $ingredient = $recipe->ingredient;
                    if ($ingredient) {
                        $portions = floor($ingredient->stock / $recipe->quantity);
                        if ($maxPortions === null || $portions < $maxPortions) {
                            $maxPortions = $portions;
                        }
                    }
                }
                $item->stock = $maxPortions ?? 0;
            }
        }

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:food,drink,snack,ice_cream,ingredient',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'unit' => 'nullable|string',
            'is_sellable' => 'boolean',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120', // max 5MB
            'add_to_finance' => 'boolean', // Flag if we want to log the initial stock purchase to Finance
            'total_cost' => 'nullable|numeric|min:0', // Cost if add_to_finance is true
            'recipes' => 'nullable|string' // JSON string of recipes
        ]);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($request->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $data = $request->except(['image', 'add_to_finance', 'total_cost', 'recipes']);
        
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('canteen_images', 'public');
        }

        $data['is_sellable'] = $request->has('is_sellable') ? filter_var($request->is_sellable, FILTER_VALIDATE_BOOLEAN) : true;

        $item = CanteenItem::create($data);

        if ($request->filled('recipes')) {
            $recipes = json_decode($request->recipes, true);
            if (is_array($recipes)) {
                foreach ($recipes as $recipe) {
                    \App\Models\CanteenItemRecipe::create([
                        'menu_item_id' => $item->id,
                        'ingredient_item_id' => $recipe['ingredient_item_id'],
                        'quantity' => $recipe['quantity'],
                    ]);
                }
            }
        }

        // Record expense for restocking if chosen
        if ($request->boolean('add_to_finance') && $request->filled('total_cost') && $request->total_cost > 0) {
            Finance::create([
                'branch_id' => $item->branch_id,
                'amount' => $request->total_cost,
                'transaction_type' => 'expense',
                'category' => 'restock_kantin',
                'description' => "Belanja awal stok kantin: {$item->name} ({$item->stock} pcs)",
                'transaction_date' => now()->toDateString(),
            ]);
        }

        return response()->json(['message' => 'Menu / Barang kantin berhasil ditambahkan.', 'item' => $item]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $item = CanteenItem::findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($item->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|in:food,drink,snack,ice_cream,ingredient',
            'price' => 'sometimes|required|numeric|min:0',
            'stock' => 'sometimes|required|integer|min:0',
            'unit' => 'nullable|string',
            'is_sellable' => 'boolean',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
            'add_to_finance' => 'boolean', 
            'total_cost' => 'nullable|numeric|min:0',
            'recipes' => 'nullable|string'
        ]);

        $data = $request->except(['image', 'add_to_finance', 'total_cost', 'recipes']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('canteen_images', 'public');
        }

        if ($request->has('is_sellable')) {
            $data['is_sellable'] = filter_var($request->is_sellable, FILTER_VALIDATE_BOOLEAN);
        }

        // Calculate stock difference if restock
        $oldStock = $item->stock;
        
        $item->update($data);

        if ($request->filled('recipes')) {
            $recipes = json_decode($request->recipes, true);
            if (is_array($recipes)) {
                $item->recipes()->delete(); // Remove old recipes
                foreach ($recipes as $recipe) {
                    \App\Models\CanteenItemRecipe::create([
                        'menu_item_id' => $item->id,
                        'ingredient_item_id' => $recipe['ingredient_item_id'],
                        'quantity' => $recipe['quantity'],
                    ]);
                }
            }
        } else if ($request->has('recipes')) {
             // If recipes is explicitly sent as empty (e.g., cleared all)
             $item->recipes()->delete();
        }

        // Record expense for restocking if chosen
        if ($request->has('stock') && $request->stock > $oldStock && $request->boolean('add_to_finance') && $request->filled('total_cost') && $request->total_cost > 0) {
            $diff = $request->stock - $oldStock;
            Finance::create([
                'branch_id' => $item->branch_id,
                'amount' => $request->total_cost,
                'transaction_type' => 'expense',
                'category' => 'restock_kantin',
                'description' => "Restock kantin: {$item->name} (+{$diff} pcs)",
                'transaction_date' => now()->toDateString(),
            ]);
        }

        return response()->json(['message' => 'Menu / Barang kantin berhasil diperbarui.', 'item' => $item]);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $item = CanteenItem::findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($item->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $item->delete();
        return response()->json(['message' => 'Menu / Barang kantin berhasil dihapus.']);
    }
}
