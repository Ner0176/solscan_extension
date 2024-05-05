function formatAmount (amount, decimals) {
    return (amount / Math.pow(10, decimals)).toFixed(2);
}

async function getTxData (txId) {
    const response = await fetch(`https://api.solscan.io/v2/transaction-v2/overview?tx=${txId}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "es-ES,es;q=0.9",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "sol-aut": "DjaZ0pbnOMVSB9dls0fKV=r-96okQHsNZUV7s521"
        },
        "referrer": "https://solscan.io/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit"
    });
    
    if (!response.ok) return null;

    const data = await response.json();
    if(data && data.data && data.data.render_summary_main_actions) {
        const txData = data.data.render_summary_main_actions[0].title[0];
        if(txData[1].text === "Swap") {
            let solAmount = "";
            if(txData[2].token_amount.token_address === "So11111111111111111111111111111111111111112") {
                const token = txData[2].token_amount;
                solAmount = `-${formatAmount(token.number, token.decimals)}`;
            } else {
                const token = txData[4].token_amount;
                solAmount = `+${formatAmount(token.number, token.decimals)}`;
            }
            return solAmount;
        }
    }
    return null;
}

async function executeScript() {
    const site = window.location.href;
    if (site.includes("solscan.io")) {
        const regex = /account\/(.*?)(\?|#|$)/;
        const match = site.match(regex);
        const wallet = match ? match[1] : null;
        if(wallet !== null) {
            const table = document.getElementsByTagName('table')[0];
            const headerRow = table.getElementsByTagName('tr')[0];
            const headerRowsTotal = table.getElementsByTagName('th');
            try {
                if(headerRowsTotal.length < 7) {
                    const headerHtmlToInject = '<th class="h-12 px-2 py-[10px] text-left align-middle font-bold text-[14px] leading-[24px] text-neutral7 bg-neutral1 first:sm:rounded-tl-lg last:sm:rounded-tr-lg [&amp;:has([role=checkbox])]:pr-0" style="min-width: 150px; width: unset;"></th>';
                    headerRow.insertAdjacentHTML('beforeend', headerHtmlToInject);
                }
                const tRows = table.getElementsByTagName('tr');
                for (const item of Array.from(tRows).slice(1)) {
                    const tData = item.querySelectorAll('td');
                    if (tData.length > 5) {
                        let action = "";
                        const txId = tData[1].textContent;
                        if(txId) {
                           action = await getTxData(txId);
                        }

                        const href = tData[5].querySelector('a').getAttribute('href');
                        if(href) {
                            const token = href.split("/token/")[1];
                            let url = "";
                            let htmlToInject = "";
                            if(token) {
                                url = `https://dexscreener.com/solana/${token}?maker=${wallet}`;
                                if(action) {
                                    htmlToInject = `
                                    <td style="display: flex; flex-direction: flex-row" class="px-2 py-[10px] align-middle text-center text-[14px] leading-[24px] font-normal text-neutral7 [&:has([role=checkbox])]:pr-0 border-t">
                                        <a class="mr-5 rounded-16 w-6 h-6" href="${url.split("?")[0]}" target="_blank">
                                            <img src="https://assets-global.website-files.com/6421d264d066fd2b24b91b20/661375b92a7e161501f4b5e5_dexscreener.322a5a2d.png" width="100%" height="100%" alt="dexscreener-token">
                                        </a>
                                        <a class="mr-5 rounded-16 w-6 h-6" href="${url}" target="_blank">
                                            <img src="https://cdn4.iconfinder.com/data/icons/bitcoin-16/1024/bitcoin_wallet-512.png" width="100%" height="100%" alt="dexscreener-token">
                                        </a>
                                        <div style="white-space: nowrap; color: ${action.charAt(0) === '+' ? '#22C55E' : 'red'}">${action} SOL</div>
                                    </td>`;
                                } else {
                                    htmlToInject = `<td class="flex flex-row px-2 py-[10px] align-middle text-center text-[14px] leading-[24px] font-normal text-neutral7 [&:has([role=checkbox])]:pr-0 border-t"><a class="mr-5 rounded-16" href="${url.split("?")[0]}" target="_blank"><img src="https://assets-global.website-files.com/6421d264d066fd2b24b91b20/661375b92a7e161501f4b5e5_dexscreener.322a5a2d.png" width="25" height="25" alt="dexscreener-token"></a><a class="rounded-16" href="${url}" target="_blank"><img src="https://cdn4.iconfinder.com/data/icons/bitcoin-16/1024/bitcoin_wallet-512.png" width="25" height="25" alt="dexscreener-token"></a></td>`;
                                }
                            } else {
                                htmlToInject = `<td class="h-12 w-100 px-2 py-[10px] align-middle text-center text-[14px] leading-[24px] font-normal text-neutral7 [&:has([role=checkbox])]:pr-0 border-t">Error: Token not found</td>`;
                            }
                            if(tData.length > 6) tData[6].innerHTML = htmlToInject;
                            else item.insertAdjacentHTML('beforeend', htmlToInject);
                        }
                    }
                };
            } catch (error) {
                console.error('Fetch error:', error);
            }
        }
    }
}

let previousUrl = '';
const observer = new MutationObserver(function(mutations) {
  if (window.location.href !== previousUrl) {
      previousUrl = window.location.href;
      if(previousUrl !== '') {
        setTimeout(function() {
            executeScript()
        }, 1000);
      }
    }
});
const config = {subtree: true, childList: true};

observer.observe(document, config);