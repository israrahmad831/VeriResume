import dotenv from 'dotenv';
dotenv.config();

import { sendOTPEmail } from './utils/emailService.js';

console.log('Testing email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');

const testEmail = async () => {
  try {
    const result = await sendOTPEmail(
      process.env.EMAIL_USER, // send to yourself for testing
      '123456',
      'Test User'
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
    } else {
      console.error('❌ Email send failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  process.exit();
};

testEmail();
