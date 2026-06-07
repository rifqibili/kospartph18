<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'booking_code',
        'room_id',
        'tenant_id',
        'rental_type',
        'start_date',
        'end_date',
        'total_amount',
        'status',
        'payment_status',
        'paid_amount',
        'payment_proof',
        'otp_code',
        'otp_verified',
        'otp_sent_at'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'otp_verified' => 'boolean',
        'otp_sent_at' => 'datetime'
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function finances(): HasMany
    {
        return $this->hasMany(Finance::class);
    }
}
