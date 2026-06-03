const axios = require('axios');

/* ════════════════════════════════════════════════
   Paystack Service
   Centralised wrapper for all Paystack API calls.
   ════════════════════════════════════════════════ */

const PAYSTACK_BASE = 'https://api.paystack.co';

/**
 * Returns the Authorization header for Paystack.
 * Reads from PAYSTACK_SECRET_KEY env var.
 */
function _headers() {
  return { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` };
}

/**
 * Initialize a Paystack transaction.
 *
 * @param {Object}  opts
 * @param {string}  opts.email        – Customer email
 * @param {number}  opts.amount       – Amount in Naira (will be converted to kobo)
 * @param {string}  opts.callbackUrl  – URL Paystack redirects to after payment
 * @param {Object}  [opts.metadata]   – Arbitrary metadata (bookingId, route, etc.)
 * @returns {Promise<Object>}         – Paystack response data
 */
async function initializeTransaction({ email, amount, callbackUrl, metadata = {} }) {
  const { data } = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      email,
      amount:       Math.round(amount * 100),   // Naira → kobo
      metadata,
      callback_url: callbackUrl,
    },
    { headers: _headers() }
  );
  return data;
}

/**
 * Verify a Paystack transaction by reference.
 *
 * @param {string} reference – The transaction reference from Paystack
 * @returns {Promise<Object>} – Paystack response data
 */
async function verifyTransaction(reference) {
  const { data } = await axios.get(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: _headers() }
  );
  return data;
}

/**
 * Check whether the Paystack secret key is configured.
 *
 * @returns {boolean}
 */
function isConfigured() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(key && key.startsWith('sk_'));
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  isConfigured,
};
