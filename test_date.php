<?php
$originalStart = new DateTime('2026-01-30');
for ($i = 1; $i <= 6; $i++) {
    $nextDate = clone $originalStart;
    $nextDate->modify("+$i month");
    if ($originalStart->format('d') > 28 && $nextDate->format('d') < $originalStart->format('d')) {
        $nextDate->modify('last day of previous month');
    }
    echo "Month $i: " . $nextDate->format('Y-m-d') . "\n";
}
