<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Surat Perjanjian Sewa</title>
    <style>
        @page {
            size: 21cm 29.7cm; /* A4 size */
            margin: 2cm;
        }
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; margin: 0; padding: 0; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .header-title { font-size: 16pt; text-transform: uppercase; margin-bottom: 5px; }
        .header-subtitle { font-size: 12pt; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
        td { padding: 5px; vertical-align: top; }
        .label { width: 30%; font-weight: bold; }
        .colon { width: 5%; text-align: center; }
        .value { width: 65%; }
        .section-title { font-weight: bold; text-decoration: underline; margin-top: 20px; margin-bottom: 10px; }
        .signature-table { width: 100%; margin-top: 50px; text-align: center; }
        .signature-box { height: 80px; }
        .ktp-container { text-align: center; margin-top: 30px; }
        .ktp-img { max-width: 400px; max-height: 250px; border: 1px solid #000; }
        ul { margin-top: 5px; margin-bottom: 15px; }
        li { margin-bottom: 5px; }
        /* Print controls - hidden when printing */
        .print-controls {
            position: fixed;
            top: 16px;
            right: 16px;
            display: flex;
            gap: 8px;
            z-index: 999;
        }
        .btn-print {
            background: #16a34a;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .btn-print:hover { background: #15803d; }
        .btn-close {
            background: #64748b;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .btn-close:hover { background: #475569; }
        .document-wrapper {
            max-width: 21cm;
            margin: 60px auto 40px;
            padding: 2cm;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.15);
        }
        @media print {
            .print-controls { display: none !important; }
            .document-wrapper { margin: 0; padding: 2cm; box-shadow: none; max-width: none; }
            body { background: white; }
        }
        body { background: #e2e8f0; }
    </style>
</head>
<body>
    <!-- Print Controls -->
    <div class="print-controls">
        <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
        <button class="btn-close" onclick="window.close()">✕ Tutup</button>
    </div>

    <div class="document-wrapper">

    <div class="text-center font-bold header-title">SURAT PERJANJIAN SEWA KAMAR</div>
    <div class="text-center header-subtitle">KOSPART PH 18<br><span>Cabang: {{ $booking->room->branch->name ?? 'Pusat' }}</span></div>

    <p>Yang bertanda tangan di bawah ini:</p>

    <table>
        <tr>
            <td class="label">Nama</td>
            <td class="colon">:</td>
            <td class="value">Manajemen Kospart PH 18</td>
        </tr>
        <tr>
            <td class="label">Jabatan</td>
            <td class="colon">:</td>
            <td class="value">Pengelola Indekos</td>
        </tr>
    </table>
    <p>Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p>

    <table>
        <tr>
            <td class="label">Nama Lengkap</td>
            <td class="colon">:</td>
            <td class="value">{{ $booking->tenant->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">NIK</td>
            <td class="colon">:</td>
            <td class="value">{{ $booking->tenant->nik ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">No. WhatsApp</td>
            <td class="colon">:</td>
            <td class="value">{{ $booking->tenant->phone ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Email</td>
            <td class="colon">:</td>
            <td class="value">{{ $booking->tenant->email ?? '-' }}</td>
        </tr>
    </table>
    <p>Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>.</p>

    <p>PIHAK PERTAMA dan PIHAK KEDUA sepakat untuk mengadakan perjanjian sewa menyewa kamar dengan ketentuan sebagai berikut:</p>

    <div class="section-title">PASAL 1: OBJEK SEWA</div>
    <table>
        <tr>
            <td class="label">Nomor Kamar</td>
            <td class="colon">:</td>
            <td class="value">{{ $booking->room->room_number ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Masa Sewa</td>
            <td class="colon">:</td>
            <td class="value">{{ \Carbon\Carbon::parse($booking->start_date)->translatedFormat('d F Y') }} s/d {{ \Carbon\Carbon::parse($booking->end_date)->translatedFormat('d F Y') }}</td>
        </tr>
        <tr>
            <td class="label">Tipe Sewa</td>
            <td class="colon">:</td>
            <td class="value">{{ ucfirst($booking->rental_type) }}</td>
        </tr>
        <tr>
            <td class="label">Total Harga</td>
            <td class="colon">:</td>
            <td class="value">Rp {{ number_format($booking->total_amount, 0, ',', '.') }}</td>
        </tr>
    </table>

    <div class="section-title">PASAL 2: SYARAT & KETENTUAN (TATA TERTIB)</div>
    <p>PIHAK KEDUA wajib mematuhi seluruh Syarat dan Ketentuan serta tata tertib yang berlaku di Kospart PH 18, di antaranya:</p>
    <ul>
        <li>Dilarang membawa atau menggunakan obat-obatan terlarang dan minuman keras di lingkungan kos.</li>
        <li>Menjaga ketertiban, keamanan, dan kebersihan lingkungan kos serta kamar sewa.</li>
        <li>Tamu lawan jenis dilarang menginap atau masuk ke dalam kamar tidur.</li>
        <li>Keterlambatan pembayaran sewa bulanan dapat dikenakan sanksi berupa pemutusan hak sewa kamar secara sepihak oleh PIHAK PERTAMA.</li>
        <li>Pihak Kedua telah membaca, memahami, dan menyetujui seluruh ketentuan ini pada saat melakukan pendaftaran.</li>
    </ul>

    <p>Demikian surat perjanjian ini dibuat dengan kesadaran penuh tanpa ada paksaan dari pihak manapun.</p>

    <table class="signature-table">
        <tr>
            <td style="width: 50%;">
                <strong>PIHAK PERTAMA</strong><br>
                Pengelola Kospart PH 18
                <div class="signature-box"></div>
                <br>
                (_______________________)
            </td>
            <td style="width: 50%;">
                <strong>PIHAK KEDUA</strong><br>
                Penyewa Kamar
                <div class="signature-box"></div>
                <br>
                ( <strong>{{ $booking->tenant->name ?? '_______________________' }}</strong> )
            </td>
        </tr>
    </table>

    @if($ktpUrl)
        <!-- Page break for KTP Attachment -->
        <br clear="all" style="page-break-before:always" />
        <div class="text-center font-bold header-title">LAMPIRAN: IDENTITAS PENYEWA</div>
        <div class="ktp-container">
            <p style="text-align: left;">Berikut adalah lampiran salinan identitas resmi (KTP) milik Pihak Kedua yang diserahkan pada saat proses administrasi pemesanan kamar:</p>
            <br>
            <img src="{{ $ktpUrl }}" class="ktp-img" alt="Foto KTP">
        </div>
    @endif

    </div><!-- end document-wrapper -->
</body>
</html>
