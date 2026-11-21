# TODO — Text Cleansing Web

## เว็บออนไลน์คงฟังก์ชันจากแอปเดิม
- [x] หน้าเว็บภาษาไทยเปิดจากหน้าแรกบนระบบออนไลน์ได้ โดยยึดหน้าตาและโครงสร้างหน้าเดิมจากภาพอ้างอิง
- [x] ผู้ใช้พิมพ์หรือวางข้อความและเห็นจำนวนตัวอักษร; ปุ่มล้างล้างช่องและซ่อนผลเดิม
- [x] ปุ่มส่งข้อความแสดงสถานะกำลังประมวลผล ป้องกันการส่งซ้ำระหว่างรอ แสดงผล API และแจ้งข้อผิดพลาดที่เหมาะสม
- [x] ผู้ใช้คัดลอกผลลัพธ์จากปุ่มคัดลอกได้

## การเรียก API และความปลอดภัย
- [x] Node.js server ฟังพอร์ตจาก `PORT` (ค่าเริ่มต้น 3000) และให้บริการหน้าเว็บกับ endpoint `POST /api/cleanse`
- [x] Server เรียก `https://api.aiforthai.in.th/textcleansing` โดยส่ง `AIFORTHAI_API_KEY` จาก environment secret เท่านั้น; ห้ามเปิดเผยคีย์ใน browser, repository, logs หรือ screenshots
- [x] ข้อความว่างได้รับ HTTP 400; ไม่มีคีย์ได้รับข้อผิดพลาดฝั่ง server; upstream error/network error ถูกส่งกลับใน JSON อย่างปลอดภัย
- [x] เพิ่ม endpoint สุขภาพ `/healthz` สำหรับ readiness โดยไม่ต้องยืนยันตัวตน

## เตรียมและเผยแพร่
- [x] มี manifest ที่ `/manus-routes.json` ประกาศ route ของหน้าเว็บโดยไม่รวม API, assets, health หรือ system endpoint
- [x] เพิ่ม container build/startup สำหรับ Node server และบันทึก deployment config ที่ตรงกับพอร์ตจริง
- [x] ตรวจหน้าเว็บและ endpoint ภายใต้ Preview และตรวจ response route manifest กับ health endpoint
- [ ] checkpoint โค้ดไปยัง `origin/main` และเผยแพร่เวอร์ชันที่มีคีย์ใหม่เป็น secret หลัง build/health checks ผ่าน

## ผลตรวจระหว่างพัฒนา
- Preview แสดงผลบน desktop (1280px) และ mobile (390px); `GET /`, `/healthz`, `/manus-routes.json`, `/favicon.svg` ตอบ 200 ตามคาด
- `POST /api/cleanse` เมื่อส่งข้อความว่างตอบ HTTP 400; `GET /api/cleanse` ตอบ 405
- ยังไม่ได้เรียก AI for Thai ด้วยข้อความทดสอบ เพื่อไม่ใช้ quota ของ API key โดยไม่จำเป็น
