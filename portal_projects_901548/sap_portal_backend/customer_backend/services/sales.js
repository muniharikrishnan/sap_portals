const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// Construct SOAP endpoint using env + service definition
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cu_sales_901548?sap-client=${process.env.SAP_CLIENT}`;

router.get('/sales/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr.trim().padStart(10, '0'); // Ensure 10-digit KUNNR

  const xmlBody = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:urn="urn:sap-com:document:sap:rfc:functions">
     <soapenv:Header/>
     <soapenv:Body>
        <urn:ZCU_SALES_FM_48>
           <KUNNR>${kunnr}</KUNNR>
        </urn:ZCU_SALES_FM_48>
     </soapenv:Body>
  </soapenv:Envelope>`;

  try {
    const { data } = await axios.post(SAP_URL, xmlBody, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: 'text',
    });

    const result = await parseStringPromise(data);
    const envelopeKey = Object.keys(result).find(k => k.includes('Envelope'));
    const bodyKey = Object.keys(result[envelopeKey]).find(k => k.includes('Body'));
    const body = result[envelopeKey][bodyKey][0];
    const responseKey = Object.keys(body).find(k => k.includes('ZCU_SALES_FM_48Response'));

    if (!responseKey) throw new Error("SAP Sales response not found");

    const response = body[responseKey][0];
    const salesItems = response.ET_SALES_RES?.[0]?.item || [];

    const normalized = salesItems.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      erdat: item.ERDAT?.[0] || '',
      auart: item.AUART?.[0] || '',
      netwr: parseFloat(item.NETWR?.[0] || '0'),
      waerk: item.WAERK?.[0] || '',
      vdatu: item.VDATU?.[0] || '',
      ernam: item.ERNAM?.[0] || '',
      posnr: item.POSNR?.[0] || '',
      matnr: item.MATNR?.[0] || '',
      arktx: item.ARKTX?.[0] || '',
      kwmeng: parseFloat(item.KWMENG?.[0] || '0'),
      vrkme: item.VRKME?.[0] || '',
    }));

    res.json({
      success: true,
      data: normalized
    });

  } catch (err) {
    console.error('SAP Sales Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data',
      error: err.message,
    });
  }
});

module.exports = router;
