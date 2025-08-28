const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// Corrected SAP endpoint using new service definition
const SAP_OVERALL_URL = `${process.env.SAP_BASE_URL}zsrv_cu_overall_901548?sap-client=${process.env.SAP_CLIENT}`;

router.get('/overallSales/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr.trim().padStart(10, '0'); // Ensure 10-digit customer number

  const xmlBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZCU_CUST_OVERALL_FM_48>
         <IV_KUNNR>${kunnr}</IV_KUNNR>
      </urn:ZCU_CUST_OVERALL_FM_48>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const { data } = await axios.post(SAP_OVERALL_URL, xmlBody, {
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
    if (!envelopeKey) throw new Error('SOAP response missing Envelope');

    const bodyKey = Object.keys(result[envelopeKey]).find(k => k.includes('Body'));
    if (!bodyKey) throw new Error('SOAP response missing Body');

    const body = result[envelopeKey][bodyKey][0];

    const responseKey = Object.keys(body).find(k => k.includes('ZCU_CUST_OVERALL_FM_48Response'));
    if (!responseKey) throw new Error('SOAP response missing ZCU_CUST_OVERALL_FM_48Response');

    const response = body[responseKey][0];
    const records = response?.ET_OVERALL_DATA?.[0]?.item || [];

    const formatted = records.map(item => ({
      waerk: item.WAERK?.[0] || '',
      auart: item.AUART?.[0] || '',
      kunnr: item.KUNNR?.[0] || '',
      vkorg: item.VKORG?.[0] || '',
      record_type: item.RECORD_TYPE?.[0] || '',
      document_no: item.DOCUMENT_NO?.[0] || '',
      doc_date: item.DOC_DATE?.[0] || '',
      total_orders: Number(item.TOTAL_ORDERS?.[0] || 0),
      total_order_value: Number(item.TOTAL_ORDER_VALUE?.[0] || 0),
      total_billed: Number(item.TOTAL_BILLED?.[0] || 0),
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error('ZCU_CUST_OVERALL_FM_48 SOAP Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overall sales data',
      error: err.message,
    });
  }
});

module.exports = router;
