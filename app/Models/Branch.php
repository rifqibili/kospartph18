<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = ['name', 'address', 'maps_link', 'status', 'image_path', 'video_path'];

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
