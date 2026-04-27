const fs = require('fs');
const path = require('path');

async function testUpload() {
  const employeeId = 'TEST_EMP_001';
  const fileName = 'test_document.txt';
  const fileContent = 'This is a test document content.';
  
  // Create a multipart form data boundary
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  const body = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="employeeId"\r\n\r\n`,
    `${employeeId}\r\n`,
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`,
    `Content-Type: text/plain\r\n\r\n`,
    `${fileContent}\r\n`,
    `--${boundary}--\r\n`
  ].join('');

  console.log('Testing upload to http://localhost:3000/api/upload...');
  
  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Upload successful:', result);
      
      // Verify file exists on disk (assuming running on same machine)
      // Note: In a real scenario, we might just check the response.
      const uploadPath = result.path;
      if (fs.existsSync(uploadPath)) {
        console.log('SUCCESS: File exists on disk at:', uploadPath);
      } else {
        console.log('WARNING: File was not found on disk at:', uploadPath);
      }
    } else {
      const error = await response.json();
      console.error('Upload failed with status:', response.status, error);
    }
  } catch (err) {
    console.error('Error during fetch:', err.message);
    console.log('\nNOTE: Make sure the Next.js dev server is running at http://localhost:3000');
  }
}

testUpload();
