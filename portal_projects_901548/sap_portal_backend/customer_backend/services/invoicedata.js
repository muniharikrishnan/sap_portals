const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// Full SAP WebService URL using your service name and credentials
const SAP_INVOICE_URL = `${process.env.SAP_BASE_URL}zsrv_cu_invoicepdf2_901548?sap-client=${process.env.SAP_CLIENT}`;

router.get('/invoice-data/:vbeln', async (req, res) => {
  const vbeln = req.params.vbeln;

  // Construct the SOAP XML body with dynamic invoice number
  const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZCU_INVOICEPDF_FM_48>
         <P_VBELN>${vbeln}</P_VBELN>
      </urn:ZCU_INVOICEPDF_FM_48>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const { data } = await axios.post(SAP_INVOICE_URL, xmlBody, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
      },
      auth: {
        username: process.env.SAP_USER,
        password: process.env.SAP_PASS,
      },
      responseType: 'text',
    });

    const parsed = await parseStringPromise(data);

    // Dynamically extract the envelope and body keys
    const envelopeKey = Object.keys(parsed).find(k => k.includes('Envelope'));
    const bodyKey = Object.keys(parsed[envelopeKey]).find(k => k.includes('Body'));
    const body = parsed[envelopeKey][bodyKey][0];
    const responseKey = Object.keys(body).find(k => k.includes('ZCU_INVOICEPDF_FM_48Response'));
    const response = body[responseKey][0];

    const base64Pdf = response.X_PDF?.[0] || '';

    if (!base64Pdf) {
      return res.status(404).json({ success: false, message: 'No PDF data returned from SAP' });
    }

    res.json({
      success: true,
      filename: `Invoice_${vbeln}.pdf`,
      base64: base64Pdf,
    });

  } catch (error) {
    console.error('SOAP Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice PDF',
      error: error.message,
    });
  }
});

module.exports = router;
