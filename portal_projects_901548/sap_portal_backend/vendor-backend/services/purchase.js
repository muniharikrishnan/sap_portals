const express = require('express');
const axios = require('axios');
const https = require('https');
const router = express.Router();

// SAP OData credentials and config
const SAP_URL = 'https://AZKTLDS5CP.kcloud.com:44300/sap/opu/odata/SAP/ZSD_VENDORPORTAL_SRV';
const SAP_USERNAME = 'K901548';
const SAP_PASSWORD = '123456Srikrishna$';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Use only in dev; secure this in production!
});

// Route to get purchase data for a vendor
router.get('/purchase/:lifnr', async (req, res) => {
  try {
    const rawLifnr = req.params.lifnr || '';
    const vendorId = rawLifnr.trim().padStart(10, '0'); // SAP expects padded VendorId

    const odataUrl = `${SAP_URL}/ZMMVPURCHASESet?$filter=VendorId eq '${vendorId}'`;

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

    // Format the response
    const purchaseData = entries.map(entry => ({
      vendorId: entry.VendorId,
      poNumber: entry.PoNumber,
      docDate: entry.DocDate,
      deliveryDate: entry.DeliveryDate,
      material: entry.Material,
      itemNumber: entry.ItemNumber,
      unit: entry.Unit
    }));

    res.json({ status: 'success', purchase: purchaseData });
  } catch (err) {
    console.error('Error fetching purchase data:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch purchase data',
      details: err.message
    });
  }
});

module.exports = router;
