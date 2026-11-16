/**
 * Input sanitization and validation utilities
 * Melindungi dari XSS, payload berbahaya, dan input tidak valid
 */

/**
 * Membersihkan string dari tag HTML, script injection, dan karakter kontrol berbahaya.
 */
export function sanitizeText(input: unknown, maxLength = 255): string {
  if (typeof input !== 'string') return '';

  return input
    // Hapus script tags dan isinya
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Hapus tag HTML apapun
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Ganti multiple whitespace menjadi satu spasi
    .replace(/\s+/g, ' ')
    // Trim
    .trim()
    // Potong sesuai batas panjang
    .slice(0, maxLength);
}

/**
 * Validasi dan normalisasi kuantitas stok.
 * Harus berupa integer positif dalam rentang [min, max].
 */
export function validateQuantity(
  val: unknown,
  min = 1,
  max = 100000
): { valid: boolean; value: number; error?: string } {
  const parsed = typeof val === 'number' ? val : parseInt(String(val), 10);

  if (isNaN(parsed) || !Number.isInteger(parsed)) {
    return { valid: false, value: min, error: 'Jumlah harus berupa angka bulat' };
  }

  if (parsed < min) {
    return { valid: false, value: min, error: `Jumlah minimal adalah ${min}` };
  }

  if (parsed > max) {
    return { valid: false, value: max, error: `Jumlah maksimal adalah ${max.toLocaleString('id-ID')}` };
  }

  return { valid: true, value: parsed };
}

/**
 * Validasi serial number (Plat Number).
 * Mengizinkan karakter alfanumerik, strip, underscore, titik, slash, dan spasi tunggal.
 */
export function validateSerialNumber(serial: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof serial !== 'string') {
    return { valid: false, value: '', error: 'Serial number / Plat Number wajib berupa teks' };
  }

  const clean = sanitizeText(serial, 50).toUpperCase();

  if (clean.length < 2) {
    return { valid: false, value: clean, error: 'Serial number minimal 2 karakter' };
  }

  // Cek karakter yang diizinkan: huruf, angka, -, _, ., /, dan spasi
  if (!/^[A-Z0-9_.\-/\s]+$/i.test(clean)) {
    return { valid: false, value: clean, error: 'Serial number hanya boleh berisi huruf, angka, dan tanda (- _ . /)' };
  }

  return { valid: true, value: clean };
}

/**
 * Validasi username akun.
 */
export function validateUsername(username: unknown): { valid: boolean; value: string; error?: string } {
  if (typeof username !== 'string') {
    return { valid: false, value: '', error: 'Username wajib berupa teks' };
  }

  const clean = username.trim().toLowerCase();

  if (clean.length < 3 || clean.length > 30) {
    return { valid: false, value: clean, error: 'Username harus antara 3 hingga 30 karakter' };
  }

  if (!/^[a-z0-9_.-]+$/.test(clean)) {
    return { valid: false, value: clean, error: 'Username hanya boleh berisi huruf kecil, angka, titik, minus, atau underscore' };
  }

  return { valid: true, value: clean };
}
