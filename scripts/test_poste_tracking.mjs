import axios from 'axios';

async function testPosteTracking() {
    const url = 'https://www.poste.it/online/dovequando/DQ-REST/ricercasemplice';
    const payload = {
        tipoRichiedente: "WEB",
        codiceSpedizione: "ZA123456789IT", // Example placeholder
        periodoRicerca: 1
    };

    console.log('--- Testing Poste Italiane Tracking API ---');
    console.log('URL:', url);
    console.log('Payload:', JSON.stringify(payload));

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                'Referer': 'https://www.poste.it/',
                'Origin': 'https://www.poste.it'
            }
        });

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        if (axios.isAxiosError(err)) {
            console.error('Error Status:', err.response?.status);
            console.error('Error Data:', JSON.stringify(err.response?.data, null, 2));
        } else {
            console.error('Unknown Error:', err);
        }
    }
}

testPosteTracking();
