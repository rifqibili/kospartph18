<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'canteen_order_id', 'canteen_item_id', 'quantity', 'price_at_time'
    ];

    protected $casts = [
        'price_at_time' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(CanteenOrder::class, 'canteen_order_id');
    }

    public function item()
    {
        return $this->belongsTo(CanteenItem::class, 'canteen_item_id');
    }
}
