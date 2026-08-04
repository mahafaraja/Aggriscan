/**
 * YoolaSMS Service
 * Handles SMS operations including OTP sending and verification
 * API Documentation: https://yoolasms.com/
 */

// Get environment variables (Expo public variables are available at runtime)
const YOLLA_API_BASE = process.env.EXPO_PUBLIC_YOLLA_SMS_API_BASE || 'https://yoolasms.com/api/v1';
const YOLLA_API_KEY = process.env.EXPO_PUBLIC_YOLLA_SMS_API_KEY || '';

export interface YollaResponse {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

/**
 * Send OTP code to phone number
 * @param phone - Phone number in international format (e.g., 256762274788)
 * @param message - Custom message (optional, defaults to OTP message)
 * @returns Response from API
 */
export async function sendOTP(phone: string, message?: string): Promise<YollaResponse> {
  try {
    const otpMessage = message || `Your verification code is: ${generateOTP()}`;
    
    const response = await fetch(`${YOLLA_API_BASE}/send_sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: YOLLA_API_KEY,
        phone: phone,
        message: otpMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to send OTP',
    };
  }
}

/**
 * Send custom SMS message
 * @param phone - Phone number in international format
 * @param message - Message content
 * @returns Response from API
 */
export async function sendSMS(phone: string, message: string): Promise<YollaResponse> {
  try {
    const response = await fetch(`${YOLLA_API_BASE}/send_sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: YOLLA_API_KEY,
        phone: phone,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
      message: 'SMS sent successfully',
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to send SMS',
    };
  }
}

/**
 * Verify OTP code (if YoolaSMS provides verification endpoint)
 * Note: This may need to be adjusted based on actual API documentation
 * @param phone - Phone number
 * @param code - OTP code to verify
 * @returns Verification result
 */
export async function verifyOTP(phone: string, code: string): Promise<YollaResponse> {
  try {
    // This endpoint may vary based on YoolaSMS API documentation
    // Adjust according to actual API specs
    const response = await fetch(`${YOLLA_API_BASE}/verify_otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: YOLLA_API_KEY,
        phone: phone,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to verify OTP',
    };
  }
}

/**
 * Generate a random 6-digit OTP code
 * @returns 6-digit OTP code
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format phone number to international format
 * @param phone - Phone number in any format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('256')) {
    return digits;
  }
  
  if (digits.startsWith('0')) {
    return `256${digits.slice(1)}`;
  }
  
  if (digits.startsWith('7') || digits.startsWith('8')) {
    return `256${digits}`;
  }
  
  return digits;
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns True if valid
 */
export function validatePhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Ugandan phone numbers: 256 followed by 9 digits (total 12 digits)
  // Or local format: 0 followed by 9 digits (total 10 digits)
  return digits.length === 12 || digits.length === 10;
}