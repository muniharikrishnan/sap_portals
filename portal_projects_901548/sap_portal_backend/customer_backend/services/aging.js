const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// Construct full SOAP endpoint using env variable
const SAP_AGING_URL = `${process.env.SAP_BASE_URL}zsrv_cu_aging_901548?sap-client=${process.env.SAP_CLIENT}`;

router.get('/aging/:kunnr', async (req, res) => {
  const { kunnr } = req.params;

  const soapEnvelope = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZCU_AGING_FM_48>
          <KUNNR>${kunnr}</KUNNR>
        </urn:ZCU_AGING_FM_48>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    const { data } = await axios.post(
      SAP_AGING_URL,
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
        },
        auth: {
          username: process.env.SAP_USER,
          password: process.env.SAP_PASS,
        },
        responseType: 'text',
      }
    );

    const parsed = await parseStringPromise(data);
    const envelopeKey = Object.keys(parsed).find(k => k.includes('Envelope'));
    const bodyKey = Object.keys(parsed[envelopeKey]).find(k => k.includes('Body'));
    const body = parsed[envelopeKey][bodyKey][0];

    const responseKey = Object.keys(body).find(k => k.includes('ZCU_AGING_FM_48Response'));
    if (!responseKey) throw new Error('Invalid response structure');

    const items = body[responseKey][0]?.ET_AGING_DATA?.[0]?.item || [];

    const normalized = items.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      fkdat: item.FKDAT?.[0] || '',
      due_dt: item.DUE_DT?.[0] || '',
      netwr: item.NETWR?.[0] || '',
      waerk: item.WAERK?.[0] || '',
      aging: item.AGING?.[0] || '',
      meaning: item.MEANING?.[0] || '',
    }));

    res.json({
      success: true,
      data: normalized,
    });
  } catch (err) {
    console.error('SAP Aging Fetch Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch aging data',
      error: err.message,
    });
  }
});

module.exports = router;
