const axios = require('axios');
const getImageBuffer = async(urlPath)=>{
    const input = (await axios({ url: urlPath, responseType: "arraybuffer" })).data;
    return input;
}
module.exports={
    getImageBuffer
}
