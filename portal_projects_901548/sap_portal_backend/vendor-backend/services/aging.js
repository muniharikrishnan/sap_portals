const express = require('express');
const axios = require('axios');
const https = require('https');
const router = express.Router();

// SAP OData credentials and config
const SAP_URL = 'https://AZKTLDS5CP.kcloud.com:44300/sap/opu/odata/SAP/ZSD_VENDORPORTAL_SRV';
const SAP_USERNAME = 'K901548';
const SAP_PASSWORD = '123456Srikrishna$';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Use only for dev/test systems with self-signed certs
});
    
// Route: /aging/:lifnr
router.get('/aging/:lifnr', async (req, res) => {
  try {
    const rawLifnr = req.params.lifnr || '';
    const vendorId = rawLifnr.trim().padStart(10, '0');

    const odataUrl = `${SAP_URL}/ZMMVAGINGSet?$filter=VendorId eq '${vendorId}'`;

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

    const agingData = entries.map(entry => ({
      paymentDoc: entry.PaymentDoc,
      docYear: entry.DocYear,
      paymentDate: entry.PaymentDate,
      enrtyDate: entry.EnrtyDate,
      vendorId: entry.VendorId,
      amountPaid: entry.AmountPaid,
      currency: entry.Currency,
      clearingDoc: entry.ClearingDoc,
      refDocNo: entry.RefDocNo,
      dueDate: entry.DueDate,
      aging: entry.Aging
    }));

    res.json({ status: 'success', aging: agingData });
  } catch (error) {
    console.error('Error fetching aging data:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch aging data',
      details: error.message
    });
  }
});

module.exports = router;
