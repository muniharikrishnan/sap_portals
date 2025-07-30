const axios = require('axios');
const { parseStringPromise } = require('xml2js');

// ✅ Use base URL from .env
const SAP_URL = `${process.env.SAP_BASE_URL}zsrv_cu_login_901548?sap-client=${process.env.SAP_CLIENT}`;

exports.login = async (customerId, password) => {
  const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:urn="urn:sap-com:document:sap:rfc:functions">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:ZCU_LOGIN_FM>
          <WF_CUSTOMER>${customerId}</WF_CUSTOMER>
          <WF_PASSWORD>${password}</WF_PASSWORD>
        </urn:ZCU_LOGIN_FM>
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
    console.log("Parsed SOAP Response:", JSON.stringify(result, null, 2));

    const envelopeKey = Object.keys(result).find(key => key.includes('Envelope'));
    if (!envelopeKey) throw new Error("SOAP Envelope not found");

    const bodyKey = Object.keys(result[envelopeKey]).find(key => key.includes('Body'));
    if (!bodyKey) throw new Error("SOAP Body not found");

    const body = result[envelopeKey][bodyKey][0];
    const responseKey = Object.keys(body).find(key => key.includes('ZCU_LOGIN_FMResponse'));
    if (!responseKey) throw new Error("SAP Response not found");

    const responseObj = body[responseKey][0];
    const verify = responseObj['WF_VERIFY']?.[0] || 'Unknown';

    return {
      status: verify === 'Successful',
      message: verify,
      customerId,
    };

  } catch (err) {
    console.error('SAP Login Error:', err.message);
    return {
      status: false,
      message: 'SAP connection failed',
    };
  }
};
