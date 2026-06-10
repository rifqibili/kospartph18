<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CanteenItem;
use App\Models\CanteenOrder;
use App\Models\CanteenOrderItem;
use App\Models\User;
use App\Models\Branch;
use App\Models\Finance;
use Carbon\Carbon;

class CanteenDummySeeder extends Seeder
{
    public function run()
    {
        $branch = Branch::first();
        $tenant = User::where('role', 'resident')->first();
        
        if (!$branch || !$tenant) {
            echo "Branch or Tenant not found!\n";
            return;
        }

        // 1. Create Canteen Items
        $items = [
            [
                'branch_id' => $branch->id,
                'name' => 'Indomie Telur Kornet',
                'category' => 'food',
                'price' => 15000,
                'stock' => 50,
                'is_sellable' => true,
                'description' => 'Indomie kuah atau goreng porsi besar plus telur dan kornet',
            ],
            [
                'branch_id' => $branch->id,
                'name' => 'Kopi Susu Gula Aren',
                'category' => 'drink',
                'price' => 12000,
                'stock' => 30,
                'is_sellable' => true,
                'description' => 'Es kopi susu kekinian asli',
            ],
            [
                'branch_id' => $branch->id,
                'name' => 'Keripik Singkong Balado',
                'category' => 'snack',
                'price' => 8000,
                'stock' => 20,
                'is_sellable' => true,
                'description' => 'Cemilan gurih pedas',
            ],
            [
                'branch_id' => $branch->id,
                'name' => 'Beras 5kg',
                'category' => 'ingredient',
                'price' => 75000,
                'stock' => 5,
                'is_sellable' => false,
                'description' => 'Bahan baku untuk nasi goreng kantin',
            ]
        ];

        $createdItems = [];
        foreach ($items as $itemData) {
            $createdItems[] = CanteenItem::create($itemData);
            
            // Record expenses for stock
            Finance::create([
                'branch_id' => $branch->id,
                'transaction_type' => 'expense',
                'category' => 'pengeluaran_lain',
                'amount' => $itemData['price'] * ($itemData['stock'] / 2), // dummy expense logic
                'transaction_date' => Carbon::now()->subDays(rand(1, 5))->format('Y-m-d'),
                'description' => 'Belanja Stok Kantin: ' . $itemData['name'],
            ]);
        }

        // 2. Create Orders
        // Order 1: Completed, Paid via QRIS
        $order1 = CanteenOrder::create([
            'branch_id' => $branch->id,
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-' . time() . '1',
            'total_amount' => 27000, // 1 indomie, 1 kopi
            'status' => 'completed',
            'payment_method' => 'qris',
            'payment_status' => 'paid',
            'delivery_method' => 'delivery',
            'notes' => 'Tolong diantar ke kamar, jangan terlalu pedas',
            'payment_proof' => 'dummy.jpg'
        ]);
        
        CanteenOrderItem::create(['canteen_order_id' => $order1->id, 'canteen_item_id' => $createdItems[0]->id, 'quantity' => 1, 'price_at_time' => 15000]);
        CanteenOrderItem::create(['canteen_order_id' => $order1->id, 'canteen_item_id' => $createdItems[1]->id, 'quantity' => 1, 'price_at_time' => 12000]);

        Finance::create([
            'branch_id' => $branch->id,
            'transaction_type' => 'income',
            'category' => 'pendapatan_lain',
            'amount' => 27000,
            'transaction_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
            'description' => 'Pendapatan Kantin - Order #' . $order1->order_code,
        ]);

        // Order 2: Debt (Kasbon)
        $order2 = CanteenOrder::create([
            'branch_id' => $branch->id,
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-' . time() . '2',
            'total_amount' => 15000,
            'status' => 'completed',
            'payment_method' => 'debt',
            'payment_status' => 'debt_unpaid',
            'delivery_method' => 'pickup',
            'notes' => 'Kasbon dulu ya mas',
        ]);

        CanteenOrderItem::create(['canteen_order_id' => $order2->id, 'canteen_item_id' => $createdItems[0]->id, 'quantity' => 1, 'price_at_time' => 15000]);

        // Order 3: Processing (Cash)
        $order3 = CanteenOrder::create([
            'branch_id' => $branch->id,
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-' . time() . '3',
            'total_amount' => 16000, // 2 keripik
            'status' => 'processing',
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'delivery_method' => 'pickup',
            'notes' => 'Ambil sendiri nti sore',
        ]);
        
        CanteenOrderItem::create(['canteen_order_id' => $order3->id, 'canteen_item_id' => $createdItems[2]->id, 'quantity' => 2, 'price_at_time' => 8000]);

        echo "Dummy Data for Canteen Seeded successfully!\n";
    }
}
