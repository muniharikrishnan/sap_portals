require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const https = require('https');

const router = express.Router();
const agent = new https.Agent({ rejectUnauthorized: false });

// ✅ Updated SAP PAYPDF WSDL Endpoint
const SAP_PAYPDF_URL = 'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/zsrv_emp_paypdf_901548?sap-client=100';

router.post('/employee-paypdf', async (req, res) => {
  const { employeeId } = req.body;

  // ✅ Updated SOAP function and namespace
  const soapEnvelope = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:Z48_EMP_PAYPDF_FM>
          <EMPLOYEE_ID>${employeeId}</EMPLOYEE_ID>
        </urn:Z48_EMP_PAYPDF_FM>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    const response = await axios.post(SAP_PAYPDF_URL, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'urn:sap-com:document:sap:rfc:functions:Z48_EMP_PAYPDF_FM',
      },
      auth: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
      },
      httpsAgent: agent,
    });

    const xml = response.data;

    // 🔽 Parse XML to JSON
    const json = await parseStringPromise(xml, { explicitArray: false });

    const envelope = json['soap-env:Envelope'] || json['soapenv:Envelope'] || json['SOAP-ENV:Envelope'];
    const body = envelope?.['soap-env:Body'] || envelope?.['soapenv:Body'] || envelope?.['SOAP-ENV:Body'];

    if (!body) {
      return res.status(500).json({ error: 'SOAP Body not found' });
    }

    // ✅ Updated response tag
    const responseKey = Object.keys(body).find(key => key.includes('Z48_EMP_PAYPDF_FMResponse'));
    const result = body[responseKey];

    const base64PDF = result?.PAYSLIP_PDF;

    if (!base64PDF) {
      return res.status(404).json({ error: 'No PDF found in response.' });
    }

    // ✅ Return base64 PDF string
    res.json({ base64: base64PDF });

  } catch (error) {
    console.error('Error calling SAP PAYPDF:', error.message);
    res.status(500).json({ error: 'SAP PI/PO call failed' });
  }
});

module.exports = router;
