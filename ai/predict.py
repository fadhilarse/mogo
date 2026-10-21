import sys
import json
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, 'tanaman_dataset.csv')

def main():
    try:
        # 1. Pastikan argumen input tersedia
        if len(sys.argv) < 2:
            raise ValueError("Argument input JSON tidak ditemukan.")

        input_data = json.loads(sys.argv[1])
        nama_tanaman = str(input_data.get('tanaman', '')).strip().lower()

        if not nama_tanaman:
            raise ValueError("Nama tanaman tidak boleh kosong.")

        # 2. Cek keberadaan dataset CSV
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(f"File dataset tidak ditemukan di: {DATASET_PATH}")

        # 3. Read dataset
        df = pd.read_csv(DATASET_PATH)

        # 4. Normalisasi nama kolom (lowercase, trim, spasi ke underscore)
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

        # 5. Handle NaN / Nilai kosong agar JSON safe
        df = df.fillna("-")

        if 'tanaman' not in df.columns:
            raise KeyError("Kolom 'tanaman' tidak ditemukan di dalam CSV!")

        # 6. Pencarian tanaman (Pencarian persis dulu, kalau gagal coba partial match)
        df_tanaman_lower = df['tanaman'].astype(str).str.strip().str.lower()
        row = df[df_tanaman_lower == nama_tanaman]

        if row.empty:
            # Fallback: cari yang mengandung kata kunci (misal input 'Cabai' cocok dengan 'Cabai Merah')
            row = df[df_tanaman_lower.str.contains(nama_tanaman, regex=False)]

        if not row.empty:
            data_dict = row.iloc[0].to_dict()

            # 7. Convert jadwal_panen jika menggunakan pemisah '|'
            if 'jadwal_panen' in data_dict and isinstance(data_dict['jadwal_panen'], str) and data_dict['jadwal_panen'] != "-":
                data_dict['jadwal_panen'] = [
                    step.strip() for step in data_dict['jadwal_panen'].split('|')
                ]

            response = {
                "status": "success",
                "tanaman": str(data_dict['tanaman']).title(),
                "parameter_ideal": data_dict
            }
        else:
            response = {
                "status": "error",
                "message": f"Data untuk tanaman '{input_data.get('tanaman')}' belum ada di dataset."
            }

        # 8. Output HANYA JSON string ke stdout
        print(json.dumps(response, ensure_ascii=False))

    except Exception as e:
        error_response = {
            "status": "error",
            "message": str(e)
        }
        print(json.dumps(error_response, ensure_ascii=False))

if __name__ == '__main__':
    main()