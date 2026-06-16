<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'branch_id',
        'room_number',
        'price_monthly',
        'price_daily',
        'price_weekly',
        'price_yearly',
        'price_weekend',
        'status',
        'facilities',
        'description',
        'image',
        'photos',
        'videos'
    ];

    protected $casts = [
        'facilities' => 'array',
        'photos' => 'array',
        'videos' => 'array',
        'price_monthly' => 'decimal:2',
        'price_daily' => 'decimal:2',
        'price_weekly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'price_weekend' => 'decimal:2'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
