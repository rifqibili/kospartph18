<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenItemRecipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'ingredient_item_id',
        'quantity'
    ];

    public function menu()
    {
        return $this->belongsTo(CanteenItem::class, 'menu_item_id');
    }

    public function ingredient()
    {
        return $this->belongsTo(CanteenItem::class, 'ingredient_item_id');
    }
}
