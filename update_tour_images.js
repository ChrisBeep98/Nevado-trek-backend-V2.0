const axios = require('axios');

const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app/admin/tours';
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

// Mapping from snippet code names to real IDs from our report
const ID_MAPPING = {
    tourNevado: "Au3wVFDw6Y2YlEtSlLoS",
    tourParamillo: "ONitksK15sinq78pRZYf",
    tourParamo: "CoOdCUSmd5veX1zRN0ut",
    tourTapir: "GqnHKJt5fQ4MpapSeq0r",
    tourCocora: "PXs66XnvyVtcw9Frg5ai",
    tourCarbonera: "WMqIKugakaBN0eVxOyFe"
};

// Data from user snippet
const legacyTours = {
    tourNevado: {
        img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_limit,h_800,w_1200/v1657649635/Nevado/nevado11_bntklr.jpg",
        img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_limit,h_800,q_100,w_1200/v1657649637/Nevado/nevado16_vmg8tl.jpg",
        img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_800,w_1200/v1659032505/Paramo/paramo001_qkakel.jpg",
        img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649637/Nevado/nevado14_ab2ath.jpg",
        img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_900,w_1200/v1657649637/Nevado/nevado17_pv6ycc.jpg",
        img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649641/Nevado/nevado05_anbrcb.jpg",
        img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649642/Nevado/nevado07_xxunum.jpg",
        img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649642/Nevado/nevado08_vlacxa.jpg",
        img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,q_90,w_1200/v1657649642/Nevado/nevado09_nlejbk.jpg",
        img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657649642/Nevado/nevado10_iq38dt.jpg"
    },
    tourParamillo: {
        img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_86,w_1200/v1657816320/Paramillo/paramillo09_hdu22r.jpg",
        img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816316/Paramillo/paramillo05_xobrk2.jpg",
        img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_86,w_1200,y_0/v1657816507/Paramo/paramo002_azlpkb.jpg",
        img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659032505/Paramo/paramo001_qkakel.jpg",
        img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816316/Paramillo/paramillo04_wlztch.jpg",
        img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816315/Paramillo/paramillo03_bccvbs.jpg",
        img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816313/Paramillo/paramillo11_aunffy.jpg",
        img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816320/Paramillo/paramillo07_ijbkci.jpg",
        img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816316/Paramillo/paramillo01_engtnk.jpg",
        img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_900,q_86,w_1200/v1657816318/Paramillo/paramillo06_ikqiez.jpg"
    },
    tourParamo: {
        img1High: "https://res.cloudinary.com/nevado-trek/image/upload/v1659207688/Paramo/WhatsApp-Image-2021-06-25-at-9.19.06-PM_aptx9r.jpg",
        img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659032505/Paramo/paramo001_qkakel.jpg",
        img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816502/Paramo/paramo05_uox5f6.jpg",
        img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816502/Paramo/paramo06_arh0gd.jpg",
        img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_91,w_1200/v1657816507/Paramo/paramo002_azlpkb.jpg",
        img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659033555/Paramo/20191225_100744_w46pku.jpg",
        img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816503/Paramo/paramo01_iyhzca.jpg",
        img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816506/Paramo/paramo02_r0llc1.jpg",
        img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,h_900,w_1200/v1657816507/Paramo/paramo004_rrjyau.jpg",
        img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,q_91,w_1200/v1657816507/Paramo/paramo002_azlpkb.jpg"
    },
    tourTapir: {
        img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,q_100,w_1200/v1657816756/Danta/tapir08_sorrju.jpg",
        img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816760/Danta/tapir03_auhiet.jpg",
        img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816760/Danta/tapir06_nfpo97.jpg",
        img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816759/Danta/tapir09_yxr6pz.jpg",
        img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_900,w_1200/v1657816758/Danta/tapir02_j9ax5f.jpg",
        img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_900,w_1200,x_0/v1657816758/Danta/tapir01_b3gotr.jpg",
        img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,q_95,w_1200/v1657816756/Danta/tapir07_eru2i2.jpg",
        img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_900,w_1200/v1657816765/Danta/20191216_144316_llrkhc.jpg",
        img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1657816761/Danta/tapir05_ftl8tb.jpg",
        img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1657816756/Danta/tapir10_z1pkqy.jpg"
    },
    tourCocora: {
        img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1659211299/Cocora/188621298_2932615863642648_2412688555026943222_n_hbx3m6.jpg",
        img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210770/Cocora/cocora05_wyutzi.jpg",
        img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1659211299/Cocora/125118665_2723064054621390_336035995996606345_n_gonwca.jpg",
        img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210770/Cocora/cocora02_luouz6.jpg",
        img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210769/Cocora/cocora01_trnl4o.jpg",
        img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210771/Cocora/cocora06_svcqqf.jpg",
        img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659211299/Cocora/e648342235402786053db7082b1dcc66_xbiutq.jpg",
        img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659210772/Cocora/cocora10_laua0s.jpg",
        img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659210770/Cocora/cocora08_mtmgjn.jpg",
        img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_900,w_1200/v1659210770/Cocora/cocora03_dnb2th.jpg"
    },
    tourCarbonera: {
        img1High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_800,w_1200/v1659293663/Carbonera/carbonera06_rkmo5k.jpg",
        img2High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,q_95,w_1200/v1659293661/Carbonera/carbonera01_sywyf1.jpg",
        img3High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_800,w_1200/v1659293664/Carbonera/carbonera10_zjk2ga.jpg",
        img4High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659293661/Carbonera/carbonera09_xwtwfn.jpg",
        img5High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,h_800,w_1200/v1659293662/Carbonera/carbonera08_ntlyez.jpg",
        img6High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659293663/Carbonera/carbonera04_cmg9ct.jpg",
        img7High: "https://res.cloudinary.com/nevado-trek/image/upload/c_scale,w_1200/v1659293661/Carbonera/carbonera03_wxtzpf.jpg",
        img8High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659293662/Carbonera/carbonera11_pxi4me.jpg",
        img9High: "https://res.cloudinary.com/nevado-trek/image/upload/c_fill,w_1200/v1659293661/Carbonera/carbonera02_fdhalz.jpg",
        img10High: "https://res.cloudinary.com/nevado-trek/image/upload/c_lpad,h_800,w_1200/v1659293663/Carbonera/carbonera05_rw3jou.jpg"
    }
};

async function updateTourImages() {
    for (const [key, id] of Object.entries(ID_MAPPING)) {
        console.log(`Processing ${key} (${id})...`);
        
        const data = legacyTours[key];
        if (!data) {
            console.log(`No legacy data found for ${key}, skipping.`);
            continue;
        }

        const images = [];
        // Extract all imgXHigh properties
        for (let i = 1; i <= 20; i++) {
            const highKey = `img${i}High`;
            if (data[highKey]) {
                images.push(data[highKey]);
            }
        }

        if (images.length === 0) {
            console.log(`No images found in data for ${key}, skipping.`);
            continue;
        }

        console.log(`Found ${images.length} images to update.`);

        try {
            await axios.put(`${API_URL}/${id}`, { images }, {
                headers: { 'X-Admin-Secret-Key': ADMIN_KEY }
            });
            console.log(`✅ Updated ${key} successfully.`);
        } catch (error) {
            console.error(`❌ Error updating ${key}:`, error.message);
            if (error.response) console.error(error.response.data);
        }
    }
}

updateTourImages();
