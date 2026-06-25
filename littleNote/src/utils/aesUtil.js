import CryptoJS from 'crypto-js';
 
const key= "8F6B2CK33DZE20A08O74C231B47AC8F9"
/**
 * 加密 --api
 * @param word string
 * @returns {*} string
 */
 export function cipherText(word){//word 为 string  mode为加密规则
    var secretKey = CryptoJS.enc.Utf8.parse(key);//key  为你的秘钥
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, secretKey, {mode:CryptoJS.mode.ECB,padding: CryptoJS.pad.Pkcs7});
    return encrypted.toString();
}
/**
 * 解密 --api
 * @param word string
 * @returns {*} string
 */
export function decrypted(word){
    var secretKey = CryptoJS.enc.Utf8.parse(key);
    var decrypt = CryptoJS.AES.decrypt(word, secretKey, {mode:CryptoJS.mode.ECB,padding: CryptoJS.pad.Pkcs7});
    return CryptoJS.enc.Utf8.stringify(decrypt).toString();
}