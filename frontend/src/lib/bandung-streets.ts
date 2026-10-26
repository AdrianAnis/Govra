export interface BandungStreet {
  readonly name: string;
  readonly deltaLat: number;
  readonly deltaLng: number;
  readonly landmark?: string;
}

const STREET_DATA: Record<string, readonly BandungStreet[]> = {
  babakan: [
    { name: "Jl. Babakan Ciparay", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Kantor Kelurahan Babakan" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0017, deltaLng: -0.0018, landmark: "Jalur By Pass Babakan" },
    { name: "Jl. Caringin", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Akses Menuju Pasar Caringin" },
    { name: "Jl. K.H. Wahid Hasyim (Kopo)", deltaLat: -0.0014, deltaLng: 0.0016, landmark: "Simpang Kopo Babakan" },
  ],
  babakanciparay: [
    { name: "Jl. K.H. Wahid Hasyim (Kopo)", deltaLat: 0.0018, deltaLng: 0.0013, landmark: "Sentra Niaga Kopo" },
    { name: "Jl. Babakan Ciparay", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Pusat Pemukiman Warga" },
    { name: "Jl. Pagarsih Barat", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Akses Pagarsih" },
    { name: "Jl. Sukahaji", deltaLat: -0.0013, deltaLng: 0.0018, landmark: "Batas Kelurahan Sukahaji" },
  ],
  cirangrang: [
    { name: "Jl. Cirangrang", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Pusat Pemukiman Cirangrang" },
    { name: "Jl. Kopo Cirangrang", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Dekat Pintu Tol Kopo" },
    { name: "Jl. Cibolerang", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Jalur Menuju Cibolerang" },
  ],
  margahayuutara: [
    { name: "Jl. Margahayu Raya Barat", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Kompleks Margahayu Barat" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Koridor By Pass" },
    { name: "Jl. Cibolerang", deltaLat: 0.002, deltaLng: 0.0014, landmark: "Akses Perumahan Taman Holis" },
  ],
  margasuka: [
    { name: "Jl. Margasuka", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Kantor Kelurahan Margasuka" },
    { name: "Jl. Taman Holis Indah", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Kompleks Taman Holis" },
    { name: "Jl. Cibolerang Raya", deltaLat: 0.0021, deltaLng: 0.0016, landmark: "Sentra Industri dan Hunian" },
  ],
  sukahaji: [
    { name: "Jl. Sukahaji", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Sentra Pemukiman Sukahaji" },
    { name: "Jl. K.H. Wahid Hasyim (Kopo)", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Koridor Utama Kopo" },
    { name: "Jl. Caringin", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Simpang Tiga Caringin" },
  ],
  cigondewahrahayu: [
    { name: "Jl. Cigondewah Rahayu", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Pasar Kain Cigondewah Rahayu" },
    { name: "Jl. Cigondewah Kaler", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Sentra Grosir Kain" },
    { name: "Jl. Holis", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Akses Holis By Pass" },
    { name: "Jl. Mahmud", deltaLat: -0.0018, deltaLng: 0.0017, landmark: "Jalur Alternatif Mahmud" },
  ],
  cigereleng: [
    { name: "Jl. Moh. Toha", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Akses Tol Moh. Toha" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "By Pass Cigereleng" },
    { name: "Jl. Kembar Baru", deltaLat: 0.0015, deltaLng: 0.0017, landmark: "Kompleks Kembar Baru" },
    { name: "Jl. Cigereleng", deltaLat: -0.0013, deltaLng: 0.0015, landmark: "Pemukiman Warga Cigereleng" },
  ],

  campaka: [
    { name: "Jl. Jenderal Sudirman", deltaLat: 0.0012, deltaLng: -0.0015, landmark: "Dekat Halte Sudirman Campaka" },
    { name: "Jl. Dadali", deltaLat: -0.001, deltaLng: 0.0012, landmark: "Kawasan Pemukiman Dadali" },
    { name: "Jl. Rajawali Timur", deltaLat: 0.0025, deltaLng: 0.0008, landmark: "Jalur Utama Rajawali" },
    { name: "Jl. Garuda", deltaLat: -0.002, deltaLng: -0.0018, landmark: "Simpang Garuda" },
    { name: "Jl. Elang Raya", deltaLat: 0.0005, deltaLng: 0.0022, landmark: "Dekat Bundaran Elang" },
  ],
  ciroyom: [
    { name: "Jl. Ciroyom", deltaLat: 0.0015, deltaLng: -0.0012, landmark: "Pasar Ciroyom" },
    { name: "Jl. Andir", deltaLat: -0.0014, deltaLng: 0.0018, landmark: "Dekat Perlintasan Kereta Andir" },
    { name: "Jl. Arjuna", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Koridor Arjuna" },
    { name: "Jl. Ciroyom Barat", deltaLat: -0.0018, deltaLng: -0.002, landmark: "Sentra Niaga Ciroyom" },
  ],
  dunguscariang: [
    { name: "Jl. Jenderal Sudirman", deltaLat: 0.0011, deltaLng: -0.0009, landmark: "Dekat Simpang Jamika" },
    { name: "Jl. Kelenteng", deltaLat: -0.0015, deltaLng: 0.0014, landmark: "Kawasan Klenteng Pasar" },
    { name: "Jl. Kebon Jati", deltaLat: 0.002, deltaLng: 0.0016, landmark: "Pertokoan Kebon Jati" },
    { name: "Jl. Gardujati", deltaLat: -0.0008, deltaLng: -0.0017, landmark: "Dekat Kuliner Gardujati" },
  ],
  garuda: [
    { name: "Jl. Garuda", deltaLat: 0.0014, deltaLng: 0.0011, landmark: "Depan Pangkalan Udara" },
    { name: "Jl. Jenderal Sudirman", deltaLat: -0.0012, deltaLng: -0.0015, landmark: "Batas Sudirman Garuda" },
    { name: "Jl. Dunguscariang", deltaLat: 0.0021, deltaLng: -0.001, landmark: "Dekat Pertigaan" },
    { name: "Jl. Maleber Utara", deltaLat: -0.0019, deltaLng: 0.002, landmark: "Akses Menuju Maleber" },
  ],
  kebonjeruk: [
    { name: "Jl. Kebon Jati", deltaLat: 0.0016, deltaLng: 0.0012, landmark: "Dekat Stasiun Hall Bandung" },
    { name: "Jl. Gardujati", deltaLat: -0.0012, deltaLng: -0.0014, landmark: "Sentra Niaga Gardujati" },
    { name: "Jl. Suniaraja", deltaLat: 0.002, deltaLng: -0.0018, landmark: "Pintu Masuk Pasar Baru" },
    { name: "Jl. Stasiun Barat", deltaLat: -0.0017, deltaLng: 0.0021, landmark: "Kawasan Kereta Api" },
  ],
  maleber: [
    { name: "Jl. Rajawali Barat", deltaLat: 0.0018, deltaLng: -0.0014, landmark: "Koridor Rajawali Barat" },
    { name: "Jl. Maleber Barat", deltaLat: -0.0013, deltaLng: 0.0016, landmark: "Akses Pemukiman Warga" },
    { name: "Jl. Maleber Utara", deltaLat: 0.0022, deltaLng: 0.0011, landmark: "Dekat Sentra Kuliner Maleber" },
  ],
  antapanikidul: [
    { name: "Jl. Terusan Jakarta", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Jalur Utama Antapani" },
    { name: "Jl. Cibatu Raya", deltaLat: -0.0014, deltaLng: -0.0018, landmark: "Kawasan Pemukiman Cibatu" },
    { name: "Jl. Kalijati Raya", deltaLat: 0.0012, deltaLng: -0.0022, landmark: "Dekat Kompleks Kalijati" },
    { name: "Jl. Antapani Lama", deltaLat: -0.0019, deltaLng: 0.0017, landmark: "Pasar Subuh Antapani" },
  ],
  antapanikulon: [
    { name: "Jl. Purwakarta", deltaLat: 0.0015, deltaLng: -0.0012, landmark: "Sentra Kuliner Purwakarta Antapani" },
    { name: "Jl. Subang Raya", deltaLat: -0.0016, deltaLng: 0.0014, landmark: "Akses Menuju Arcamanik" },
    { name: "Jl. Kuningan Raya", deltaLat: 0.0021, deltaLng: 0.0018, landmark: "Kawasan Sekolah dan Perumahan" },
    { name: "Jl. Terusan Jakarta", deltaLat: -0.0011, deltaLng: -0.0019, landmark: "Dekat Griya Antapani" },
  ],
  antapanitengah: [
    { name: "Jl. Indramayu", deltaLat: 0.0014, deltaLng: 0.0016, landmark: "Pusat Kegiatan Warga Antapani Tengah" },
    { name: "Jl. Cirebon Raya", deltaLat: -0.0017, deltaLng: -0.0012, landmark: "Jalur Penghubung Antapani" },
    { name: "Jl. Majalengka", deltaLat: 0.0019, deltaLng: -0.0018, landmark: "Kawasan Perumahan Majalengka" },
    { name: "Jl. Terusan Jakarta", deltaLat: -0.0012, deltaLng: 0.002, landmark: "Sisi Timur Terusan Jakarta" },
  ],
  antapaniwetan: [
    { name: "Jl. Kalijati Raya", deltaLat: 0.0016, deltaLng: -0.0015, landmark: "Akses Kalijati Timur" },
    { name: "Jl. Ciamis Raya", deltaLat: -0.0013, deltaLng: 0.0018, landmark: "Kompleks Ciamis Antapani" },
    { name: "Jl. Tasikmalaya", deltaLat: 0.0022, deltaLng: 0.0012, landmark: "Sentra Pemukiman Warga" },
  ],
  cisarantenbinaharapan: [
    { name: "Jl. Cisaranten Bina Harapan", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Jalan Utama Kelurahan" },
    { name: "Jl. Sukamiskin Raya", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Akses Penghubung Arcamanik" },
    { name: "Jl. Pacuan Kuda", deltaLat: 0.0024, deltaLng: -0.0012, landmark: "Kawasan Sport Jabar Arcamanik" },
  ],
  cisarantenendah: [
    { name: "Jl. Cisaranten Endah", deltaLat: 0.0014, deltaLng: -0.0015, landmark: "Pusat Pemukiman Cisaranten" },
    { name: "Jl. Arcamanik Endah", deltaLat: -0.0018, deltaLng: 0.0016, landmark: "Kompleks Arcamanik Endah" },
    { name: "Jl. Golf Raya", deltaLat: 0.0021, deltaLng: 0.0018, landmark: "Dekat Lapangan Golf Arcamanik" },
  ],
  cisarantenkulon: [
    { name: "Jl. Cisaranten Kulon", deltaLat: 0.0016, deltaLng: 0.0015, landmark: "Jalur Utama Cisaranten Kulon" },
    { name: "Jl. Parakan Asri", deltaLat: -0.0014, deltaLng: -0.0018, landmark: "Perumahan Parakan" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0022, deltaLng: 0.002, landmark: "Akses Arteri Soekarno Hatta" },
  ],
  sukamiskin: [
    { name: "Jl. A.H. Nasution", deltaLat: 0.0022, deltaLng: 0.0012, landmark: "Jalur Arteri A.H. Nasution" },
    { name: "Jl. Pacuan Kuda", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Stadion Sport Center Arcamanik" },
    { name: "Jl. Sukamiskin Raya", deltaLat: 0.0013, deltaLng: 0.0017, landmark: "Kawasan Pemukiman Sukamiskin" },
  ],
  cibadak: [
    { name: "Jl. Cibadak", deltaLat: 0.0015, deltaLng: 0.0012, landmark: "Kawasan Kuliner Malam Cibadak" },
    { name: "Jl. Jenderal Sudirman", deltaLat: -0.0014, deltaLng: -0.0015, landmark: "Pusat Niaga Sudirman" },
    { name: "Jl. Astana Anyar", deltaLat: 0.002, deltaLng: -0.0013, landmark: "Pasar Astana Anyar" },
    { name: "Jl. Pagarsih", deltaLat: -0.0018, deltaLng: 0.0019, landmark: "Sentra Percetakan Pagarsih" },
  ],
  karanganyar: [
    { name: "Jl. Karanganyar", deltaLat: 0.0013, deltaLng: -0.0014, landmark: "Dekat Rumah Sakit Immanuel Lama" },
    { name: "Jl. Kalipah Apo", deltaLat: -0.0012, deltaLng: 0.0016, landmark: "Sentra Kuliner Kalipah Apo" },
    { name: "Jl. Otto Iskandardinata", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Koridor Otista Pasar Baru" },
    { name: "Jl. Pasirkoja", deltaLat: -0.0019, deltaLng: -0.0017, landmark: "Simpang Pasirkoja" },
  ],
  karasak: [
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0024, deltaLng: 0.0016, landmark: "Jalur By Pass Soekarno Hatta" },
    { name: "Jl. Moch. Toha", deltaLat: -0.0018, deltaLng: -0.0014, landmark: "Akses Tol Moch. Toha" },
    { name: "Jl. Karasak Lama", deltaLat: 0.0011, deltaLng: 0.0018, landmark: "Kawasan Pemukiman Karasak" },
  ],
  nyengseret: [
    { name: "Jl. Nyengseret", deltaLat: 0.0014, deltaLng: 0.0015, landmark: "Jalan Utama Kelurahan" },
    { name: "Jl. Peta", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Koridor Peta / Lingkar Selatan" },
    { name: "Jl. Kopo", deltaLat: 0.0022, deltaLng: -0.0012, landmark: "Simpang Kopo Nyengseret" },
  ],
  panjunan: [
    { name: "Jl. Panjunan", deltaLat: 0.0015, deltaLng: -0.0013, landmark: "Akses Pemukiman Panjunan" },
    { name: "Jl. K.H. Wahid Hasyim (Kopo)", deltaLat: -0.0017, deltaLng: 0.0018, landmark: "Koridor Utama Kopo" },
    { name: "Jl. Astana Anyar", deltaLat: 0.002, deltaLng: 0.0014, landmark: "Simpang Tiga Astana Anyar" },
  ],
  pelindunghewan: [
    { name: "Jl. Moch. Toha", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Depan Taman Tegallega" },
    { name: "Jl. BKR", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Lingkar BKR Pelindung Hewan" },
    { name: "Jl. Pelindung Hewan", deltaLat: 0.0012, deltaLng: -0.0019, landmark: "Kantor Kelurahan Pelindung Hewan" },
  ],
  dago: [
    { name: "Jl. Ir. H. Djuanda (Dago)", deltaLat: 0.0018, deltaLng: 0.0012, landmark: "Simpang Dago / McD Dago" },
    { name: "Jl. Dipati Ukur", deltaLat: -0.0015, deltaLng: 0.0016, landmark: "Kawasan Kampus Unpad DU" },
    { name: "Jl. Tubagus Ismail Raya", deltaLat: 0.0024, deltaLng: 0.002, landmark: "Sentra Niaga Tubagus Ismail" },
    { name: "Jl. Dago Elos", deltaLat: 0.0031, deltaLng: -0.0014, landmark: "Kawasan Dago Atas" },
    { name: "Jl. Cisitu Indah", deltaLat: 0.0012, deltaLng: -0.0022, landmark: "Kompleks Cisitu" },
    { name: "Jl. Dago Pojok", deltaLat: 0.0022, deltaLng: -0.001, landmark: "Kampung Kreatif Dago Pojok" },
    { name: "Jl. Bukit Dago Utara", deltaLat: 0.0038, deltaLng: 0.0015, landmark: "Perumahan Dago Asri" },
  ],
  lebakgede: [
    { name: "Jl. Dipati Ukur", deltaLat: 0.0014, deltaLng: 0.0012, landmark: "Pusat Kampus ITHB / Unikom" },
    { name: "Jl. Teuku Umar", deltaLat: -0.0013, deltaLng: -0.0015, landmark: "Kawasan Teuku Umar" },
    { name: "Jl. Hasanudin", deltaLat: 0.0018, deltaLng: -0.0014, landmark: "Dekat RS Borromeus" },
    { name: "Jl. Kyai Gede Utama", deltaLat: -0.0017, deltaLng: 0.0019, landmark: "Perkantoran dan Hunian" },
  ],
  lebaksiliwangi: [
    { name: "Jl. Ganesa", deltaLat: 0.0012, deltaLng: 0.0011, landmark: "Gerbang Utama Kampus ITB" },
    { name: "Jl. Tamansari", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Kebun Binatang Bandung" },
    { name: "Jl. Siliwangi", deltaLat: 0.0021, deltaLng: 0.0018, landmark: "Hutan Kota Babakan Siliwangi" },
    { name: "Jl. Sumur Bandung", deltaLat: -0.0012, deltaLng: 0.0015, landmark: "Akses Cihampelas Siliwangi" },
  ],
  cipaganti: [
    { name: "Jl. Cipaganti", deltaLat: 0.0016, deltaLng: -0.0014, landmark: "Masjid Raya Cipaganti" },
    { name: "Jl. Cihampelas", deltaLat: -0.0018, deltaLng: 0.0015, landmark: "Sentra Jeans Cihampelas / Ciwalk" },
    { name: "Jl. Eyckman", deltaLat: 0.0022, deltaLng: 0.0011, landmark: "Fakultas Kedokteran Unpad / RSHS" },
    { name: "Jl. Makmur", deltaLat: -0.0011, deltaLng: -0.0017, landmark: "Pemukiman Cipaganti" },
  ],
  sadangserang: [
    { name: "Jl. Sadang Serang", deltaLat: 0.0015, deltaLng: 0.0014, landmark: "Pasar Sadang Serang" },
    { name: "Jl. Sadang Hegar", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Kompleks Sadang Hegar" },
    { name: "Jl. Cikutra Barat", deltaLat: 0.0022, deltaLng: 0.0019, landmark: "Akses Menuju Bojongkoneng" },
  ],
  sekeloa: [
    { name: "Jl. Sekeloa Raya", deltaLat: 0.0013, deltaLng: 0.0012, landmark: "Pusat Pemukiman Mahasiswa Sekeloa" },
    { name: "Jl. Dipati Ukur Bawah", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Simpang DU Sekeloa" },
    { name: "Jl. Tubagus Ismail Bawah", deltaLat: 0.002, deltaLng: 0.0017, landmark: "Pertigaan Tubagus Ismail" },
  ],
  braga: [
    { name: "Jl. Braga", deltaLat: 0.0012, deltaLng: 0.0011, landmark: "Kawasan Wisata Heritage Braga" },
    { name: "Jl. Naripan", deltaLat: -0.0014, deltaLng: 0.0015, landmark: "Gedung Bank BJB Naripan" },
    { name: "Jl. Suniaraja", deltaLat: 0.0019, deltaLng: -0.0014, landmark: "Viaduct Suniaraja" },
    { name: "Jl. Lembong", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Museum Mandala Wangsit Siliwangi" },
    { name: "Jl. ABC", deltaLat: 0.0011, deltaLng: -0.0019, landmark: "Sentra Jam dan Elektronik ABC" },
    { name: "Jl. Banceuy", deltaLat: -0.0018, deltaLng: 0.0012, landmark: "Monumen Penjara Banceuy" },
  ],
  babakanciamis: [
    { name: "Jl. Wastukencana", deltaLat: 0.0017, deltaLng: -0.0013, landmark: "Balaikota Bandung" },
    { name: "Jl. Perintis Kemerdekaan", deltaLat: -0.0015, deltaLng: 0.0014, landmark: "Gedung Indonesia Menggugat" },
    { name: "Jl. Kebon Kawung", deltaLat: 0.0021, deltaLng: 0.0016, landmark: "Stasiun Kereta Api Bandung" },
    { name: "Jl. Cicendo", deltaLat: -0.0012, deltaLng: -0.0018, landmark: "RS Mata Cicendo" },
  ],
  kebonpisang: [
    { name: "Jl. Ahmad Yani", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Pasar Kosambi" },
    { name: "Jl. Veteran", deltaLat: -0.0014, deltaLng: -0.0015, landmark: "Sentra Onderdil Veteran" },
    { name: "Jl. Sunda", deltaLat: 0.002, deltaLng: -0.0012, landmark: "Pusat Belanja Yogya Sunda" },
    { name: "Jl. Baranangsiang", deltaLat: -0.0017, deltaLng: 0.0018, landmark: "Dekat Pasar Kosambi Dalam" },
  ],
  merdeka: [
    { name: "Jl. Merdeka", deltaLat: 0.0016, deltaLng: -0.0011, landmark: "Bandung Indah Plaza (BIP)" },
    { name: "Jl. Jawa", deltaLat: -0.0013, deltaLng: 0.0014, landmark: "Kantor Dinas Pendidikan Kota Bandung" },
    { name: "Jl. Sumatera", deltaLat: 0.0019, deltaLng: 0.0017, landmark: "Taman Vanda / BI Bandung" },
    { name: "Jl. Aceh", deltaLat: -0.0017, deltaLng: -0.0015, landmark: "GOR Saparua" },
    { name: "Jl. R.E. Martadinata (Riau)", deltaLat: 0.0024, deltaLng: 0.0012, landmark: "Kawasan Factory Outlet Riau" },
  ],
  citarum: [
    { name: "Jl. Diponegoro", deltaLat: 0.0018, deltaLng: 0.0012, landmark: "Gedung Sate Pemprov Jabar" },
    { name: "Jl. R.E. Martadinata (Jl. Riau)", deltaLat: -0.0015, deltaLng: -0.0014, landmark: "Sentra Kuliner dan FO Riau" },
    { name: "Jl. Citarum", deltaLat: 0.0014, deltaLng: 0.0018, landmark: "Masjid Istiqamah Citarum" },
    { name: "Jl. Ciliwung", deltaLat: -0.0016, deltaLng: 0.0016, landmark: "Kawasan Kafe Ciliwung" },
    { name: "Jl. Cisangkuy", deltaLat: 0.0022, deltaLng: -0.0015, landmark: "Taman Lansia Cisangkuy" },
    { name: "Jl. Progo", deltaLat: -0.0012, deltaLng: -0.002, landmark: "Deretan Kafe Progo" },
  ],
  cihapit: [
    { name: "Jl. Cihapit", deltaLat: 0.0015, deltaLng: 0.0012, landmark: "Pasar Tradisional Cihapit" },
    { name: "Jl. Sabang", deltaLat: -0.0014, deltaLng: -0.0015, landmark: "Kawasan Pemukiman Sabang" },
    { name: "Jl. Bengawan", deltaLat: 0.002, deltaLng: 0.0016, landmark: "Sentra Kafe Bengawan" },
    { name: "Jl. Gandapura", deltaLat: -0.0017, deltaLng: 0.0019, landmark: "Akses Menuju Gudang Selatan" },
    { name: "Jl. Lombok", deltaLat: 0.0012, deltaLng: -0.0018, landmark: "Stadion Siliwangi" },
  ],
  tamansari: [
    { name: "Jl. Tamansari", deltaLat: 0.0017, deltaLng: 0.0013, landmark: "Kampus Unisba / Unpas Tamansari" },
    { name: "Jl. Sawunggaling", deltaLat: -0.0013, deltaLng: -0.0015, landmark: "Pusat Kafe Sawunggaling" },
    { name: "Jl. Rangga Gading", deltaLat: 0.0019, deltaLng: -0.0012, landmark: "Dekat Balubur Town Square (Baltos)" },
    { name: "Jl. Purnawarman", deltaLat: -0.0016, deltaLng: 0.0018, landmark: "Bandung Electronic Center (BEC)" },
  ],
  pasteur: [
    { name: "Jl. Dr. Djunjunan (Pasteur)", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Gerbang Tol Pasteur / BTC Mall" },
    { name: "Jl. Sukajadi", deltaLat: -0.0016, deltaLng: 0.0018, landmark: "Paris Van Java (PVJ) Mall" },
    { name: "Jl. Surya Sumantri", deltaLat: 0.0028, deltaLng: -0.0016, landmark: "Universitas Kristen Maranatha" },
    { name: "Jl. Terusan Pasteur", deltaLat: -0.0012, deltaLng: -0.0021, landmark: "Akses Jembatan Pasupati" },
  ],
  cipedes: [
    { name: "Jl. Cipedes Tengah", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Pusat Pemukiman Cipedes" },
    { name: "Jl. Sukagalih", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Koridor Niaga Sukagalih" },
    { name: "Jl. Karang Tineung", deltaLat: 0.0021, deltaLng: -0.0013, landmark: "Dekat Bungsu Sukajadi" },
  ],
  sukabungah: [
    { name: "Jl. Sukabungah", deltaLat: 0.0014, deltaLng: -0.0015, landmark: "Akses Pemukiman Warga" },
    { name: "Jl. Dr. Otten", deltaLat: -0.0016, deltaLng: 0.0017, landmark: "Dekat RS Hasan Sadikin (RSHS)" },
    { name: "Jl. Sukamulya", deltaLat: 0.0022, deltaLng: 0.0013, landmark: "Dekat Pintu Belakang RSHS" },
  ],
  sukagalih: [
    { name: "Jl. Sukagalih Raya", deltaLat: 0.0017, deltaLng: 0.0012, landmark: "Sentra Pemukiman Sukagalih" },
    { name: "Jl. Babakan Jeruk", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Akses Menuju Surya Sumantri" },
    { name: "Jl. Sukamulya Indah", deltaLat: 0.0021, deltaLng: -0.0011, landmark: "Perumahan Sukamulya" },
  ],
  sukawarna: [
    { name: "Jl. Surya Sumantri", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Gedung Maranatha Plaza" },
    { name: "Jl. Lemah Neundeut", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Sentra Kos Mahasiswa" },
    { name: "Jl. Sukawarna", deltaLat: 0.0013, deltaLng: 0.0019, landmark: "Akses Menuju Tol Pasteur" },
  ],
  gegerkalong: [
    { name: "Jl. Gegerkalong Hilir", deltaLat: 0.0016, deltaLng: -0.0014, landmark: "Pesantren Daarut Tauhiid (DT)" },
    { name: "Jl. Gegerkalong Girang", deltaLat: -0.0015, deltaLng: 0.0017, landmark: "Sentra Kuliner KPAD" },
    { name: "Jl. Dr. Setiabudi", deltaLat: 0.0023, deltaLng: 0.0012, landmark: "Jalur Utama Setiabudi Lembang" },
    { name: "Jl. Sariwangi", deltaLat: -0.002, deltaLng: -0.0018, landmark: "Akses Perbatasan Bandung Barat" },
  ],
  isola: [
    { name: "Jl. Dr. Setiabudi", deltaLat: 0.002, deltaLng: 0.0014, landmark: "Gerbang Universitas Pendidikan Indonesia (UPI)" },
    { name: "Jl. Sersan Bajuri", deltaLat: -0.0018, deltaLng: -0.0016, landmark: "Sentra Tanaman Hias Ledeng" },
    { name: "Jl. Terusan Gegerkalong", deltaLat: 0.0015, deltaLng: -0.0019, landmark: "Akses Kampus Polban" },
  ],
  sarijadi: [
    { name: "Jl. Sarijadi Raya", deltaLat: 0.0018, deltaLng: 0.0013, landmark: "Pusat Blok Perumnas Sarijadi" },
    { name: "Jl. Sarimanis", deltaLat: -0.0014, deltaLng: -0.0015, landmark: "Blok Sarimanis" },
    { name: "Jl. Sarimanah", deltaLat: 0.0022, deltaLng: -0.0012, landmark: "Sentra Niaga Pasar Sarijadi" },
    { name: "Jl. Sariasih", deltaLat: -0.0017, deltaLng: 0.0018, landmark: "Dekat Poltekkes Kemenkes" },
  ],
  sukarasa: [
    { name: "Jl. Geger Kalong Tengah", deltaLat: 0.0014, deltaLng: 0.0016, landmark: "Akses Pemukiman Warga" },
    { name: "Jl. Sukarasa", deltaLat: -0.0016, deltaLng: -0.0014, landmark: "Dekat Kantor Kelurahan" },
    { name: "Jl. Cipaku Indah", deltaLat: 0.002, deltaLng: 0.0012, landmark: "Kawasan Hotel Cipaku" },
  ],
  ciumbuleuit: [
    { name: "Jl. Ciumbuleuit", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Universitas Katolik Parahyangan (Unpar)" },
    { name: "Jl. Rancabentang", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Kawasan Wisata Kafe Rancabentang" },
    { name: "Jl. Kiputih", deltaLat: 0.0024, deltaLng: -0.0012, landmark: "Kawasan Kuliner Atas" },
    { name: "Jl. Punclut", deltaLat: 0.0035, deltaLng: 0.0018, landmark: "Wisata Kuliner Tradisional Punclut" },
  ],
  hegarmanah: [
    { name: "Jl. Hegarmanah", deltaLat: 0.0015, deltaLng: -0.0013, landmark: "Kawasan Hunian Hegarmanah" },
    { name: "Jl. Bukit Hegar", deltaLat: -0.0017, deltaLng: 0.0016, landmark: "Perumahan Bukit Hegar" },
    { name: "Jl. Setiabudi", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Dekat Rumah Mode Factory Outlet" },
  ],
  ledeng: [
    { name: "Jl. Dr. Setiabudi Atas", deltaLat: 0.002, deltaLng: 0.0012, landmark: "Terminal Ledeng" },
    { name: "Jl. Sersan Bajuri", deltaLat: -0.0018, deltaLng: -0.0015, landmark: "Akses Wisata Kampung Gajah" },
    { name: "Jl. Cikuda Ledeng", deltaLat: 0.0014, deltaLng: 0.0018, landmark: "Pemukiman Warga Ledeng" },
  ],
  pajajaran: [
    { name: "Jl. Pajajaran", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "GOR Pajajaran Bandung" },
    { name: "Jl. Pandu", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Makam Pandu Heritage" },
    { name: "Jl. Semar", deltaLat: 0.0013, deltaLng: -0.0018, landmark: "Akses Niaga Semar" },
    { name: "Jl. Rama", deltaLat: -0.0017, deltaLng: 0.0015, landmark: "Kawasan Pemukiman Rama" },
  ],
  pasirkaliki: [
    { name: "Jl. Pasir Kaliki", deltaLat: 0.002, deltaLng: 0.0012, landmark: "Paskal 23 Mall / Hypersquare" },
    { name: "Jl. Dr. Rajiman", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Dekat RS Mata Cicendo" },
    { name: "Jl. Kebon Kawung", deltaLat: 0.0016, deltaLng: -0.0014, landmark: "Pintu Depan Stasiun KA Bandung" },
  ],
  sukaraja: [
    { name: "Jl. Gunung Batu", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Jalur Utama Gunung Batu" },
    { name: "Jl. Dakota", deltaLat: -0.0016, deltaLng: -0.0014, landmark: "Perumahan Lanud Husein" },
    { name: "Jl. Sukaraja", deltaLat: 0.0014, deltaLng: 0.0018, landmark: "Kantor Kelurahan Sukaraja" },
  ],
  arjuna: [
    { name: "Jl. Arjuna", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Koridor Bisnis Arjuna" },
    { name: "Jl. Bima", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Kawasan Hunian Bima" },
    { name: "Jl. Sadewa", deltaLat: 0.0019, deltaLng: -0.0012, landmark: "Dekat Stasiun Ciroyom" },
  ],
  husensastranegara: [
    { name: "Jl. Pajajaran Barat", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Bandara Internasional Husein" },
    { name: "Jl. Dr. Abdurrahman Saleh", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Sentra Niaga Abdurrahman Saleh" },
    { name: "Jl. Komodor Udara Supadio", deltaLat: 0.002, deltaLng: 0.0011, landmark: "Kawasan Kompleks Penerbad" },
  ],
  pamoyanan: [
    { name: "Jl. Pamoyanan", deltaLat: 0.0014, deltaLng: 0.0013, landmark: "Kawasan Pemukiman Pamoyanan" },
    { name: "Jl. Dursasana", deltaLat: -0.0013, deltaLng: -0.0015, landmark: "Dekat Puskesmas Pamoyanan" },
    { name: "Jl. Dr. Rum", deltaLat: 0.0018, deltaLng: 0.0016, landmark: "Akses Penghubung Cicendo" },
  ],
  cijerah: [
    { name: "Jl. Cijerah Raya", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Pasar Pola Cijerah" },
    { name: "Jl. Melong Asih", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Perbatasan Kota Cimahi" },
    { name: "Jl. Sudirman Barat", deltaLat: 0.0024, deltaLng: 0.0011, landmark: "Jalur Angkot Sudirman Cijerah" },
  ],
  caringin: [
    { name: "Jl. Caringin Raya", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Pasar Induk Caringin" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0017, deltaLng: -0.0018, landmark: "Flyover Caringin / Kopo" },
    { name: "Jl. Cibolerang", deltaLat: 0.0022, deltaLng: -0.0013, landmark: "Akses Tol Pasir Koja" },
  ],
  cibuntu: [
    { name: "Jl. Jenderal Sudirman", deltaLat: 0.0016, deltaLng: 0.0012, landmark: "Batas Kota Bandung Kulon" },
    { name: "Jl. Holis", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Sentra Tahu Cibuntu" },
    { name: "Jl. Rajawali Barat", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Simpang Tiga Rajawali" },
  ],
  cigondewahkaler: [
    { name: "Jl. Cigondewah Kaler", deltaLat: 0.0017, deltaLng: 0.0013, landmark: "Sentra Kain dan Tekstil Cigondewah" },
    { name: "Jl. Cigondewah Rahayu", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Pasar Kain Cigondewah" },
    { name: "Jl. Holis", deltaLat: 0.0023, deltaLng: 0.0014, landmark: "Pintu Masuk Kawasan Tekstil" },
  ],
  cigondewahkidul: [
    { name: "Jl. Cigondewah Kidul", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Kawasan Industri Tekstil Rumahan" },
    { name: "Jl. Batu Rengat", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Akses Pemukiman Warga" },
    { name: "Jl. Mahmud", deltaLat: 0.0021, deltaLng: -0.0012, landmark: "Jalur Menuju Makam Mahmud" },
  ],
  gempolsari: [
    { name: "Jl. Gempolsari", deltaLat: 0.0015, deltaLng: 0.0014, landmark: "Sentra Perajin Kain Gempol" },
    { name: "Jl. Cijerah", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Simpang Gempol Cijerah" },
    { name: "Jl. Gempol Kulon", deltaLat: 0.0019, deltaLng: 0.0017, landmark: "Pemukiman Warga" },
  ],
  warungmuncang: [
    { name: "Jl. Jenderal Sudirman", deltaLat: 0.0017, deltaLng: 0.0012, landmark: "Dekat Halte Warung Muncang" },
    { name: "Jl. Warung Muncang", deltaLat: -0.0014, deltaLng: -0.0015, landmark: "Akses Pasar Warung Muncang" },
    { name: "Jl. Cibuntu Timur", deltaLat: 0.002, deltaLng: 0.0016, landmark: "Sentra Produksi Tahu" },
  ],
  cibaduyut: [
    { name: "Jl. Cibaduyut Raya", deltaLat: 0.002, deltaLng: 0.0013, landmark: "Sentra Kerajinan Sepatu Cibaduyut" },
    { name: "Jl. TVRI", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Stasiun Pemancar TVRI Jabar" },
    { name: "Jl. Sayuran", deltaLat: 0.0024, deltaLng: -0.0014, landmark: "Kawasan Niaga Sayuran Cibaduyut" },
  ],
  cibaduyutkidul: [
    { name: "Jl. Cibaduyut Kidul", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Akses Perumahan Warga" },
    { name: "Jl. Terusan Cibaduyut", deltaLat: -0.0014, deltaLng: -0.0017, landmark: "Jalur Menuju Dayeuhkolot" },
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Underpass Cibaduyut" },
  ],
  cibaduyutwetan: [
    { name: "Jl. Cibaduyut Wetan", deltaLat: 0.0015, deltaLng: 0.0012, landmark: "Kawasan Pengrajin Sepatu Kulit" },
    { name: "Jl. Singkur Pameungpeuk", deltaLat: -0.0016, deltaLng: -0.0015, landmark: "Akses Pemukiman Warga" },
  ],
  kebonlega: [
    { name: "Jl. Leuwi Panjang", deltaLat: 0.0019, deltaLng: 0.0014, landmark: "Terminal Bus Leuwi Panjang" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Simpang Leuwi Panjang" },
    { name: "Jl. Kebon Lega Raya", deltaLat: 0.0014, deltaLng: 0.0017, landmark: "Sentra Pemukiman Kebon Lega" },
  ],
  mekarwangi: [
    { name: "Jl. Mekarwangi Raya", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Kompleks Perumahan Mekarwangi" },
    { name: "Jl. Singgasana Pradana", deltaLat: -0.0018, deltaLng: -0.0016, landmark: "Gerbang Kompleks Singgasana" },
    { name: "Jl. Cibaduyut Raya", deltaLat: 0.0015, deltaLng: 0.0018, landmark: "Perbatasan Mekarwangi Cibaduyut" },
  ],
  situsaeur: [
    { name: "Jl. K.H. Wahid Hasyim (Kopo)", deltaLat: 0.0018, deltaLng: 0.0013, landmark: "Rumah Sakit Immanuel" },
    { name: "Jl. Situsaeur", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Puskesmas Situsaeur" },
    { name: "Jl. Peta", deltaLat: 0.002, deltaLng: -0.0015, landmark: "Simpang Kopo Peta" },
  ],
  kopo: [
    { name: "Jl. Kopo (Jl. K.H. Wahid Hasyim)", deltaLat: 0.0017, deltaLng: 0.0012, landmark: "Sentra Niaga Kopo" },
    { name: "Jl. Pasirkoja", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Simpang Empat Pasirkoja" },
    { name: "Jl. Terusan Pasirkoja", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Akses Tol Pasirkoja" },
  ],
  babakanasih: [
    { name: "Jl. Babakan Asih", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Akses Pemukiman Warga" },
    { name: "Jl. Pagarsih", deltaLat: -0.0016, deltaLng: -0.0015, landmark: "Pusat Percetakan dan Sablon" },
    { name: "Jl. Jamika", deltaLat: 0.002, deltaLng: 0.0014, landmark: "Simpang Jamika Pagarsih" },
  ],
  babakantarogong: [
    { name: "Jl. Babakan Tarogong", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Kantor Kelurahan Babakan Tarogong" },
    { name: "Jl. Terusan Pasirkoja", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Koridor Niaga Pasirkoja" },
  ],
  jamika: [
    { name: "Jl. Jamika", deltaLat: 0.0018, deltaLng: 0.0013, landmark: "Sentra Grosir Jamika" },
    { name: "Jl. Pagarsih Barat", deltaLat: -0.0014, deltaLng: -0.0015, landmark: "Dekat Jembatan Pagarsih" },
    { name: "Jl. Jenderal Sudirman", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Simpang Tiga Sudirman Jamika" },
  ],
  sukaasih: [
    { name: "Jl. Suka Asih", deltaLat: 0.0014, deltaLng: 0.0015, landmark: "Pusat Pemukiman Suka Asih" },
    { name: "Jl. Terusan Pasirkoja", deltaLat: -0.0016, deltaLng: -0.0014, landmark: "Akses Gerbang Tol" },
    { name: "Jl. K.H. Wahid Hasyim", deltaLat: 0.002, deltaLng: 0.0012, landmark: "Batas Kopo Suka Asih" },
  ],
  balonggede: [
    { name: "Jl. Dalem Kaum", deltaLat: 0.0015, deltaLng: 0.0012, landmark: "Alun-Alun Kota Bandung / Pendopo" },
    { name: "Jl. Kepatihan", deltaLat: -0.0013, deltaLng: -0.0016, landmark: "Sentra Belanja Kings Plaza" },
    { name: "Jl. Dewi Sartika", deltaLat: 0.0019, deltaLng: -0.0014, landmark: "Pusat Busana Dewi Sartika" },
    { name: "Jl. Balong Gede", deltaLat: -0.0017, deltaLng: 0.0015, landmark: "Sentra Kuliner Warung Nasi Ibu Imas" },
  ],
  ciateul: [
    { name: "Jl. Ibu Inggit Garnasih (Ciateul)", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Rumah Bersejarah Ibu Inggit" },
    { name: "Jl. Pungkur", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Sentra Onderdil Motor Pungkur" },
    { name: "Jl. Otto Iskandardinata", deltaLat: 0.0021, deltaLng: 0.0016, landmark: "Dekat Taman Tegallega" },
  ],
  pungkur: [
    { name: "Jl. Pungkur", deltaLat: 0.0016, deltaLng: 0.0013, landmark: "Pasar Sparepart Pungkur" },
    { name: "Jl. Moch. Toha", deltaLat: -0.0014, deltaLng: -0.0015, landmark: "Pintu Masuk Tegallega" },
    { name: "Jl. Balong Gede", deltaLat: 0.002, deltaLng: 0.0017, landmark: "Akses Menuju Alun-Alun" },
  ],
  ancol: [
    { name: "Jl. BKR", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Koridor Kuliner BKR" },
    { name: "Jl. Kembar Mas", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Kompleks Perumahan Kembar" },
    { name: "Jl. Moch. Ramdan", deltaLat: 0.0023, deltaLng: -0.0012, landmark: "Sentra Niaga Moh. Ramdan" },
  ],
  ciseureuh: [
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Akses Depan Kampus LPKIA" },
    { name: "Jl. Moh. Toha", deltaLat: -0.0017, deltaLng: -0.0015, landmark: "Dekat Pintu Tol Moch. Toha" },
    { name: "Jl. Mengger Tengah", deltaLat: 0.0014, deltaLng: 0.0018, landmark: "Kawasan Pemukiman Warga" },
  ],
  pasirluyu: [
    { name: "Jl. Pasir Luyu Raya", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Pusat Pemukiman Pasirluyu" },
    { name: "Jl. BKR", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Simpang Pasirluyu BKR" },
    { name: "Jl. Sriwijaya", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Akses Menuju Lapangan Tegallega" },
  ],
  burangrang: [
    { name: "Jl. Burangrang", deltaLat: 0.0017, deltaLng: 0.0013, landmark: "Sentra Kuliner Bakso Enggal / Batagor" },
    { name: "Jl. Lodaya", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Lapangan Softball Lodaya" },
    { name: "Jl. Sadakeling", deltaLat: 0.002, deltaLng: -0.0014, landmark: "Sentra Percetakan Sadakeling" },
    { name: "Jl. Emong", deltaLat: -0.0012, deltaLng: 0.0018, landmark: "Kawasan Pemukiman dan Kafe" },
  ],
  cijagra: [
    { name: "Jl. Buahbatu", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Pusat Kuliner dan Pertokoan Buahbatu" },
    { name: "Jl. Cijagra Raya", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Perumahan Cijagra" },
    { name: "Jl. Suryalaya", deltaLat: 0.0018, deltaLng: 0.0017, landmark: "Kompleks Suryalaya" },
    { name: "Jl. BKR", deltaLat: -0.0019, deltaLng: 0.0014, landmark: "Simpang Empat BKR Buahbatu" },
  ],
  cikawao: [
    { name: "Jl. Lengkong Besar", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Kampus Unpas Lengkong" },
    { name: "Jl. Lengkong Kecil", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Sentra Kuliner Malam Lengkong Night Street Food" },
    { name: "Jl. Cikawao", deltaLat: 0.002, deltaLng: -0.0012, landmark: "Kawasan Percetakan Cikawao" },
    { name: "Jl. Pangarang", deltaLat: -0.0013, deltaLng: 0.0018, landmark: "Dekat Gereja Katedral Bandung" },
  ],
  malabar: [
    { name: "Jl. Malabar", deltaLat: 0.0016, deltaLng: 0.0013, landmark: "Kawasan Hunian dan Kuliner Malabar" },
    { name: "Jl. Palasari", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Sentra Buku Palasari" },
    { name: "Jl. Gatot Subroto", deltaLat: 0.0022, deltaLng: 0.0017, landmark: "Koridor Niaga Gatsu" },
    { name: "Jl. Talaga Bodas", deltaLat: -0.0018, deltaLng: 0.0015, landmark: "Kafe dan Kuliner Talaga Bodas" },
  ],
  paledang: [
    { name: "Jl. Veteran", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Akses Simpang Lima Bandung" },
    { name: "Jl. Tamblong", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Gedung Pensil Heritage" },
    { name: "Jl. Lengkong Besar", deltaLat: 0.0021, deltaLng: 0.0012, landmark: "Simpang Dalem Kaum Lengkong" },
    { name: "Jl. Sunda", deltaLat: -0.0017, deltaLng: 0.0019, landmark: "Dekat Rel Kereta Sunda" },
  ],
  turangga: [
    { name: "Jl. Turangga", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Kompleks TNI Kodam III / Siliwangi" },
    { name: "Jl. Martanegara", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Koridor Martanegara" },
    { name: "Jl. Karawitan", deltaLat: 0.0023, deltaLng: -0.0013, landmark: "Sentra Kuliner Karawitan" },
    { name: "Jl. Reog", deltaLat: -0.0013, deltaLng: 0.0019, landmark: "Perumahan Turangga" },
  ],
  lingkarselatan: [
    { name: "Jl. Peta", deltaLat: 0.0019, deltaLng: 0.0014, landmark: "Festival Citylink Mall" },
    { name: "Jl. BKR", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Jalur Cepat BKR" },
    { name: "Jl. Moch. Ramdan", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Simpang Empat BKR Ramdan" },
  ],
  binong: [
    { name: "Jl. Binong Jati", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Sentra Industri Rajut Binong" },
    { name: "Jl. Gatot Subroto", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Pusat Belanja Trans Studio Mall (TSM)" },
    { name: "Jl. Ibrahim Adjie", deltaLat: 0.0024, deltaLng: 0.0016, landmark: "Flyover Kiaracondong" },
  ],
  cibangkong: [
    { name: "Jl. Gatot Subroto", deltaLat: 0.0017, deltaLng: 0.0013, landmark: "Kawasan Trans Luxury Hotel / TSM" },
    { name: "Jl. Cibangkong Raya", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Akses Pemukiman Warga" },
    { name: "Jl. Maleer Indah", deltaLat: 0.002, deltaLng: -0.0014, landmark: "Batas Maleer Cibangkong" },
  ],
  gumuruh: [
    { name: "Jl. Gumuruh", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Pusat Pemukiman Gumuruh" },
    { name: "Jl. Gatot Subroto", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Koridor Niaga Gatsu Gumuruh" },
    { name: "Jl. Maleer", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Akses Menuju Laswi" },
  ],
  kacapiring: [
    { name: "Jl. Ahmad Yani", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Sentra Niaga Ahmad Yani Laswi" },
    { name: "Jl. Sukabumi", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Gedung DPRD Kota Bandung" },
    { name: "Jl. Laswi", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Perlintasan Rel Laswi" },
  ],
  kebongedang: [
    { name: "Jl. Kebon Gedang", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Akses Pemukiman Warga" },
    { name: "Jl. Maleer", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Dekat Puskesmas Kebon Gedang" },
    { name: "Jl. Ibrahim Adjie", deltaLat: 0.002, deltaLng: 0.0017, landmark: "Simpang Kiaracondong" },
  ],
  kebonwaru: [
    { name: "Jl. Jakarta", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Kawasan Flyover Pelangi Antapani" },
    { name: "Jl. Sukabumi", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Dinas Pendidikan Kota Bandung" },
    { name: "Jl. Bogor", deltaLat: 0.0017, deltaLng: -0.0018, landmark: "Sentra Pemukiman Bogor Waru" },
    { name: "Jl. Cianjur", deltaLat: -0.0018, deltaLng: 0.0014, landmark: "Dekat Lapas Sukamiskin Lama" },
  ],
  maleer: [
    { name: "Jl. Maleer Indah", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Sentra Pemukiman Maleer" },
    { name: "Jl. Gatot Subroto", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Dekat Pindad Gatot Subroto" },
  ],
  samoja: [
    { name: "Jl. Samoja", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Akses Pemukiman Samoja" },
    { name: "Jl. Gatot Subroto", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Simpang Palasari Gatsu" },
    { name: "Jl. Malabar", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Akses Menuju Lapangan Lodaya" },
  ],
  babakansari: [
    { name: "Jl. Babakan Sari", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Pasar Kiaracondong" },
    { name: "Jl. Ibrahim Adjie", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Stasiun Kereta Api Kiaracondong" },
    { name: "Jl. Terusan Jakarta", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Simpang Tiga Flyover Jakarta" },
  ],
  babakansurabaya: [
    { name: "Jl. Babakan Surabaya", deltaLat: 0.0016, deltaLng: 0.0013, landmark: "Kawasan Pemukiman Padat Warga" },
    { name: "Jl. Kiaracondong", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Depan Pintu Stasiun Timur Kiaracondong" },
    { name: "Jl. Stasiun Lama", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Sentra Bengkel Kiaracondong" },
  ],
  cicaheum: [
    { name: "Jl. Jenderal Ahmad Yani", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Terminal Bus Cicaheum" },
    { name: "Jl. Cicaheum Atas", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Akses Menuju Jatihandap" },
    { name: "Jl. Antapani Lama", deltaLat: 0.0018, deltaLng: 0.0016, landmark: "Simpang Terminal Cicaheum" },
  ],
  kebonjayanti: [
    { name: "Jl. Kebon Jayanti", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Pusat Pemukiman Kebon Jayanti" },
    { name: "Jl. Ibrahim Adjie", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Koridor Niaga Kiaracondong" },
  ],
  kebonkangkung: [
    { name: "Jl. Kebon Kangkung", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Pemukiman Kebon Kangkung" },
    { name: "Jl. Kiaracondong", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Dekat Kompleks Militer Pindad" },
    { name: "Jl. Pindad", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Gerbang Utama PT Pindad" },
  ],
  sukapura: [
    { name: "Jl. Sukapura Raya", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Kawasan Mahasiswa Telkom University" },
    { name: "Jl. Terusan Buah Batu", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Pintu Tol Buahbatu" },
    { name: "Jl. Mengger Girang", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Akses Menuju Bandung Kidul" },
  ],
  batununggal: [
    { name: "Jl. Batununggal Indah Raya", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Kompleks Perumahan Batununggal" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0017, deltaLng: -0.0018, landmark: "Simpang Batununggal By Pass" },
    { name: "Jl. Waas", deltaLat: 0.0015, deltaLng: 0.0019, landmark: "Kawasan Pemukiman Waas" },
  ],
  kujangsari: [
    { name: "Jl. Terusan Buahbatu", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Sentra Ruko Buahbatu" },
    { name: "Jl. Kujangsari Raya", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Pusat Pemukiman Kujangsari" },
    { name: "Jl. Baturaden", deltaLat: 0.0018, deltaLng: 0.0016, landmark: "Kompleks Baturaden" },
  ],
  mengger: [
    { name: "Jl. Mengger Girang", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Akses Pemukiman Warga Mengger" },
    { name: "Jl. Mengger Hilir", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Kawasan Perbatasan Dayeuhkolot" },
    { name: "Jl. Moh. Toha Selatan", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Dekat Exit Tol Moh. Toha" },
  ],
  wates: [
    { name: "Jl. Wates Raya", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Kantor Kelurahan Wates" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Koridor Niaga Soekarno Hatta" },
    { name: "Jl. Suryalaya Baru", deltaLat: 0.002, deltaLng: 0.0016, landmark: "Akses Menuju Buahbatu" },
  ],
  margacinta: [
    { name: "Jl. Margacinta", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Pasar Kordon Margacinta" },
    { name: "Jl. Ciwastra", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Sentra Niaga Ciwastra" },
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Dekat Carrefour Soekarno Hatta" },
  ],
  margasari: [
    { name: "Jl. Margacinta", deltaLat: 0.0017, deltaLng: 0.0013, landmark: "Simpang Kordon Margasari" },
    { name: "Jl. Ciwastra", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Koridor Ciwastra Buahbatu" },
    { name: "Jl. Logam", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Sentra Perumahan Logam" },
  ],
    cijawura: [
    { name: "Jl. Ciganitri", deltaLat: -0.0025, deltaLng: 0.002, landmark: "Kawasan Ciganitri / Terusan Buahbatu" },
    { name: "Jl. Cijawura Hilir", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Pusat Pemukiman Cijawura" },
    { name: "Jl. Cijawura Girang", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Akses Menuju Ciwastra" },
    { name: "Jl. Cijawura Indah", deltaLat: 0.0011, deltaLng: -0.0012, landmark: "Perumahan Cijawura Indah" },
    { name: "Jl. Terusan Buahbatu", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Dekat Flyover Buahbatu" },
    { name: "Jl. Ciwastra", deltaLat: -0.0018, deltaLng: 0.0015, landmark: "Jalur Menuju Ciwastra" },
    { name: "Jl. Logam", deltaLat: 0.0019, deltaLng: 0.0018, landmark: "Akses Logam Buahbatu" },
  ],
  jatisari: [
    { name: "Jl. Jatisari", deltaLat: 0.0015, deltaLng: 0.0013, landmark: "Perumahan Jatisari Indah" },
    { name: "Jl. Buahbatu Regency", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Kompleks Buahbatu Regency" },
    { name: "Jl. Terusan Logam", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Akses Logam Buahbatu" },
  ],
  sekejati: [
    { name: "Jl. Soekarno-Hatta (Metro Indah Mall)", deltaLat: 0.0021, deltaLng: 0.0016, landmark: "Metro Indah Mall (MIM)" },
    { name: "Jl. Sekejati Raya", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Kantor Kelurahan Sekejati" },
    { name: "Jl. Kawaluyaan", deltaLat: 0.0024, deltaLng: -0.0014, landmark: "Kawasan Perkantoran Samsat Kawaluyaan" },
  ],
  cigadung: [
    { name: "Jl. Cigadung Raya Timur", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Kawasan Kafe dan Galeri Seni Cigadung" },
    { name: "Jl. Cigadung Raya Barat", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Sentra Pemukiman Cigadung" },
    { name: "Jl. Tubagus Ismail Raya", deltaLat: 0.0018, deltaLng: 0.0016, landmark: "Akses Simpang Tubagus Ismail" },
    { name: "Jl. Dago Resort", deltaLat: 0.003, deltaLng: -0.0012, landmark: "Perumahan Dago Resort Pakar" },
  ],
  cihaurgeulis: [
    { name: "Jl. Surapati (Suci)", deltaLat: 0.0019, deltaLng: 0.0014, landmark: "Sentra Kaos dan Sablon Suci" },
    { name: "Jl. Supratman", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Dekat Taman Pramuka" },
    { name: "Jl. Pahlawan", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Taman Makam Pahlawan Cikutra" },
    { name: "Jl. Cibeunying Selatan", deltaLat: -0.0013, deltaLng: 0.0018, landmark: "Akses Menuju Pusdai" },
  ],
  neglasari: [
    { name: "Jl. Neglasari", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Kawasan Hunian Neglasari" },
    { name: "Jl. Katamso", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Koridor Niaga Katamso" },
    { name: "Jl. PHH Mustofa", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Kampus Itenas / USB YPKP" },
  ],
  sukaluyu: [
    { name: "Jl. Sukaluyu Raya", deltaLat: 0.0017, deltaLng: 0.0013, landmark: "Sentra Pemukiman Sukaluyu" },
    { name: "Jl. Gagak", deltaLat: -0.0014, deltaLng: -0.0016, landmark: "Kompleks Burung Gagak" },
    { name: "Jl. Belibis", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Akses Menuju Surapati" },
    { name: "Jl. Surapati", deltaLat: -0.0016, deltaLng: 0.0018, landmark: "Depan Gedung Pusdai" },
  ],
  cicadas: [
    { name: "Jl. Jenderal Ahmad Yani", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Pasar Cicadas / RS Santo Yusup" },
    { name: "Jl. Cicadas Pasar", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Sentra Pertokoan Cicadas" },
    { name: "Jl. Cikutra", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Simpang Cicadas Cikutra" },
    { name: "Jl. Asep Berlian", deltaLat: -0.0014, deltaLng: 0.0018, landmark: "Akses Pemukiman Warga" },
  ],
  cikutra: [
    { name: "Jl. Cikutra Raya", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Kampus Universitas Widyatama" },
    { name: "Jl. Pahlawan", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Sentra Sablon dan Kaos Pahlawan" },
    { name: "Jl. Bojongkoneng", deltaLat: 0.0028, deltaLng: -0.0013, landmark: "Akses Wisata Bukit Cikutra" },
    { name: "Jl. Katamso", deltaLat: -0.0013, deltaLng: 0.0019, landmark: "Simpang Tiga Katamso Cikutra" },
  ],
  padasuka: [
    { name: "Jl. Padasuka", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Wisata Budaya Saung Angklung Udjo" },
    { name: "Jl. Surapati Core", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Kompleks Ruko Surapati Core" },
    { name: "Jl. Pasirlayung Atas", deltaLat: 0.0026, deltaLng: -0.0014, landmark: "Akses Menuju Caringin Tilu" },
  ],
  pasirlayung: [
    { name: "Jl. Pasirlayung Raya", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Pusat Pemukiman Pasirlayung" },
    { name: "Jl. Padasuka Atas", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Jalur Wisata Perbukitan" },
    { name: "Jl. Cikutra Timur", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Batas Pasirlayung Cikutra" },
  ],
  sukamaju: [
    { name: "Jl. Sukamaju", deltaLat: 0.0016, deltaLng: 0.0013, landmark: "Akses Pemukiman Warga Sukamaju" },
    { name: "Jl. Brigjen Katamso", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Sentra Ruko Katamso" },
    { name: "Jl. Cikutra Baru", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Perumahan Cikutra Baru" },
  ],
  sukapada: [
    { name: "Jl. Sukapada", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Akses Kampus Widyatama Barat" },
    { name: "Jl. PHH Mustofa (Suci)", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Koridor Utama Suci" },
    { name: "Jl. Cikutra", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Simpang Suci Cikutra" },
  ],
  cipadung: [
    { name: "Jl. A.H. Nasution", deltaLat: 0.0021, deltaLng: 0.0016, landmark: "UIN Sunan Gunung Djati Bandung" },
    { name: "Jl. Cipadung Raya", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Sentra Niaga dan Kos Mahasiswa" },
    { name: "Jl. Manisi", deltaLat: 0.0024, deltaLng: -0.0014, landmark: "Akses Kampus II UIN" },
  ],
  cisurupan: [
    { name: "Jl. Cisurupan", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Pusat Pemukiman Cisurupan" },
    { name: "Jl. Cilengkrang 1", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Akses Wisata Gunung Manglayang" },
    { name: "Jl. Sindangreret", deltaLat: 0.0022, deltaLng: 0.0015, landmark: "Kompleks Sindangreret" },
  ],
  palasari: [
    { name: "Jl. Palasari Cibiru", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Kawasan Pemukiman Palasari" },
    { name: "Jl. Giri Mekar", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Kompleks Giri Mekar Permai" },
    { name: "Jl. Manisi Indah", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Akses Menuju Pasirbiru" },
  ],
  pasirbiru: [
    { name: "Jl. Pasir Biru", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Kampus UPI Cibiru" },
    { name: "Jl. Sukup Baru", deltaLat: -0.0014, deltaLng: -0.0017, landmark: "Pemukiman Sukup" },
    { name: "Jl. Cipadung Wetan", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Batas Wilayah Cibiru" },
  ],
  cipamokolan: [
    { name: "Jl. Cipamokolan", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Jalan Penghubung Derwati By Pass" },
    { name: "Jl. Riung Bandung Raya", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Kompleks Perumahan Riung Bandung" },
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0023, deltaLng: 0.0016, landmark: "Dekat Rumah Sakit Al-Islam" },
  ],
  darwati: [
    { name: "Jl. Darwati Raya", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Sentra Pemukiman Darwati" },
    { name: "Jl. Ciwastra", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Simpang Tiga Pasar Ciwastra" },
    { name: "Jl. Rancacili", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Akses Rusunawa Rancacili" },
  ],
  manjahlega: [
    { name: "Jl. Manjahlega", deltaLat: 0.0017, deltaLng: 0.0013, landmark: "Pusat Pemukiman Manjahlega" },
    { name: "Jl. Margacinta", deltaLat: -0.0015, deltaLng: -0.0016, landmark: "Koridor Niaga Margacinta" },
    { name: "Jl. Ciwastra", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Dekat Puskesmas Manjahlega" },
  ],
  mekarjaya: [
    { name: "Jl. Mekar Jaya", deltaLat: 0.0016, deltaLng: 0.0014, landmark: "Perumahan Mekar Jaya" },
    { name: "Jl. Ciwastra Raya", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Akses Ciwastra Rancasari" },
    { name: "Jl. Rancasari", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Kantor Kecamatan Rancasari" },
  ],
  cimincrang: [
    { name: "Jl. Cimincrang", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Masjid Raya Al-Jabbar" },
    { name: "Jl. Soekarno-Hatta Timur", deltaLat: -0.0017, deltaLng: -0.0018, landmark: "Akses By Pass Cimincrang" },
    { name: "Jl. Tol Padaleunyi KM 149", deltaLat: 0.0025, deltaLng: 0.0014, landmark: "Gerbang Tol KM 149 Gedebage" },
  ],
  cisarantenrancabungur: [
    { name: "Jl. Rancabungur", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Pemukiman Rancabungur" },
    { name: "Jl. Soekarno-Hatta", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Pusat Pergudangan By Pass" },
  ],
  rancabolang: [
    { name: "Jl. Rancabolang", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Kantor Kelurahan Rancabolang" },
    { name: "Jl. Gedebage Raya", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Pasar Induk Gedebage" },
    { name: "Jl. Derwati", deltaLat: 0.0023, deltaLng: 0.0016, landmark: "Akses Menuju Ciwastra" },
  ],
  rancanumpang: [
    { name: "Jl. Rancanumpang", deltaLat: 0.0025, deltaLng: 0.0017, landmark: "Stadion Gelora Bandung Lautan Api (GBLA)" },
    { name: "Jl. Cimencrang Selatan", deltaLat: -0.0018, deltaLng: -0.0016, landmark: "Kawasan Danau Masjid Al-Jabbar" },
    { name: "Jl. Stasiun KCIC Tegalluar", deltaLat: 0.0032, deltaLng: 0.002, landmark: "Stasiun Kereta Cepat Whoosh" },
  ],
  jatihandap: [
    { name: "Jl. Jatihandap Raya", deltaLat: 0.0021, deltaLng: 0.0015, landmark: "Pusat Pemukiman Jatihandap" },
    { name: "Jl. Cicaheum Atas", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Akses Naik dari Terminal Cicaheum" },
    { name: "Jl. Padasuka Timur", deltaLat: 0.0024, deltaLng: -0.0014, landmark: "Perbatasan Mandalajati Cibeunying" },
  ],
  karangpamulang: [
    { name: "Jl. Karang Pamulang", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Kompleks Karang Pamulang" },
    { name: "Jl. A.H. Nasution", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Sentra Niaga A.H. Nasution" },
  ],
  pasirimpun: [
    { name: "Jl. Pasir Impun", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Jalur Wisata Perbukitan Pasir Impun" },
    { name: "Jl. Sukamiskin Timur", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Akses Kompleks Sukamiskin" },
  ],
  sindangjaya: [
    { name: "Jl. Sindangjaya", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Kompleks Perumahan Sindangjaya" },
    { name: "Jl. Arcamanik Sindangjaya", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Batas Arcamanik Mandalajati" },
  ],
  babakanpenghulu: [
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Dekat RSUD Ujungberung" },
    { name: "Jl. Rumah Sakit", deltaLat: -0.0017, deltaLng: -0.0018, landmark: "Akses Rumah Sakit Al-Islam Timur" },
    { name: "Jl. Cinambo Raya", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Kantor Kelurahan Babakan Penghulu" },
  ],
  cisarantenwetan: [
    { name: "Jl. Cisaranten Wetan", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Sentra Pemukiman Cisaranten Wetan" },
    { name: "Jl. Cinambo", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Koridor Niaga Cinambo" },
  ],
  pakemitan: [
    { name: "Jl. Pakemitan", deltaLat: 0.0017, deltaLng: 0.0014, landmark: "Pusat Pemukiman Pakemitan" },
    { name: "Jl. A.H. Nasution", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Pasar Ujungberung Sebelah Barat" },
  ],
  sukamulya: [
    { name: "Jl. Sukamulya", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Sentra Pemukiman Warga" },
    { name: "Jl. Soekarno-Hatta Timur", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Akses Jalur Cepat Soekarno Hatta" },
  ],
  cipadungkidul: [
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0021, deltaLng: 0.0016, landmark: "Polda Jawa Barat" },
    { name: "Jl. Panyileukan Raya", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Kompleks Bumi Panyileukan" },
    { name: "Jl. Cipadung", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Akses Menuju Cibiru" },
  ],
  cipadungkulon: [
    { name: "Jl. Cipadung Kulon", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Kantor Kelurahan Cipadung Kulon" },
    { name: "Jl. Soekarno-Hatta Bypass", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Koridor Niaga Panyileukan" },
  ],
  cipadungwetan: [
    { name: "Jl. Cipadung Wetan", deltaLat: 0.0017, deltaLng: 0.0015, landmark: "Sentra Pemukiman Cipadung Wetan" },
    { name: "Jl. Bumi Panyileukan", deltaLat: -0.0015, deltaLng: -0.0018, landmark: "Gerbang Utama Perumahan" },
  ],
  mekarmulya: [
    { name: "Jl. Mekarmulya", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Pergudangan Mekarmulya" },
    { name: "Jl. Gedebage Selatan", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Simpang Gedebage Panyileukan" },
    { name: "Jl. Soekarno-Hatta", deltaLat: 0.0023, deltaLng: 0.0016, landmark: "Akses Arteri Soekarno Hatta" },
  ],
  cigending: [
    { name: "Jl. Cigending", deltaLat: 0.0018, deltaLng: 0.0015, landmark: "Alun-Alun Ujungberung" },
    { name: "Jl. Kaum Kulon", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Masjid Agung Ujungberung" },
    { name: "Jl. A.H. Nasution", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Pasar Ujungberung" },
  ],
  pasanggrahan: [
    { name: "Jl. A.H. Nasution", deltaLat: 0.002, deltaLng: 0.0015, landmark: "Koridor Utama A.H. Nasution" },
    { name: "Jl. Pasanggrahan", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Kantor Kelurahan Pasanggrahan" },
    { name: "Jl. Cigending Atas", deltaLat: 0.0024, deltaLng: 0.0014, landmark: "Akses Perbukitan Ujungberung" },
  ],
  pasirendah: [
    { name: "Jl. Pasir Endah", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Kompleks Perumahan Pasir Endah" },
    { name: "Jl. Vijaya Kusuma", deltaLat: -0.0015, deltaLng: -0.0017, landmark: "Sentra Pemukiman Vijaya Kusuma" },
    { name: "Jl. Nagrog", deltaLat: 0.0023, deltaLng: -0.0014, landmark: "Akses Menuju Palintang" },
  ],
  pasirjati: [
    { name: "Jl. Pasir Jati", deltaLat: 0.0018, deltaLng: 0.0014, landmark: "Perumahan Pasir Jati" },
    { name: "Jl. Manisi", deltaLat: -0.0016, deltaLng: -0.0018, landmark: "Akses Kampus UIN" },
    { name: "Jl. Cikuda", deltaLat: 0.0021, deltaLng: 0.0016, landmark: "Kawasan Pemukiman Warga" },
  ],
  pasirwangi: [
    { name: "Jl. Pasir Wangi", deltaLat: 0.0019, deltaLng: 0.0015, landmark: "Sentra Pemukiman Pasirwangi" },
    { name: "Jl. Cijambe", deltaLat: -0.0016, deltaLng: -0.0017, landmark: "Simpang Cijambe A.H. Nasution" },
    { name: "Jl. Cilengkrang", deltaLat: 0.0022, deltaLng: 0.0016, landmark: "Akses Wisata Kaki Manglayang" },
  ],
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/^kelurahan\s+/i, "")
    .replace(/^desa\s+/i, "")
    .replace(/^kecamatan\s+/i, "")
    .replace(/[^a-z0-9]/g, "");
}

export function getStreetsForVillage(villageName: string, districtName?: string): readonly BandungStreet[] {
  const vKey = normalizeKey(villageName);
  if (vKey && STREET_DATA[vKey]) {
    return STREET_DATA[vKey]!;
  }
  const matchEntry = Object.entries(STREET_DATA).find(([key]) => key === vKey || vKey.includes(key) || key.includes(vKey));
  if (matchEntry) {
    return matchEntry[1];
  }
  const dKey = districtName ? normalizeKey(districtName) : "";
  const fallbackList: BandungStreet[] = [
    { name: `Jl. Utama ${villageName.replace(/^(kelurahan|desa)\s+/i, "")}`, deltaLat: 0.001, deltaLng: 0.001, landmark: "Jalur Utama Wilayah" },
    { name: `Jl. Raya ${dKey || "Bandung"}`, deltaLat: -0.0012, deltaLng: -0.001, landmark: "Koridor Penghubung Wilayah" },
    { name: `Jl. Kantor Kelurahan`, deltaLat: 0.0008, deltaLng: -0.0015, landmark: "Dekat Kantor Kelurahan Setempat" },
    { name: `Jl. Pemukiman Warga`, deltaLat: -0.0015, deltaLng: 0.0012, landmark: "Kawasan Pemukiman Warga" },
  ];
  return fallbackList;
}
