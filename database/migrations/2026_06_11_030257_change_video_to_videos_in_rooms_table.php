<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->json('videos')->nullable();
        });

        // Migrate existing video to videos array
        $rooms = DB::table('rooms')->whereNotNull('video')->get();
        foreach ($rooms as $room) {
            DB::table('rooms')->where('id', $room->id)->update([
                'videos' => json_encode([$room->video])
            ]);
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('video');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('video')->nullable();
        });

        $rooms = DB::table('rooms')->whereNotNull('videos')->get();
        foreach ($rooms as $room) {
            $videos = json_decode($room->videos, true);
            if (is_array($videos) && count($videos) > 0) {
                DB::table('rooms')->where('id', $room->id)->update([
                    'video' => $videos[0]
                ]);
            }
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('videos');
        });
    }
};
