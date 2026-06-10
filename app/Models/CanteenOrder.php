<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id', 'tenant_id', 'order_code', 'total_amount', 'payment_method',
        'payment_status', 'status', 'payment_proof', 'notes', 'delivery_method'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function items()
    {
        return $this->hasMany(CanteenOrderItem::class);
    }
}
