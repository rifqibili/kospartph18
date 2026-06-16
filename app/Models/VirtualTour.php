<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VirtualTour extends Model
{
    protected $fillable = [
        'title',
        'video_path',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
