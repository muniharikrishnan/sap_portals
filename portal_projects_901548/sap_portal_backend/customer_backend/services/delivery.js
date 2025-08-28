const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// ✅ SAP Delivery Service URL from .env
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cu_del_901548?sap-client=100`;

router.get('/delivery/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr.trim().padStart(10, '0'); // Ensure 10-digit KUNNR

  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZCU_DELIVERY_FM_48>
          <KUNNR>${kunnr}</KUNNR>
        </urn:ZCU_DELIVERY_FM_48>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    const { data } = await axios.post(SAP_URL, xmlBody, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: 'text',
    });

    const result = await parseStringPromise(data);

    const envelopeKey = Object.keys(result).find(key => key.includes('Envelope'));
    const bodyKey = Object.keys(result[envelopeKey]).find(key => key.includes('Body'));
    const body = result[envelopeKey][bodyKey][0];

    const responseKey = Object.keys(body).find(key => key.includes('ZCU_DELIVERY_FM_48Response'));
    if (!responseKey) throw new Error("SAP Delivery Response not found");

    const response = body[responseKey][0];
    const deliveryItems = response.ET_DELIVERY_RES?.[0]?.item || [];

    const deliveryData = deliveryItems.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      erdat: item.ERDAT?.[0] || '',
      vstel: item.VSTEL?.[0] || '',
      vkorg: item.VKORG?.[0] || '',
      lfart: item.LFART?.[0] || '',
      lfdat: item.LFDAT?.[0] || '',
      posnr: item.POSNR?.[0] || '',
      matnr: item.MATNR?.[0] || '',
      arktx: item.ARKTX?.[0] || '',
      lfimg: item.LFIMG?.[0] || '',
    }));

    res.json({
      success: true,
      data: deliveryData,
    });

  } catch (err) {
    console.error('SAP Delivery Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'SAP connection failed',
      error: err.message,
    });
  }
});

module.exports = router;
