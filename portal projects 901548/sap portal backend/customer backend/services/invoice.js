const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// Use correct service URL from .env
const SAP_INVOICE_URL = `${process.env.SAP_BASE_URL}zsrv_cu_invoice_901548?sap-client=${process.env.SAP_CLIENT}`;

router.get('/invoices/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr.trim().padStart(10, '0'); // pad KUNNR to 10 digits
  console.log('Received KUNNR:', kunnr);

  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZCU_INVOICE_FM_48>
          <KUNNR>${kunnr}</KUNNR>
        </urn:ZCU_INVOICE_FM_48>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

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

    const result = await parseStringPromise(data);
    const envelopeKey = Object.keys(result).find(k => k.includes('Envelope'));
    const bodyKey = Object.keys(result[envelopeKey]).find(k => k.includes('Body'));
    const body = result[envelopeKey][bodyKey][0];
    const responseKey = Object.keys(body).find(k => k.includes('ZCU_INVOICE_FM_48Response'));

    const items = body[responseKey][0]?.ET_INVOICE_RES?.[0]?.item || [];

    const invoices = items.map(item => ({
      vbeln: item.VBELN?.[0] || '',
      fkdat: item.FKDAT?.[0] || '',
      waerk: item.WAERK?.[0] || '',
      netwr: parseFloat(item.NETWR?.[0] || '0'),
      kunag: item.KUNAG?.[0] || '',
      vkorg: item.VKORG?.[0] || '',
      knumv: item.KNUMV?.[0] || '',
      fkart: item.FKART?.[0] || '',
      posnr: item.POSNR?.[0] || '',
      matnr: item.MATNR?.[0] || '',
      arktx: item.ARKTX?.[0] || '',
      fkimg: parseFloat(item.FKIMG?.[0] || '0'),
      vrkme: item.VRKME?.[0] || '',
      item_netwr: parseFloat(item.ITEM_NETWR?.[0] || '0'),
      prsdt: item.PRSDT?.[0] || '',
      erdat: item.ERDAT?.[0] || '',
      ernam: item.ERNAM?.[0] || '',
    }));

    res.json({ success: true, data: invoices });

  } catch (err) {
    console.error('Invoice SOAP Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice data',
      error: err.message,
    });
  }
});

module.exports = router;
