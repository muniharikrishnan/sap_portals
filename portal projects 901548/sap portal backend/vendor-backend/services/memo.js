const express = require('express');
const axios = require('axios');
const https = require('https');
const router = express.Router();

// SAP Configuration
const SAP_URL = 'https://AZKTLDS5CP.kcloud.com:44300/sap/opu/odata/SAP/ZSD_VENDORPORTAL_SRV';
const SAP_USERNAME = 'K901548';
const SAP_PASSWORD = '123456Srikrishna$';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Use only for dev/self-signed certs
});

// GET /memo/:lifnr
router.get('/memo/:lifnr', async (req, res) => {
  try {
    const rawLifnr = req.params.lifnr || '';
    const vendorId = rawLifnr.trim().padStart(10, '0'); // Left-pad to 10 digits

    const odataUrl = `${SAP_URL}/ZMMVMEMOSet?$filter=VendorId eq '${vendorId}'`;

    const response = await axios.get(odataUrl, {
      httpsAgent,
      auth: {
        username: SAP_USERNAME,
        password: SAP_PASSWORD
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    const entries = response.data?.d?.results || [];

    // Map results
    const memoData = entries.map(entry => ({
      memoDoc: entry.MemoDoc,
      docYear: entry.DocYear,
      postingDate: entry.PostingDate,
      entryDate: entry.EntryDate,
      vendorId: entry.VendorId,
      memoType: entry.MemoType,
      amount: entry.Amount,
      currency: entry.Currency,
      referenceDocNo: entry.ReferenceDocNo,
      docType: entry.DocType,
      companyCode: entry.CompanyCode
    }));

    res.json({ status: 'success', memo: memoData });

  } catch (err) {
    console.error('Memo fetch error:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch memo data',
      details: err.message
    });
  }
});

module.exports = router;
