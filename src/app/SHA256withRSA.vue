<style scoped>
  div { margin-bottom: 10px }
  input, button { margin-top: 5px; }
</style>

<template>
  <div>
    <h1>RSA 加密、解密、加签和验签操作</h1>
    <div>
      <h2>生成 RSA 密钥对</h2>
      <button @click="generateKeys">生成密钥对</button>
      <div v-if="keys">
        <p>公钥: {{ keys.publicKey }}</p>
        <p>私钥: {{ keys.privateKey }}</p>
      </div>
    </div>
    <div>
      <h2>RSA 加密</h2>
      <input v-model="plainText" type="text" placeholder="输入明文" />
      <button @click="encrypt" :disabled="!keys">加密</button>
      <div v-if="encryptedText">
        <p>密文: {{ encryptedText }}</p>
      </div>
    </div>
    <div>
      <h2>RSA 解密</h2>
      <input v-model="cipherText" type="text" placeholder="输入密文" />
      <button @click="decrypt" :disabled="!keys">解密</button>
      <div v-if="decryptedText">
        <p>明文: {{ decryptedText }}</p>
      </div>
    </div>
    <div>
      <h2>SHA256 和 RSA 加签</h2>
      <input v-model="signMsg" type="text" placeholder="输入加签内容" />
      <button @click="sign" :disabled="!keys">加签</button>
      <div v-if="signature">
        <p>签名: {{ signature }}</p>
      </div>
    </div>
    <div>
      <h2>SHA256 和 RSA 验签</h2>
      <input v-model="verifyMsg" type="text" placeholder="输入原内容" />
      <input v-model="verifySignature" type="text" placeholder="输入签名字符串" />
      <button @click="verify" :disabled="!keys">验签</button>
      <div v-if="verificationResult!== undefined">
        <p>验签结果: {{ verificationResult }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

// import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'
import JsRsaSign from 'jsrsasign'

export default {
  name: 'RSAComponent',
  setup()
  {
    const plainText = ref('')
    const cipherText = ref('')
    const signMsg = ref('')
    const verifyMsg = ref('')
    const verifySignature = ref('')
    const keys = ref(null)
    const encryptedText = ref('')
    const decryptedText = ref('')
    const signature = ref('')
    const verificationResult = ref(undefined)

    const generateKeys = () =>
    {
      keys.value = generateRsaKeyWithPKCS8()
    }

    const encrypt = () =>
    {
      if (keys.value)
        encryptedText.value = encryptByRSA(keys.value.publicKey, plainText.value)
    }

    const decrypt = () =>
    {
      if (keys.value)
        decryptedText.value = decryptByRSA(keys.value.privateKey, cipherText.value)
    }

    const sign = () =>
    {
      if (keys.value)
        signature.value = signBySHA256WithRSA(keys.value.privateKey, signMsg.value)
    }

    const verify = () =>
    {
      if (keys.value)
      {
        verificationResult.value = verifyBySHA256WithRSA(
          keys.value.publicKey,
          verifySignature.value,
          verifyMsg.value
        )
      }
    }

    const encryptByRSA = (publicKey, plainText) =>
    {
      const encryptor = new JSEncrypt()
      // encryptor.setPublicKey(publicKey)
      encryptor.setPublicKey('-----BEGIN PUBLIC KEY----- MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDG6ixrzGEIUqO+ta92wSnL2NUP 4nz8/MM2RpGyP9t702RwgXp5kjSVkrpK4bW9uvOutAIdWk5XIQfUm+foF8Fi+YZ8 uanBaC0Dsi4Hum7Nf28A4jwNHmgJnVeg7RyVauvVNsFKzJo6/AzBF4rYjBw5Bb4O lYezTk2tzE94RmFwNwIDAQAB -----END PUBLIC KEY-----')
      return encryptor.encrypt(plainText)
    }

    const decryptByRSA = (privateKey, cipherText) =>
    {
      const decrypter = new JSEncrypt()
      // decrypter.setPrivateKey(privateKey)
      decrypter.setPrivateKey('-----BEGIN PRIVATE KEY----- MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAMbqLGvMYQhSo761 r3bBKcvY1Q/ifPz8wzZGkbI/23vTZHCBenmSNJWSukrhtb268660Ah1aTlchB9Sb 5+gXwWL5hny5qcFoLQOyLge6bs1/bwDiPA0eaAmdV6DtHJVq69U2wUrMmjr8DMEX itiMHDkFvg6Vh7NOTa3MT3hGYXA3AgMBAAECgYAFsaZb35nXdyYgy2qeZ6EeqLJQ phcV1tZvs01wYMuTm9WAMvSijkDbFzwl8JgXOkbHdXeqB2++pr9mop/c0PFEKxug 5TgjVa5bIGS059UgHXI+EZYkeT/B223EP4WYBynodD7XaieKQiicKs180IP53CHi kssR2ehk+hp+CqJQYQJBAOhn5Sj7uda7tDsBkKwtKrtegG8NbVx/IiKsjBzu01MF fZxv4V6aRf8SjmKZ9rFwi3Cdg5yHGWcAaRXpEb2ph50CQQDbG9zFfEhGbniTCM7c 2nqRhnhJH5rti6/qEkohQgQJcZWI8ntOe86MJHTVdzYvttEMJ9C/dvYEeIrJB/M1 J/DjAkBPrO6/ci1wFMHhSNQUcxenTOqzJ+NKRrupL4aJlMcWO1eo/iJBkJpWrEHs Q+RzSKZFYXrxes+WpGlifZj7cNdxAkARH9JXVOlJJ+UgiLWyKRkfOoU4IdI38ozj HF7SzpgGLOxk8Z6VebOg3FCNRm3juMQJ0SrNa/y6SLmAELD/XInFAkBQ/S9eWHC9 gtZYKx8D2P5K6k4ItXqzuzcRedyIeIyZCS2jNaVoXXZZJ/GBQcvT40H99H8ftKPi rw9YKvJdiSdt -----END PRIVATE KEY-----')
      return decrypter.decrypt(cipherText)
    }

    const generateRsaKeyWithPKCS8 = () =>
    {
      const keyPair = JsRsaSign.KEYUTIL.generateKeypair('RSA', 1024)
      const privateKey = JsRsaSign.KEYUTIL.getPEM(keyPair.prvKeyObj, 'PKCS8PRV')
      const publicKey = JsRsaSign.KEYUTIL.getPEM(keyPair.pubKeyObj)
      return { privateKey, publicKey }
    }

    const signBySHA256WithRSA = (privateKey, msg) =>
    {
      const key = JsRsaSign.KEYUTIL.getKey(privateKey)
      const signature = new JsRsaSign.KJUR.crypto.Signature({
        alg: 'SHA256withRSA'
      })
      signature.init(key)
      signature.updateString(msg)
      return JsRsaSign.hextob64(signature.sign())
    }

    const verifyBySHA256WithRSA = (publicKey, base64SignStr, msg) =>
    {
      const key = JsRsaSign.KEYUTIL.getKey(publicKey)
      const signature = new JsRsaSign.KJUR.crypto.Signature({
        alg: 'SHA256withRSA'
      })
      signature.init(key)
      signature.updateString(msg)
      return signature.verify(JsRsaSign.b64tohex(base64SignStr))
    }

    return {
      plainText,
      cipherText,
      signMsg,
      verifyMsg,
      verifySignature,
      keys,
      encryptedText,
      decryptedText,
      signature,
      verificationResult,
      generateKeys,
      encrypt,
      decrypt,
      sign,
      verify
    }
  }
}
</script>

