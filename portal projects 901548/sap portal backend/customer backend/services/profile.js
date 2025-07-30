const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// ✅ Use environment variables for URL and client
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cu_profile_901548?sap-client=${process.env.SAP_CLIENT}`;

router.get('/profile/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr;

  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZCU_PROFILE_FM>
          <KUNNR>${kunnr}</KUNNR>
        </urn:ZCU_PROFILE_FM>
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
    if (!envelopeKey) throw new Error("SOAP Envelope not found");

    const bodyKey = Object.keys(result[envelopeKey]).find(key => key.includes('Body'));
    if (!bodyKey) throw new Error("SOAP Body not found");

    const body = result[envelopeKey][bodyKey][0];

    const responseKey = Object.keys(body).find(key => key.includes('ZCU_PROFILE_FMResponse'));
    if (!responseKey) throw new Error("SAP Profile Response not found");

    const response = body[responseKey][0];

    const profile = {
      name1: response.EV_NAME1?.[0] || '',
      street: response.EV_STREET?.[0] || '',
      city: response.EV_CITY?.[0] || '',
      postcode: response.EV_POSTCODE?.[0] || '',
      country: response.EV_COUNTRY?.[0] || '',
    };

    res.json({
      success: true,
      data: profile
    });

  } catch (err) {
    console.error('SAP Profile Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'SAP connection failed',
      error: err.message
    });
  }
});

module.exports = router;
