/**
 * INONEGO Lead Capture - Google Apps Script
 *
 * What this does:
 *   1. Receives form POSTs from index.html (Contact form, Get Started modal, Lead popup)
 *   2. Appends each lead as a new row in a Google Sheet
 *   3. Sends an email notification with the lead's details
 *
 * ===== SETUP =====
 * 1. Create a new Google Sheet. Rename the first tab to "Leads".
 *    In row 1, add these headers (must match exactly, in this order):
 *    Timestamp | Source | Name | Phone | Email | Channel Link | Plan | Service | Message | Page URL
 *
 * 2. In the Sheet, go to Extensions -> Apps Script. Delete any starter code
 *    and paste this entire file in.
 *
 * 3. Update NOTIFY_EMAIL below to the inbox that should receive lead alerts.
 *
 * 4. Click Deploy -> New deployment -> select type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy and authorize the requested permissions.
 *
 * 5. Copy the Web App URL it gives you (ends in /exec).
 *    Paste that URL into index.html as the value of LEAD_ENDPOINT
 *    (search for "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE").
 *
 * 6. Test: submit any form on the site, then check the "Leads" sheet
 *    and the NOTIFY_EMAIL inbox.
 *
 * Note: if you ever change the form field names in index.html, update
 * the e.parameter keys read below to match.
 */

const SHEET_NAME = 'Leads';
const NOTIFY_EMAIL = 'contact@adstube.in'; // <-- change to the inbox that should get lead alerts

function doPost(e) {
  try {
    const params = e.parameter || {};

    const row = {
      timestamp: new Date(),
      source: params.source || '',
      name: params.name || '',
      phone: params.phone || '',
      email: params.email || '',
      channelLink: params.channel_link || '',
      plan: params.plan || '',
      service: params.service || '',
      message: params.message || '',
      pageUrl: params.page_url || ''
    };

    appendToSheet(row);
    sendNotificationEmail(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function appendToSheet(row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Source', 'Name', 'Phone', 'Email', 'Channel Link', 'Plan', 'Service', 'Message', 'Page URL']);
  }
  sheet.appendRow([
    row.timestamp,
    row.source,
    row.name,
    row.phone,
    row.email,
    row.channelLink,
    row.plan,
    row.service,
    row.message,
    row.pageUrl
  ]);
}

function sendNotificationEmail(row) {
  const subject = 'New INONEGO Lead: ' + (row.name || 'Unknown') + ' (' + (row.source || 'Website') + ')';
  const body =
    'New lead received from the website.\n\n' +
    'Source: ' + row.source + '\n' +
    'Name: ' + row.name + '\n' +
    'Phone: ' + row.phone + '\n' +
    'Email: ' + row.email + '\n' +
    'Channel Link: ' + row.channelLink + '\n' +
    'Plan: ' + row.plan + '\n' +
    'Service: ' + row.service + '\n' +
    'Message: ' + row.message + '\n' +
    'Page URL: ' + row.pageUrl + '\n' +
    'Submitted At: ' + row.timestamp;

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}
