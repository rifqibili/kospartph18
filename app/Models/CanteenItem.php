<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id', 'name', 'category', 'price', 'stock', 'unit', 'is_sellable', 'image', 'description'
    ];

    protected $casts = [
        'is_sellable' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function recipes()
    {
        return $this->hasMany(CanteenItemRecipe::class, 'menu_item_id');
    }
}
