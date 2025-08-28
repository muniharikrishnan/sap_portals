const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

const router = express.Router();

// Construct SOAP endpoint dynamically from .env
const SAP_MEMO_URL = `${process.env.SAP_BASE_URL}zsrv_cu_memo2_901548?sap-client=${process.env.SAP_CLIENT}`;

router.get('/cdmemo/:kunnr', async (req, res) => {
  const kunnr = req.params.kunnr;
  const dateFrom = req.query.from || '';
  const dateTo = req.query.to || '';

  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZCU_CUST_MEMO2_FM_48>
          <IV_KUNNR>${kunnr}</IV_KUNNR>
          <IV_DATE_FROM>${dateFrom}</IV_DATE_FROM>
          <IV_DATE_TO>${dateTo}</IV_DATE_TO>
        </urn:ZCU_CUST_MEMO2_FM_48>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    const { data } = await axios.post(SAP_MEMO_URL, xmlBody, {
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
    const envelopeKey = Object.keys(parsed).find(k => k.includes('Envelope'));
    const bodyKey = Object.keys(parsed[envelopeKey]).find(k => k.includes('Body'));
    const body = parsed[envelopeKey][bodyKey][0];

    const responseKey = Object.keys(body).find(k => k.includes('ZCU_CUST_MEMO2_FM_48Response'));
    if (!responseKey) throw new Error('Invalid SAP memo response structure');

    const memoItems = body[responseKey][0]?.ET_MEMO_DATA?.[0]?.item || [];

    const result = memoItems.map(item => ({
      memoId: item.WF_MEMO_ID?.[0] || '',
      memoType: item.WF_MEMO_TYPE?.[0] || '',
      referenceDoc: item.WF_REFERENCE_DOC?.[0] || '',
      customerId: item.WF_CUSTOMER_ID?.[0] || '',
      customerName: item.WF_CUSTOMER_NAME?.[0] || '',
      billingDate: item.WF_BILLING_DATE?.[0] || '',
      createdDate: item.WF_CREATED_DATE?.[0] || '',
      createdBy: item.WF_CREATED_BY?.[0] || '',
      currency: item.WF_CURRENCY?.[0] || '',
      netValue: item.WF_NET_VALUE?.[0] || '',
      taxAmount: item.WF_TAX_AMOUNT?.[0] || '',
      salesOrg: item.WF_SALES_ORG?.[0] || '',
      distChannel: item.WF_DIST_CHANNEL?.[0] || '',
      division: item.WF_DIVISION?.[0] || '',
      memoDirection: item.WF_MEMO_DIRECTION?.[0] || '',
    }));

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error('SAP CDMemo Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memo data',
      error: err.message,
    });
  }
});

module.exports = router;
