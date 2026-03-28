import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
    const { data: order, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', '51f493b7-9a16-456d-8425-5153405bedf5').single();
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(order, null, 2));
})();
