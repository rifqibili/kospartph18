Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 'public\images\ruang tamu.png'
$newBmp = New-Object System.Drawing.Bitmap($bmp, 1280, 720)

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]75)

$newBmp.Save('public\images\ruang tamu.jpg', $encoder, $encoderParams)
$bmp.Dispose()
$newBmp.Dispose()

$bmp2 = New-Object System.Drawing.Bitmap 'public\images\hero section.png'
$newBmp2 = New-Object System.Drawing.Bitmap($bmp2, 1280, 720)
$newBmp2.Save('public\images\hero section.jpg', $encoder, $encoderParams)
$bmp2.Dispose()
$newBmp2.Dispose()

$bmp3 = New-Object System.Drawing.Bitmap 'public\images\tampak depan.png'
$newBmp3 = New-Object System.Drawing.Bitmap($bmp3, 1280, 720)
$newBmp3.Save('public\images\tampak depan.jpg', $encoder, $encoderParams)
$bmp3.Dispose()
$newBmp3.Dispose()
