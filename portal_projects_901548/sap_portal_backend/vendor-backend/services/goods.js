const express = require('express');
const axios = require('axios');
const https = require('https');

const router = express.Router();

// SAP Auth and Base URL
const SAP_USERNAME = 'K901548';
const SAP_PASSWORD = '123456Srikrishna$';
const SAP_BASE_URL = 'https://AZKTLDS5CP.kcloud.com:44300/sap/opu/odata/SAP/ZSD_VENDORPORTAL_SRV';

// Trust SAP's self-signed cert
const agent = new https.Agent({ rejectUnauthorized: false });

// GET /api/goods/:lifnr
router.get('/goods/:lifnr', async (req, res) => {
  const lifnr = req.params.lifnr;

  if (!lifnr) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  // Add leading zeros to make it 10-digit
  const formattedLifnr = lifnr.padStart(10, '0');

  const url = `${SAP_BASE_URL}/ZMMVGOODSSet?$filter=VendorId eq '${formattedLifnr}'&$format=json`;

  try {
    const response = await axios.get(url, {
      httpsAgent: agent,
      auth: {
        username: SAP_USERNAME,
        password: SAP_PASSWORD,
      },
      headers: {
        Accept: 'application/json',
      },
    });

    const results = response.data.d?.results || [];

    if (!results.length) {
      return res.status(404).json({ status: 'failure', message: 'No goods data found for this vendor' });
    }

    res.status(200).json({
      status: 'success',
      goods: results.map(item => ({
        materialDoc: item.MaterialDoc,
        docYear: item.DocYear,
        postDate: item.PostDate,
        entryDate: item.EntryDate,
        poNumber: item.PoNumber,
        poItem: item.PoItem,
        material: item.Material,
        quantity: item.Quantity,
        unit: item.Unit,
        vendorId: item.VendorId,
      })),
    });
  } catch (error) {
    console.error('Error fetching goods:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve goods data',
      details: error.response?.data?.error?.message?.value || error.message,
    });
  }
});

module.exports = router;
