// Cloudflare Workers 脚本：监控 WIF 链上大额交易并价格突破提醒

export default {
  async fetch(request, env, ctx) {
    const WIF_ADDRESS = "7nBNkR1zz2MpBzwHaCKqjQCgDdJgK7Kn5vASkT2R8z7s";
    const API_URL = `https://public-api.solscan.io/token/txs?limit=10&tokenAddress=${WIF_ADDRESS}`;
    const SERVER_CHAN_KEY = "SCT276996TnfgV8m7kD1kybPEeGPKk8yTq"; // 👉 替换成你的 Server 酱 key
    const COINGECKO_API = `https://api.coingecko.com/api/v3/simple/price?ids=wif&vs_currencies=usd`;  // 获取 WIF 的实时价格

    try {
      // 获取 WIF 实时价格
      const priceResp = await fetch(COINGECKO_API);
      const priceData = await priceResp.json();
      const wifPrice = priceData.wif.usd; // WIF 当前价格（USD）
      
      // 设定价格阈值
      const priceThreshold = 0.50; // 当 WIF 价格突破 0.50 时提醒

      // 检查 WIF 价格突破阈值
      if (wifPrice >= priceThreshold) {
        const title = "🚨 WIF价格突破提醒";
        const desp = `当前WIF价格：$${wifPrice.toFixed(2)}，已突破设定阈值 ${priceThreshold}\n链接：https://www.coingecko.com/en/coins/wif`;

        await fetch(`https://sctapi.ftqq.com/${SERVER_CHAN_KEY}.send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(desp)}`
        });
      }

      // 获取链上交易数据
      const resp = await fetch(API_URL, {
        headers: { "accept": "application/json" }
      });
      const data = await resp.json();
      const txs = data || [];
      const threshold = 10000; // USD

      // 检查大额交易
      for (let tx of txs) {
        const amount = parseFloat(tx.changeAmount || 0);
        const totalValue = amount * wifPrice;

        if (totalValue >= threshold) {
          const title = "🐋 检测到WIF大额交易";
          const desp = `地址：${tx.owner}\n数量：${amount} WIF\n约合：$${totalValue.toFixed(2)}\n链接：https://solscan.io/tx/${tx.txHash}`;
          await fetch(`https://sctapi.ftqq.com/${SERVER_CHAN_KEY}.send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(desp)}`
          });
          break; // 每次运行只推一次
        }
      }

      return new Response("checked");
    } catch (e) {
      return new Response("Error: " + e.message);
    }
  }
};
