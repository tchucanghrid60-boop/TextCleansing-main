const form = document.querySelector('#cleanse-form');
const input = document.querySelector('#text-input');
const count = document.querySelector('#char-count');
const clearButton = document.querySelector('#clear-button');
const submitButton = document.querySelector('#submit-button');
const resultPanel = document.querySelector('#result-panel');
const resultOutput = document.querySelector('#result-output');
const errorMessage = document.querySelector('#error-message');
const copyButton = document.querySelector('#copy-button');
const serviceStatus = document.querySelector('#service-status');

function updateCount() {
  count.textContent = `${input.value.length.toLocaleString('th-TH')} ตัวอักษร`;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

// ดึงเฉพาะ cleansing_text จากผลลัพธ์ของ API
// รองรับทั้ง payload.data เป็น object, เป็น JSON string, หรือ cleansing_text อยู่ระดับบนสุด
function extractResult(payload) {
  let data = payload.data ?? payload;

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data; // เป็นข้อความธรรมดา แสดงตามเดิม
    }
  }

  if (data && typeof data.cleansing_text === 'string') {
    return data.cleansing_text;
  }
  return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

async function updateServiceStatus() {
  try {
    const response = await fetch('/healthz', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('health check failed');
    serviceStatus.classList.remove('offline');
    serviceStatus.classList.add('online');
    serviceStatus.lastChild.textContent = 'เซิร์ฟเวอร์ออนไลน์';
  } catch {
    serviceStatus.classList.remove('online');
    serviceStatus.classList.add('offline');
    serviceStatus.lastChild.textContent = 'ตรวจสอบเซิร์ฟเวอร์ไม่ได้';
  }
}

input.addEventListener('input', () => {
  updateCount();
  errorMessage.hidden = true;
});

clearButton.addEventListener('click', () => {
  input.value = '';
  resultPanel.hidden = true;
  errorMessage.hidden = true;
  updateCount();
  input.focus();
});

copyButton.addEventListener('click', async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(resultOutput.textContent);
    } else {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(resultOutput);
      selection.removeAllRanges();
      selection.addRange(range);
      const copied = document.execCommand('copy');
      selection.removeAllRanges();
      if (!copied) throw new Error('copy unavailable');
    }
    const original = copyButton.textContent;
    copyButton.textContent = 'คัดลอกแล้ว';
    window.setTimeout(() => { copyButton.textContent = original; }, 1200);
  } catch {
    showError('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความในกรอบผลลัพธ์แล้วคัดลอกด้วยตนเอง');
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return showError('กรุณากรอกข้อความที่ต้องการแก้ไข');

  errorMessage.hidden = true;
  resultPanel.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = 'กำลังประมวลผล…';

  try {
    const response = await fetch('/api/cleanse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
      body: new URLSearchParams({ text }),
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `บริการตอบกลับด้วยสถานะ ${response.status}`);
    }
    resultOutput.textContent = extractResult(payload);
    resultPanel.hidden = false;
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    showError(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = '<span aria-hidden="true">✦</span> แก้ไขข้อความ';
  }
});

updateCount();
updateServiceStatus();
