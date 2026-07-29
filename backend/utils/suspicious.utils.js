/**
 * suspicious.utils.js
 * Detect suspicious login activity by comparing current request
 * to the user's login history.
 */

const { UAParser } = require('ua-parser-js');

/**
 * Extract device and browser info from user-agent string
 * @param {string} userAgent
 * @returns {{ device: string, browser: string }}
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { device: 'Unknown', browser: 'Unknown' };

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const device =
    result.device.type
      ? `${result.device.vendor || ''} ${result.device.model || ''} (${result.device.type})`.trim()
      : result.os.name
      ? `${result.os.name} ${result.os.version || ''}`.trim()
      : 'Desktop/Unknown';

  const browser = result.browser.name
    ? `${result.browser.name} ${result.browser.major || ''}`.trim()
    : 'Unknown';

  return { device, browser };
};

/**
 * Determine if a login attempt is suspicious
 * Rules:
 *   1. New IP address not seen in last 30 days of successful logins
 *   2. New device type not seen before
 *   3. Login between 02:00–05:00 local UTC hour (unusual hours)
 *
 * @param {object} currentRequest - { ip, userAgent }
 * @param {Array}  recentAttempts - recent successful login_attempts rows
 * @returns {{ isSuspicious: boolean, reason: string|null }}
 */
const detectSuspiciousActivity = (currentRequest, recentAttempts = []) => {
  const reasons = [];

  const { ip, userAgent } = currentRequest;
  const { device: currentDevice } = parseUserAgent(userAgent);

  // Rule 1: New IP
  const knownIPs = recentAttempts.map((a) => a.ip_address).filter(Boolean);
  if (knownIPs.length > 0 && !knownIPs.includes(ip)) {
    reasons.push('new_ip');
  }

  // Rule 2: New device type
  const knownDevices = recentAttempts
    .map((a) => parseUserAgent(a.user_agent).device)
    .filter(Boolean);
  const deviceType = currentDevice.toLowerCase().includes('mobile')
    ? 'mobile'
    : currentDevice.toLowerCase().includes('tablet')
    ? 'tablet'
    : 'desktop';

  const knownDeviceTypes = knownDevices.map((d) =>
    d.toLowerCase().includes('mobile')
      ? 'mobile'
      : d.toLowerCase().includes('tablet')
      ? 'tablet'
      : 'desktop'
  );

  if (knownDeviceTypes.length > 0 && !knownDeviceTypes.includes(deviceType)) {
    reasons.push('new_device');
  }

  // Rule 3: Unusual hour (02:00 – 05:00 UTC)
  const hour = new Date().getUTCHours();
  if (hour >= 2 && hour < 5) {
    reasons.push('unusual_time');
  }

  return {
    isSuspicious: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join(',') : null,
  };
};

module.exports = {
  parseUserAgent,
  detectSuspiciousActivity,
};
