# Text Cleansing Web

เว็บภาษาไทยสำหรับส่งข้อความไปประมวลผลด้วยบริการ Text Cleansing ของ AI for Thai และแสดงผลในหน้าเดียว

## รันในเครื่อง

ต้องมี Node.js 18 ขึ้นไป ไม่ต้องติดตั้ง package เพิ่มเติม เพราะเซิร์ฟเวอร์ใช้ Node built-in APIs

1. คัดลอก `.env.example` เป็น `.env`
2. ใส่ API key ใหม่จาก AI for Thai ใน `AIFORTHAI_API_KEY` (อย่าใส่คีย์ที่เคยเปิดเผย)
3. รัน `npm start`
4. เปิด `http://localhost:3000`

## เว็บไซต์ออนไลน์

เว็บไซต์ออนไลน์รับค่า `AIFORTHAI_API_KEY` จาก environment secret ของ hosting เท่านั้น ไฟล์ `.env` ไม่อยู่ใน container และถูกละเว้นจาก Git

## Endpoint

- `GET /` หน้าเว็บ
- `GET /manus-routes.json` manifest ของหน้าเว็บ
- `GET /healthz` health check สำหรับ hosting
- `POST /api/cleanse` รับฟอร์ม `application/x-www-form-urlencoded` โดยใช้ฟิลด์ `text`

ข้อความว่างจะได้รับ HTTP 400 และ request body จำกัดไม่เกิน 1 MiB ข้อความที่ผู้ใช้ส่งถูกส่งต่อไปยัง AI for Thai เพื่อประมวลผล โดยแอปไม่บันทึกข้อความลงฐานข้อมูลหรือ log
